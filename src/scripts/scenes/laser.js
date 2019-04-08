import THREE from '../three';
import XrScene from './xr-scene';
import { keyboard } from '../controls/keyboard-controls';


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

    this.laserRays = [];
    this.laserRay = new THREE.Raycaster();
    this.laserOrigin = new THREE.Vector3(0, -2, 32);
    this.laserDirection = new THREE.Vector3(0, 0, -1);
    this.laserRay.set(this.laserOrigin, this.laserDirection);
    this.laserRays.push(this.laserRay);

    this.mirrors = new THREE.Group();
    this.intersects = new THREE.Group();
    this.intersects.add(this.mirrors);
    this.scene.add(this.intersects);

    this.length = 64;
    this.width = 64;
    this.height = 16;
    this._createRoom();
    this._addMirrors();

    this._addLight();
  }

  _addMirrors() {
    const geo = new THREE.BoxGeometry(3, 3, 0.1);
    const mat = new THREE.MeshPhongMaterial( {color: 0xfff000});
    const mirror = new THREE.Mesh(geo, mat);
    mirror.position.set(0, -2, 0);
    mirror.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 4);
    mirror.name = "mirror";
    this.mirrors.add(mirror);

    const mirror2 = mirror.clone();
    mirror2.position.set(10, -2, 0);
    mirror2.rotateOnAxis(new THREE.Vector3(0, 1, 0),  (Math.PI) / 2);
    mirror2.name = "mirror2";
    this.mirrors.add(mirror2);

    const mirror3 = mirror2.clone();
    mirror3.position.set(10, -2, 10);
    mirror3.rotateOnAxis(new THREE.Vector3(0, 1, 0),  (Math.PI) / 2);
    mirror3.name = "mirror3";
    this.mirrors.add(mirror3);

    const mirror4 = mirror3.clone();
    mirror4.position.set(-20, -2, 10);
    mirror4.rotateOnAxis(new THREE.Vector3(0, 1, 0),  (Math.PI) / 2);
    mirror4.name = "mirror4";
    this.mirrors.add(mirror4);
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
    const newDirection = direction.clone();
    const newPoint = newDirection.multiplyScalar(length).add(lineOrigin);
    this.laser.geometry.vertices.push(newPoint);
    this.laser.geometry.computeBoundingSphere();
    this.laser.geometry.verticesNeedUpdate = true;
    console.log(this.laser);
  }

  _reflect(res, incomingDirection) {
    let normal = new THREE.Vector3();
    normal = res.face.normal.clone();
    normal.applyMatrix4(new THREE.Matrix4().extractRotation(res.object.matrixWorld));
    let direction = new THREE.Vector3();
    direction = incomingDirection.clone();
    direction.reflect(normal);

    const newRay = new THREE.Raycaster();
    newRay.set(res.point, direction);
    this.laserRays.push(newRay);

  }

  _updateLaserRays() {
    for (let i = 0; i  < this.laserRays.length; i++) {
      let raycasterOrigin = new THREE.Vector3(0, -2, 32);
      let raycasterDestination = new THREE.Vector3();
      raycasterDestination = this.laserRays[i].ray.direction.clone();
      if (!keyboard) {
        let rayMatrixWorld = new THREE.Matrix4();
        console.log("before");
        console.log(raycasterOrigin);
        rayMatrixWorld.multiplyMatrices(this.scene.matrixWorld, this.laser.matrix);
        raycasterOrigin.setFromMatrixPosition(rayMatrixWorld);
        console.log("raycasterOrigin");
        console.log(raycasterOrigin);
        this.laserRays[i].set(raycasterOrigin, raycasterDestination.transformDirection(rayMatrixWorld).normalize());
      }
      
      const intersect = this.laserRays[i].intersectObject(this.intersects, true);
      
      if (intersect.length > 0) {
        let res = intersect.filter(function(res) {
          return res && res.object;
        })[0];

        if (res && res.object) {
          if (res.object != this.laser) {
            console.log("hit object, updating laser");
            console.log(res.object);
            console.log("num raycasters");
            console.log(this.laserRays.length);
            this._updateLaser(raycasterDestination, res.distance);
            if (res.object.parent === this.mirrors) {
              console.log("intersected");
              this._reflect(res, raycasterDestination);
            }
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
    this.room.name = "room";
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
    this.laserRays = [];
    this.laserRays.push(this.laserRay);
    this._updateLaserRays();
  }
}