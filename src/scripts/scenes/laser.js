import THREE from '../three';
import XrScene from './xr-scene';
import { keyboard } from '../controls/keyboard-controls';
import TriggerMesh from '../trigger';

const mode = {
  SELECT: "select",
  DELETE: "delete"
}

let setting = mode.SELECT;

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
    this.intersects.add(this.triggers);
    this.scene.add(this.intersects);

    this.length = 64;
    this.width = 64;
    this.height = 16;
    this._initScene();
  }

  _initScene() {
    this._initRoom();
    this._addMirrors();
    this._initGoal();
    this._initMenu();
    this._addLight();
  }

  _initMenu() {
    const buttonGeo = new THREE.BoxGeometry(1, 0.75, 0.5);
    const buttonMat = new THREE.MeshPhongMaterial({color: 0x222222});
    const selectButton = new TriggerMesh(buttonGeo.clone(), buttonMat.clone());
    const deleteButton = new TriggerMesh(buttonGeo.clone(), buttonMat.clone());
    const menu = new THREE.Object3D();
    menu.add(selectButton, deleteButton);
    this.scene.add(menu);
    menu.position.set(-10, -4, 32);
    selectButton.material.color.set(0x666666);
    selectButton.position.set(2, 0, 0.125);
    deleteButton.position.set(-2, 0, -0.25);

    console.log(setting);

    selectButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set(0x454545);
      }
    };

    selectButton.select = function () {
      setting = mode.SELECT;
      this.position.z = 0.125;
      this.material.color.set(0x666666);
      deleteButton.position.z = -0.25;
      deleteButton.material.color.set(0x222222);
    };

    selectButton.exit = function () {
      console.log(setting);
      if (setting === mode.DELETE) {
        this.material.color.set(0x222222);
      } else {
        this.material.color.set(0x666666);
      }
    };

    deleteButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set(0x454545);
      }
    };

    deleteButton.select = function () {
      setting = mode.DELETE;
      this.position.z = 0.125;
      this.material.color.set(0x666666);
      selectButton.position.z = -0.25;
      selectButton.material.color.set(0x222222);
    };

    deleteButton.exit = function () {
      console.log(setting);
      if (setting === mode.SELECT) {
        this.material.color.set(0x222222);
      } else {
        this.material.color.set(0x666666);
      }
    };

    this.triggers.add(menu);
  }

  _addMirrors() {
    const geo = new THREE.BoxGeometry(3, 3, 0.1);
    const mat = new THREE.MeshPhongMaterial({color: 0xfafafa});
    const mirror = new TriggerMesh(geo, mat);

    mirror.hover = function () {
      if (!this.isSelected) {
        this.material.color.set(0x454545);
      }
    };

    mirror.select = function () {
      if (setting === mode.DELETE) {
        this.parent.remove(this);
      }
    };

    mirror.exit = function () {
      if (this) {
        this.material.color.set(0xfafafa);
      } 
    };
    
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

    this.triggers.add(this.mirrors);
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

  getRandomPosition() {
    const x = Math.ceil((Math.random() * 56) - 28);
    const z = Math.ceil((Math.random() * 56) - 28);
    return new THREE.Vector3(x, -2, z);
  }

  getRandNum() {
    return Math.ceil((Math.random() * 8));
  }

  _initGoal() {
    const goalBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    const goalBoxMat = new THREE.MeshPhongMaterial({color: 0x111111});
    const goalBox = new THREE.Mesh(goalBoxGeo, goalBoxMat);
    const goalGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.50, 50, 50);
    const goalMat = new THREE.MeshPhongMaterial({color: 'white'});
    const goal = new THREE.Mesh(goalGeo, goalMat);

    const group = new THREE.Object3D();
    group.add(goalBox);
    group.add(goal);
    const position = this.getRandomPosition();
    console.log(position);
    group.position.copy(position);
    group.rotateOnAxis(new THREE.Vector3(0, 1, 0), (this.getRandNum() * Math.PI / 4));
    group.name = "group";
    
    this.intersects.add(group);
    goal.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    goal.position.set(0, 0, 0.5);
    goal.name = "goal";
    goalBox.name = "goalBox";
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
  }

  _reflect(res, incomingDirection, otherRay) {
    let normal = new THREE.Vector3();
    normal = res.face.normal.clone();
    normal.applyMatrix4(new THREE.Matrix4().extractRotation(res.object.matrixWorld));
    let direction = new THREE.Vector3();
    direction = incomingDirection.clone();
    direction.reflect(normal);

    const radAngle = Math.acos((normal.clone().dot(direction)) / (normal.length() * direction.length()));
    let angle = radAngle / Math.PI * 180;
    angle = Math.round(angle * 10) / 10;
    
    //console.log(angle);

    const newRay = new THREE.Raycaster();
    newRay.set(res.point, direction);
    this.laserRays.push(newRay);

  }

  _updateLaserRays() {
    for (let i = 0; i  < this.laserRays.length; i++) {
      let laserDirection = this.laserRays[i].ray.direction.clone();
      let raycasterDestination = laserDirection.clone();

      if (!keyboard) {
        let matrixWorld = this.scene.matrixWorld.clone();
        laserDirection.transformDirection(matrixWorld.getInverse(matrixWorld));
      }

      const intersect = this.laserRays[i].intersectObject(this.intersects, true);
      
      if (intersect.length > 0) {
        let res = intersect.filter(function(res) {
          return res && res.object;
        })[0];

        if (res && res.object) {
          if (res.object != this.laser) {
            this._updateLaser(laserDirection, res.distance);

            const goal = this.scene.getObjectByName("goalBox");
            if (res.object === this.scene.getObjectByName("goal")) {
              goal.material.color.set('green');
            } else {
              goal.material.color.set(0x111111);
            }

            if (res.object.parent === this.mirrors) {
              this._reflect(res, raycasterDestination, this.laserRays[i]);
            }
          }
        }
      }
    }
  }

  _initRoom() {
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

  _copyRay(ray) {
    let newRay = new THREE.Raycaster();
    newRay.set(ray.ray.origin.clone(), ray.ray.direction.clone());
    return newRay;
  }

  _setupInitialRayMatrix() {
    let rayMatrixWorld = new THREE.Matrix4();
    let raycasterOrigin = this.laserRays[0].ray.origin.clone();
    let laserDirection = this.laserRays[0].ray.direction.clone();
    let raycasterDestination = laserDirection.clone();
    rayMatrixWorld.multiplyMatrices(this.scene.matrixWorld, this.laser.matrix);

    raycasterOrigin.applyMatrix4(rayMatrixWorld);

    this.laserRays[0].set(raycasterOrigin, raycasterDestination.transformDirection(rayMatrixWorld));
  }

  animate(delta) {
    this._createLaser();
    this.laserRays = [];
    this.laserRays.push(this._copyRay(this.laserRay));
    if(!keyboard) {
      this._setupInitialRayMatrix();
    }
    this._updateLaserRays();
  }
}