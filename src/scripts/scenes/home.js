import * as THREE from 'three';
import doorUrl from '../../assets/door.glb';
import wallTxUrl from '../../assets/textures/laser-room/wall/wall.jpg';
import floorTxUrl from '../../assets/textures/laser-room/floor/floor_diff.jpg';
import XrScene from './xr-scene';
import TriggerMesh from '../trigger';
import { Interactions } from '../interactions';
import { createTextPlane } from './planets/text';
import { XR } from '../xrController';

const settings = {
  global: {
    lights: {
      ambient: true
    }
  },
  room: {
    textures: {
      enabled: false
    },
    lights: {
      point: true
    }
  }
};

export default class HomeScene extends XrScene {
  /**
   *
   * @param {THREE.Renderer} renderer
   * @param {THREE.Camera} camera
   */
  constructor(renderer, camera) {
    super(renderer, camera);

    this.loader.addTextureToQueue(wallTxUrl, 'home-wall');
    this.loader.addTextureToQueue(floorTxUrl, 'home-floor');
    this.loader.addGltfToQueue(doorUrl, 'home-door');

    // Basic lighting
    if (settings.global.lights.ambient) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);
    }

    if (settings.room.lights.point) {
      const pointLight = new THREE.PointLight(0xfffccc, 0.5);
      pointLight.position.set(0, 0, 0);
      this.scene.add(pointLight);
    }

    // Generate room geometry
    this.length = 24;
    this.width = 24;
    this.height = 16;

    this._addEventListener(window, 'mousedown', this.onClick);
  }

  addDoors(cache) {
    const doorScene = cache['home-door'];
    let door = doorScene.scene.getObjectByName('Door_Frame').clone();
    door.scale.set(2.5, 2.5, 2.5);
    const doorMat = new THREE.MeshPhongMaterial({color: 0x7c5c3a});
    const doorFrameMat = new THREE.MeshPhongMaterial({color: 0x543d25});
    door.children[0].material = doorMat;
    door.material = doorFrameMat;
    
    let fallingDoor = door.clone();
    fallingDoor.rotateY(Math.PI / 2);
    fallingDoor.position.set(
      -12,
      -8,
      0
    );

    let fallingLabel = createTextPlane('KINEMATICS', 'white', 'black');
    fallingLabel.position.set(0, 5, -0.01);
    fallingLabel.scale.set(0.3, 0.3, 0.3);
    fallingLabel.rotateY(Math.PI);
    fallingDoor.add(fallingLabel);

    let planetsDoor = door.clone();
    planetsDoor.rotateY(-Math.PI / 2);
    planetsDoor.position.set(
      12,
      -8,
      0
    );

    let planetsLabel = createTextPlane('PLANETS', 'white', 'black');
    planetsLabel.position.set(0, 5, -0.01);
    planetsLabel.scale.set(0.3, 0.3, 0.3);
    planetsLabel.rotateY(Math.PI);
    planetsDoor.add(planetsLabel);

    let pendulumsDoor = door.clone();
    pendulumsDoor.position.set(
      0,
      -8,
      -12
    );

    let pendulumsLabel = createTextPlane('PENDULUMS', 'white', 'black');
    pendulumsLabel.position.set(0, 5, -0.01);
    pendulumsLabel.scale.set(0.3, 0.3, 0.3);
    pendulumsLabel.rotateY(Math.PI);
    pendulumsDoor.add(pendulumsLabel);

    let lasersDoor = door.clone();
    lasersDoor.rotateY(Math.PI);
    lasersDoor.position.set(
      0,
      -8,
      12
    );

    let lasersLabel = createTextPlane('LASERS', 'white', 'black');
    lasersLabel.position.set(0, 5, -0.01);
    lasersLabel.scale.set(0.3, 0.3, 0.3);
    lasersLabel.rotateY(Math.PI);
    lasersDoor.add(lasersLabel);

    this.addDoorInteraction(fallingDoor, '/kinematics');
    this.addDoorInteraction(planetsDoor, '/planets');
    this.addDoorInteraction(pendulumsDoor, '/pendulums');
    this.addDoorInteraction(lasersDoor, '/lasers');

    this.scene.add(fallingDoor, planetsDoor, pendulumsDoor, lasersDoor);
  }

  addDoorInteraction(door, path) {
    door.children[0][Interactions] = {
      hover() {
        door.children[0].material.color.set('tan');
      },
      hover_end() {
        door.children[0].material.color.set(0x7c5c3a);
      },
      select() {
        console.log(path);
        const newPath = path;
        const event = new CustomEvent('changeRoom', { detail: { newPath } });
        window.dispatchEvent(event);
      }
    }
  }

  initRoom(cache) {
    const wallTx = cache['home-wall'];
    wallTx.repeat.set(3, 3);
    wallTx.wrapS = THREE.RepeatWrapping;
    wallTx.wrapT = THREE.RepeatWrapping;
    const floorTx = cache['home-floor'];
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

    floor.functions = {};
    floor.functions.addMirror = this._addMirrors;
    floor.functions.displayMirrorOutline = this.displayMirrorOutline;
    floor.functions.noMirrorOutline = this.noMirrorOutline;
    floor[Interactions] = {
      select_start({ point }) {
        const offsetMatrix = XR.getOffsetMatrix();
        point.y = 0;
        point.multiplyScalar(-1);
        offsetMatrix.setPosition(point);
        XR.setOffsetMatrix(offsetMatrix); 
      }
    };
    this.scene.add(this.room);

    this.addDoors(cache);

    
    this.bounds.push(new THREE.Box3().setFromObject(this.room));
  }

  onAssetsLoaded(cache) {
    super.onAssetsLoaded(cache);
    
    this.initRoom(cache);
    return cache;
  }

  animate() {

  }

  changeRoom(newPath) {
    const event = new CustomEvent('changeRoom', { detail: { newPath } });
    window.dispatchEvent(event);
  }

  _boxTest() {
    console.log('In box test');
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true
    });

    if (!geometry) console.log('Failed to generate geometry');
    if (!material) console.log('Failed to generate material');

    const box = new TriggerMesh(geometry, material);
    if (!box) console.log('Failed to create box mesh');

    const externalFunc = (args) => {
      console.log(args);
      console.log(this);
    };

    box.addFunction('externalFunc', externalFunc);

    box.hover = function (intersection) {
      if (this.debug) console.log(intersection);
      if (!this.isSelected) {
        this.material.color.set(0xFF0000);
      }
    };

    box.select = function (intersection) {
      if (this.debug) console.log(intersection);
      this.material.color.set(0x00FF00);

      // Functions call example
      this.functions.externalFunc(intersection);
    };

    box.release = function (intersection) {
      if (this.debug) console.log(intersection);
      this.material.color.set(0x0000FF);
    };

    box.exit = function (intersection) {
      if (this.debug) console.log(intersection);
      this.material.color.set(0xFFFFFF);
    };


    box.name = 'testBox001';
    box.position.set(-1, 0, -5);

    this.triggers.add(box);

    const box2 = box.clone();
    box2.position.set(1, 0, -5);

    this.triggers.add(box2);

    if (!this.scene.getObjectByName('testBox001')) {
      console.log('Box not found in scene');
    }
  }
}
