import THREE from '../three';
import XrScene from './xr-scene';
import { keyboard } from '../controls/keyboard-controls';
import TriggerMesh from '../trigger';
import wallTxUrl from '../../assets/textures/laser-room/wall/wall.jpg';
import floorTxUrl from '../../assets/textures/laser-room/floor/floor_diff.jpg';
import doorUrl from '../../assets/door.glb';
import { Interactions } from '../interactions';
import { XR } from '../xrController';
import { createTextPlane } from './planets/text';

const mode = {
  SELECT: 'select',
  DELETE: 'delete',
  CREATE: 'create'
};

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

    this.loader.addTextureToQueue(wallTxUrl, 'laser-wall');
    this.loader.addTextureToQueue(floorTxUrl, 'laser-floor');
    this.loader.addGltfToQueue(doorUrl, 'laser-door');

    this.laserRays = [];
    this.laserRay = new THREE.Raycaster();
    this.laserOrigin = new THREE.Vector3(0, -5, 32);
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
  }

  _initMenu() {
    const buttonGeo = new THREE.BoxGeometry(4, 3, 0.5);
    const buttonMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const selectButton = new TriggerMesh(buttonGeo.clone(), buttonMat.clone());
    const deleteButton = new TriggerMesh(buttonGeo.clone(), buttonMat.clone());
    const createButton = new TriggerMesh(buttonGeo.clone(), buttonMat.clone());
    const resetButton = new TriggerMesh(buttonGeo.clone(), buttonMat.clone());
    const menu = new THREE.Object3D();
    menu.add(selectButton, deleteButton, createButton, resetButton);
    this.scene.add(menu);
    menu.position.set(0, -2, -32);
    selectButton.material.color.set(0x999999);
    createButton.position.set(15, 0, 0.25);
    selectButton.position.set(5, 0, -0.125);
    deleteButton.position.set(-5, 0, 0.25);
    resetButton.position.set(-15, 0, 0.25);

    const selectLabel = createTextPlane('SELECT', 'white', 'black');
    selectLabel.position.set(5, 3, 0.01);

    const deleteLabel = createTextPlane('DELETE', 'white', 'black');
    deleteLabel.position.set(-5, 3, 0.01);

    const createLabel = createTextPlane('CREATE', 'white', 'black');
    createLabel.position.set(15, 3, 0.01);

    const resetLabel = createTextPlane('RESET', 'white', 'black');
    resetLabel.position.set(-15, 3, 0.01);

    menu.add(selectLabel, deleteLabel, createLabel, resetLabel);

    selectButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set(0x999999);
      }
    };

    selectButton.select = function () {
      setting = mode.SELECT;
      this.position.z = -0.125;
      this.material.color.set(0x999999);
      deleteButton.position.z = 0.25;
      deleteButton.material.color.set(0x222222);
      createButton.position.z = 0.25;
      createButton.material.color.set(0x222222);
    };

    selectButton.exit = function () {
      if (setting === mode.SELECT) {
        this.material.color.set(0x999999);
      } else {
        this.material.color.set(0x222222);
      }
    };

    deleteButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set(0x999999);
      }
    };

    deleteButton.select = function () {
      setting = mode.DELETE;
      this.position.z = -0.125;
      this.material.color.set(0x999999);
      selectButton.position.z = 0.25;
      selectButton.material.color.set(0x222222);
      createButton.position.z = 0.25;
      createButton.material.color.set(0x222222);
    };

    deleteButton.exit = function () {
      if (setting === mode.DELETE) {
        this.material.color.set(0x999999);
      } else {
        this.material.color.set(0x222222);
      }
    };

    createButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set(0x999999);
      }
    };

    createButton.select = function () {
      setting = mode.CREATE;
      this.position.z = -0.125;
      this.material.color.set(0x999999);
      selectButton.position.z = 0.25;
      selectButton.material.color.set(0x222222);
      deleteButton.position.z = 0.25;
      deleteButton.material.color.set(0x222222);
    };

    createButton.exit = function () {
      if (setting === mode.CREATE) {
        this.material.color.set(0x999999);
      } else {
        this.material.color.set(0x222222);
      }
    };

    resetButton.addFunction('reset', this._reset);

    resetButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set(0x999999);
      }
    };

    resetButton.select = function () {
      this.functions.reset();
      this.position.z = -0.125;
      this.material.color.set(0x999999);
    };

    resetButton.exit = function () {
      this.position.z = 0.25;
      this.material.color.set(0x222222);
    };

    this.triggers.add(menu);
  }

  _reset = () => {
    const mirror = this.mirrors.children;

    while (mirror.length > 0) {
      while (mirror[0].children.length > 0) {
        mirror[0].children[0].geometry.dispose();
        mirror[0].children[0].material.dispose();
        mirror[0].remove(mirror[0].children[0]);
      }
      mirror[0].geometry.dispose();
      mirror[0].material.dispose();
      this.mirrors.remove(mirror[0]);
    }

    let goal = this.scene.getObjectByName('group');
    const randPos = this.getRandomPosition();
    goal.position.set(randPos.x, randPos.y, randPos.z);
  }

  _addMirrors = (point) => {
    const geo = new THREE.BoxGeometry(3, 4, 0.1);
    const mat = new THREE.MeshPhongMaterial({ color: 0xfafafa });
    const mirror = new THREE.Mesh(geo, mat);
    const baseGeo = new THREE.CylinderGeometry(1, 1, 0.75, 50);
    const baseMat = new THREE.MeshPhongMaterial({ color: 0x383838 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    mirror.add(base);
    base.position.set(0, -2.375, 0);
    mirror.angle = -1;

    mirror[Interactions] = {
      hover_start() {
        if (!this.isSelected) {
          mirror.material.color.set(0x999999);
        }
      },
      hover_end() {
        mirror.material.color.set(0xfafafa);
      },
      select_start() {
        if (setting === mode.DELETE) {
          mirror.material.dispose();
          mirror.geometry.dispose();
          while (mirror.children.length > 0) {
            mirror.children[0].geometry.dispose();
            mirror.children[0].material.dispose();
            mirror.remove(mirror.children[0]);
          }
          mirror.parent.remove(mirror);
        }
      },
      drag_start: (intersection, pointerMatrix) => {
        if (setting === mode.SELECT) {
          const pointerInverse = new THREE.Matrix4().getInverse(pointerMatrix, true);
          const target = new THREE.Matrix4().copy(intersection.object.matrixWorld);
          const transformMatrix = new THREE.Matrix4().multiplyMatrices(pointerInverse, target);
          return {
            object: intersection.object,
            transformMatrix,
            matrixAutoUpdate: intersection.object.matrixAutoUpdate
          };
        }
      },
      drag(matrix) {
        if (setting === mode.SELECT) {
          const pos = new THREE.Vector3().setFromMatrixPosition(matrix);

          pos.y = -5;
          mirror.matrix.setPosition(pos);
          mirror.position.x = pos.x;
          mirror.position.z = pos.z;
          mirror.position.y = pos.y;
          mirror.updateMatrixWorld(true);
        }
      }
    };

    base.camera = this.camera;

    base[Interactions] = {
      hover_start() {
        if (!this.isSelected) {
          base.material.color.set(0x999999);
        }
      },
      hover_end() {
        base.material.color.set(0x383838);
      },
      select_start() {
        if (setting === mode.DELETE) {
          mirror.material.dispose();
          mirror.geometry.dispose();
          while (mirror.children.length > 0) {
            mirror.children[0].geometry.dispose();
            mirror.children[0].material.dispose();
            mirror.remove(mirror.children[0]);
          }
          mirror.parent.remove(mirror);
        }
      },
      drag_start: (intersection, pointerMatrix) => {
        if (setting === mode.SELECT) {
          const pointerInverse = new THREE.Matrix4().getInverse(pointerMatrix, true);
          const target = new THREE.Matrix4().copy(intersection.object.matrixWorld);
          const transformMatrix = new THREE.Matrix4().multiplyMatrices(pointerInverse, target);
          return {
            object: intersection.object,
            transformMatrix,
            matrixAutoUpdate: intersection.object.matrixAutoUpdate
          };
        }
      },
      drag(matrix) {
        if (setting === mode.SELECT) {
          const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
          const cameraDir = new THREE.Vector3();
          base.camera.getWorldDirection(cameraDir);
          
          let newPos = new THREE.Vector3();
          newPos.subVectors(pos, mirror.position);
          newPos.x *= cameraDir.z;
          newPos.z *= -cameraDir.x;
          const ratio = 0.003;
          const radians = -(newPos.x + newPos.z) * ratio;
          const rotMatrix = new THREE.Matrix4().makeRotationY(radians);
          mirror.matrix.multiply(rotMatrix);
          mirror.rotateY(radians);

          let angle = Math.round(((mirror.rotation.y * 180) / Math.PI) * 10) / 10;
          if (angle !== mirror.angle) {
            if (mirror.children.length > 1) {
              mirror.children[1].geometry.dispose();
              mirror.children[1].material.dispose();
              mirror.remove(mirror.children[1]);
            }
            const angleLabel = createTextPlane(angle.toString(), 'white');
            angleLabel.raycast = () => [];
            mirror.add(angleLabel);
            mirror.angle = angle;
            angleLabel.position.set(0, 3, 0);

            const camPos = new THREE.Vector3();
            base.camera.getWorldPosition(camPos);
            angleLabel.lookAt(camPos);
          }

          mirror.updateMatrixWorld(true);
        }
      }
    };

    // const randPos = this.getRandomPosition();
    mirror.position.x = point.x;
    mirror.position.y = -5;
    mirror.position.z = point.z;
    mirror.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 4);

    let angle = Math.round(((mirror.rotation.y * 180) / Math.PI) * 10) / 10;
    if (angle !== mirror.angle) {
      if (mirror.children.length > 1) {
        mirror.children[1].geometry.dispose();
        mirror.children[1].material.dispose();
        mirror.remove(mirror.children[1]);
      }
      const angleLabel = createTextPlane(angle.toString(), 'white');
      angleLabel.raycast = () => [];
      mirror.add(angleLabel);
      mirror.angle = angle;
      angleLabel.position.set(0, 3, 0);
      const camPos = new THREE.Vector3();
      this.camera.getWorldPosition(camPos);
      angleLabel.lookAt(camPos);
    }
    
    this.mirrors.add(mirror);

    this.triggers.add(this.mirrors);
  }

  _createLaser() {
    if (this.laser) {
      this.laser.material.dispose();
      this.laser.geometry.dispose();
      this.scene.remove(this.laser);
    }

    const geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(0, -5, 32),
    );

    const material = new THREE.LineBasicMaterial({ color: 'red' });

    this.laser = new THREE.Line(geometry, material);
    this.laser.raycast = (function () { return null; });

    this.scene.add(this.laser);
  }

  getRandomPosition() {
    const x = Math.ceil((Math.random() * 56) - 28);
    const z = Math.ceil((Math.random() * 56) - 28);
    return new THREE.Vector3(x, -5, z);
  }

  getRandNum() {
    return Math.ceil((Math.random() * 8));
  }

  _createLaserBox() {
    const goalBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    const goalBoxMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const goalBox = new THREE.Mesh(goalBoxGeo, goalBoxMat);
    const goalGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.50, 50, 50);
    const goalMat = new THREE.MeshPhongMaterial({ color: 'red' });
    const goal = new THREE.Mesh(goalGeo, goalMat);

    const group = new THREE.Object3D();
    group.add(goalBox);
    group.add(goal);
    group.position.set(0, -5, 32);
    group.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);
    group.name = 'laserBox';

    this.scene.add(group);
    goal.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    goal.position.set(0, 0, 0.5);
  }

  _initGoal() {
    const goalBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    const goalBoxMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const goalBox = new THREE.Mesh(goalBoxGeo, goalBoxMat);
    const goalGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.50, 50, 50);
    const goalMat = new THREE.MeshPhongMaterial({ color: 'white' });
    const goal = new THREE.Mesh(goalGeo, goalMat);

    const lineGeo = new THREE.Geometry();
    lineGeo.vertices.push(new THREE.Vector3(0, 0, 0));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x111111 });

    const goalLegL = new THREE.Line(lineGeo, lineMat);
    const goalLegR = new THREE.Line(lineGeo.clone(), lineMat.clone());
    const goalLegF = new THREE.Line(lineGeo.clone(), lineMat.clone());
    const goalLegB = new THREE.Line(lineGeo.clone(), lineMat.clone());

    goalLegL.geometry.vertices.push(new THREE.Vector3(1.5, -3, 0));
    goalLegL.raycast = (function () { return null; });
    goalLegR.geometry.vertices.push(new THREE.Vector3(-1.5, -3, 0));
    goalLegR.raycast = (function () { return null; });
    goalLegF.geometry.vertices.push(new THREE.Vector3(0, -3, 1.5));
    goalLegF.raycast = (function () { return null; });
    goalLegB.geometry.vertices.push(new THREE.Vector3(0, -3, -1.5));
    goalLegB.raycast = (function () { return null; });

    const goalLegs = new THREE.Object3D();
    goalLegs.add(goalLegL, goalLegR, goalLegF, goalLegB);

    const group = new THREE.Object3D();
    group.add(goalBox, goal, goalLegs);
    const position = this.getRandomPosition();
    group.position.copy(position);
    group.rotateOnAxis(new THREE.Vector3(0, 1, 0), (this.getRandNum() * Math.PI / 4));
    group.name = 'group';

    this.intersects.add(group);
    goal.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    goal.position.set(0, 0, 0.5);
    goal.name = 'goal';
    goalBox.name = 'goalBox';
  }

  _updateLaser(direction, length) {
    const numVertices = this.laser.geometry.vertices.length;
    const lineOrigin = new THREE.Vector3();
    lineOrigin.copy(this.laser.geometry.vertices[numVertices - 1]);
    const newDirection = direction.clone();
    const newPoint = newDirection.multiplyScalar(length).add(lineOrigin);

    this.laser.geometry.vertices.push(newPoint);
    this.laser.geometry.computeBoundingSphere();
    this.laser.geometry.verticesNeedUpdate = true;
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
    for (let i = 0; i < this.laserRays.length; i++) {
      const laserDirection = this.laserRays[i].ray.direction.clone();
      const raycasterDestination = laserDirection.clone();

      if (!keyboard) {
        const matrixWorld = this.scene.matrixWorld.clone();
        laserDirection.transformDirection(matrixWorld.getInverse(matrixWorld));
      }

      const intersect = this.laserRays[i].intersectObject(this.intersects, true);

      if (intersect.length > 0) {
        const result = intersect.filter(res => res && res.object)[0];

        if (result && result.object) {
          if (result.object !== this.laser) {
            this._updateLaser(laserDirection, result.distance);

            const goal = this.scene.getObjectByName('goalBox');
            if (result.object === this.scene.getObjectByName('goal')) {
              goal.material.color.set('green');
            } else {
              goal.material.color.set(0x111111);
            }

            if (result.object.parent === this.mirrors) {
              this._reflect(result, raycasterDestination);
            }
          }
        }
      }
    }
  }

  _createMirrorOutline() {
    const mirrorOutlineGeo = new THREE.BoxGeometry(3, 4, 0.1);
    const mirrorOutlineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    this.mirrorOutline = new THREE.Mesh(mirrorOutlineGeo, mirrorOutlineMat);
    this.mirrorOutline.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 4);
    this.mirrorOutline.visible = false;
    this.mirrorOutline.raycast = (function () { return null; });

    const baseGeo = new THREE.CylinderGeometry(1, 1, 0.75, 50);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.raycast = (function () { return null; });
    base.position.set(0, -2.375, 0);

    this.mirrorOutline.add(base);
    this.scene.add(this.mirrorOutline);
  }

  displayMirrorOutline = (point) => {
    point.y = -5;
    this.mirrorOutline.position.x = point.x;
    this.mirrorOutline.position.y = point.y;
    this.mirrorOutline.position.z = point.z;
    this.mirrorOutline.visible = true;
  }

  noMirrorOutline = () => {
    this.mirrorOutline.visible = false;
  }

  _initRoom(cache) {
    const wallTx = cache['laser-wall'];
    wallTx.repeat.set(3, 3);
    wallTx.wrapS = THREE.RepeatWrapping;
    wallTx.wrapT = THREE.RepeatWrapping;
    const floorTx = cache['laser-floor'];
    floorTx.repeat.set(10, 10);
    floorTx.wrapS = THREE.RepeatWrapping;
    floorTx.wrapT = THREE.RepeatWrapping;
    const wallMat = new THREE.MeshPhongMaterial({ map: wallTx, side: THREE.BackSide });
    const floorMat = new THREE.MeshPhongMaterial({ map: floorTx, side: THREE.BackSide });
    const roomMaterials = [
      wallMat,
      wallMat,
      wallMat,
      floorMat,
      wallMat,
      wallMat
    ];

    // Generate room geometry.
    const roomGeometry = new THREE.BoxGeometry(this.length, this.height, this.width);

    const floorGeo = new THREE.PlaneGeometry(this.length, this.width);
    const floor = new THREE.Mesh(floorGeo, floorMat.clone());
    floor.rotateX(Math.PI / 2);
    floor.position.y = -7.999999;

    this.room = new THREE.Mesh(roomGeometry, roomMaterials);
    this.room.receiveShadow = true;
    this.room.castShadow = true;
    this.room.name = 'room';
    this.room.add(floor);
    
    const doorScene = cache['laser-door'];
    let door = doorScene.scene.getObjectByName('Door_Frame').clone();
    door.scale.set(2.5, 2.5, 2.5);
    door.position.set(4, -8, 32);
    const doorMat = new THREE.MeshPhongMaterial({color: 0x7c5c3a});
    const doorFrameMat = new THREE.MeshPhongMaterial({color: 0x543d25});
    door.children[0].material = doorMat;
    door.material = doorFrameMat;

    door.children[0][Interactions] = {
      hover() {
        door.children[0].material.color.set('tan');
      },
      hover_end() {
        door.children[0].material.color.set(0x7c5c3a);
      },
      select() {
        let newPath = '/home';
        const event = new CustomEvent('changeRoom', { detail: { newPath } });
        window.dispatchEvent(event);
      }
    }

    this.intersects.add(door);

    floor.functions = {};
    floor.functions.addMirror = this._addMirrors;
    floor.functions.displayMirrorOutline = this.displayMirrorOutline;
    floor.functions.noMirrorOutline = this.noMirrorOutline;
    floor[Interactions] = {
      hover({ point }) {
        if (setting === mode.CREATE) {
          floor.functions.displayMirrorOutline(point);
        }
      },
      hover_end() {
        floor.functions.noMirrorOutline();
      },
      select_start({ point }) {
        if (setting === mode.CREATE) {
          floor.functions.addMirror(point);
        } else {
          const offsetMatrix = XR.getOffsetMatrix();
          point.y = 0;
          point.multiplyScalar(-1);
          offsetMatrix.setPosition(point);
          XR.setOffsetMatrix(offsetMatrix);
        }
      }
    };
    this.intersects.add(this.room);
  }

  _addLight() {
    const ambientLight = new THREE.AmbientLight('white', 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xfffccc, 0.3, 500);

    this.scene.add(pointLight);
  }

  _copyRay(ray) {
    const newRay = new THREE.Raycaster();
    newRay.set(ray.ray.origin.clone(), ray.ray.direction.clone());
    return newRay;
  }

  _setupInitialRayMatrix() {
    const rayMatrixWorld = new THREE.Matrix4();
    const raycasterOrigin = this.laserRays[0].ray.origin.clone();
    const laserDirection = this.laserRays[0].ray.direction.clone();
    const raycasterDestination = laserDirection.clone();
    rayMatrixWorld.multiplyMatrices(this.scene.matrixWorld, this.laser.matrix);

    raycasterOrigin.applyMatrix4(rayMatrixWorld);

    this.laserRays[0].set(raycasterOrigin, raycasterDestination.transformDirection(rayMatrixWorld));
  }

  _updateMirrors() {
    const mirror = this.mirrors.children;
    for (let i = 0; i < mirror.length; i++) {
      if (mirror[i].children.length > 1) {
        const camPos = new THREE.Vector3();
        this.camera.getWorldPosition(camPos);
        mirror[i].children[1].lookAt(camPos);
      }
    }
  }
  
  _initScene(cache) {
    this._initRoom(cache);
    this._createLaserBox();
    this._createMirrorOutline();
    this._initGoal();
    this._initMenu();
    this._addLight();
  }

  onAssetsLoaded(cache) {
    super.onAssetsLoaded(cache);

    this._initScene(cache);
  }

  animate() {
    this._updateMirrors();
    this._createLaser();
    this.laserRays = [];
    this.laserRays.push(this._copyRay(this.laserRay));
    if (!keyboard) {
      this._setupInitialRayMatrix();
    }
    this._updateLaserRays();
  }
}
