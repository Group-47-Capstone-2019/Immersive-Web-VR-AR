import THREE from '../three';
import XrScene from './xr-scene';

export default class LaserScene extends XrScene {
  /**
  *
  * @param {THREE.Renderer} renderer
  * @param {THREE.Camera} camera
  */
  constructor(renderer, camera) {
    super(renderer, camera);

    this.camera = camera;
    this.renderer = renderer;

    this.laserRay = new THREE.Raycaster();
    this.laserOrigin = new THREE.Vector3(0, -2, 32);
    this.laserDirection = new THREE.Vector3(0, 0, -1);
    this.laserRay.set(this.laserOrigin, this.laserDirection);

    this.mirrors = new THREE.Group();
    this.intersects = new THREE.Group();
    this.intersects.add(this.mirrors);
    this.scene.add(this.intersects);

    this.length = 64;
    this.width = 64;
    this.height = 16;
    this._createRoom();
    this._addMirror();

    this._addLight();
  }

  _addMirror() {
    const geo = new THREE.BoxGeometry(3, 3, 0.1);
    const mat = new THREE.MeshPhongMaterial( {color: 0xfff000});
    const mirror = new THREE.Mesh(geo, mat);
    mirror.position.set(0, -2, 0);
    mirror.rotateOnAxis(new THREE.Vector3(0, 1, 0), 45);
    this.mirrors.add(mirror);
  }

  _createLaser() {
    if (this.laser) {
      this.scene.remove(this.laser);
    }
    const geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(0, -2, 32),
    );

    const material = new THREE.LineBasicMaterial({ color: 'red' });

    this.laser = new THREE.Line(geometry, material);
    this.scene.add(this.laser);
  }

  _updateLaser(direction, length) {
    const numVertices = this.laser.geometry.vertices.length;
    let lineOrigin = new THREE.Vector3();
    lineOrigin.copy(this.laser.geometry.vertices[numVertices - 1]);
    console.log(lineOrigin);
    const newPoint = direction.multiplyScalar(length).add(lineOrigin);
    this.laser.geometry.vertices.push(newPoint);
    this.laser.geometry.computeBoundingSphere();
    this.laser.geometry.verticesNeedUpdate = true;
  }

  _updateLaserRay() {
    let raycasterOrigin = new THREE.Vector3();
    let raycasterDestination = new THREE.Vector3(0, 0, -1);
    let rayMatrixWorld = new THREE.Matrix4();
    rayMatrixWorld.multiplyMatrices(this.scene.matrixWorld, this.laser.matrix);
    raycasterOrigin.setFromMatrixPosition(rayMatrixWorld);
    this.laserRay.set(raycasterOrigin, raycasterDestination.transformDirection(rayMatrixWorld).normalize());
    const intersect = this.laserRay.intersectObject(this.intersects, true);
    
    if (intersect.length > 0) {
      let res = intersect.filter(function(res) {
        return res && res.object;
      })[0];

      if (res && res.object) {
        if (res.object != this.laser) {
          let direction = new THREE.Vector3();
          direction.copy(this.laserRay.ray.direction);
          direction.normalize();
          let origin = new THREE.Vector3(0, -2, 32);
          console.log(res.point);
          console.log(res.distance);
          let distance = res.distance;
          this.laser.geometry.vertices.push(res.point);
          //this._updateLaser(direction, distance);
          if (res.object.parent === this.mirrors) {
            console.log("intersected");
          }
        }
      }
    }
  }

  _createRoom() {
    // Generate room geometry.
    const roomGeometry = new THREE.BoxGeometry(this.length, this.height, this.width);
    const roomMaterials = new THREE.MeshPhongMaterial({ color: 0x003050, side: THREE.BackSide });
    this.room = new THREE.Mesh(roomGeometry, roomMaterials);
    this.room.receiveShadow = true;
    this.room.castShadow = true;
    this.intersects.add(this.room);
  }

  _addLight() {
    const ambientLight = new THREE.AmbientLight('white', 0.5);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('white', 1.0, 1000);
    keyLight.position.set(-100, 0, 100);
    keyLight.position.set(0, 100, 0);
    keyLight.decay = 1;

    const fillLight = new THREE.DirectionalLight('white', 0.75, 1000);
    fillLight.position.set(100, 0, 100);

    const backLight = new THREE.DirectionalLight('white', 0.5, 1000);
    backLight.position.set(100, 0, -100).normalize();

    this.scene.add(keyLight);
    this.scene.add(fillLight);
    this.scene.add(backLight);

    const pointLight = new THREE.PointLight('white', 0.8, 500);

    this.scene.add(pointLight);
  }

  animate(delta) {
    this._createLaser();
    this._updateLaserRay();
  }
}