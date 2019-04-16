/* eslint-disable func-names */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-syntax */
import * as CANNON from 'cannon';
import THREE from '../three';
import XrScene from './xr-scene';

import table from '../../assets/table.obj';
import tTable from '../../assets/textures/table/table.jpeg';
import nTable from '../../assets/textures/table/tableNormal.jpeg';

import nGround from '../../assets/textures/groundNormal.png';

import oDoor from '../../assets/door.glb';

import { XR } from '../xrController';

import TriggerMesh from '../trigger';
import { Interactions } from '../interactions';
import { createTextPlane } from './planets/text';
import createGUI from '../menuGUI';
import 'datguivr';

const mode = {
  CREATE: 'create'
};

let setting = mode.CREATE;

import { updateCamera } from '../renderer/camera';

import sky_nx from '../../assets/textures/Skybox/sky_nx.png';
import sky_ny from '../../assets/textures/Skybox/sky_ny.png'; 
import sky_nz from '../../assets/textures/Skybox/sky_nz.png';
import sky_px from '../../assets/textures/Skybox/sky_px.png'; 
import sky_py from '../../assets/textures/Skybox/sky_py.png'; 
import sky_pz from '../../assets/textures/Skybox/sky_pz.png';

export default class KinematicsScene extends XrScene {
  /**
  *
  * @param {THREE.Renderer} renderer
  * @param {THREE.Camera} camera
  */
  constructor(renderer, camera) {
    super(renderer, camera);

    updateCamera({far : 500});

    this.length = 2000;
    this.width = 2000;
    this._createEnv();

    this._initMenu();

    // Create Gui Menu
    this.menu = createGUI(this.scene, this.camera, this.renderer);
    this.menu.position.set(-15, 0, -32);

    // Add Global Gravity
    this.menu.add(this.world.gravity, 'y', -9.8, 9.8).step(0.2)
      .name('Gravity')
      .listen();

    //Assets
    this._loadAssets();

    // Objects
    this.bodies = [];
    this.meshes = [];

    this.objectMaterial = new CANNON.Material();

    // Balls
    this.ballShape = new CANNON.Sphere(1);
    this.ballGeo = new THREE.SphereGeometry(this.ballShape.radius, 32, 32);

    // Boxes
    this.boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    this.boxGeo = new THREE.BoxGeometry(2, 2, 2, 10, 10, 10);

    // Cylinders

    this._createSpawners();

    this._addLight();

    this._initCannon();
    this._addEventListener(window, 'mousedown', this.onClick);
    this._addEventListener(window, 'keyup', this.onKeyUp);
  }

  _loadAssets() {
    this.loader.addCubeTextureToQueue([
      sky_nx, sky_px,
      sky_py, sky_ny,
      sky_nz, sky_pz
    ], 'skybox');

    this.loader.addTextureToQueue(sky_nx, 'sky_nx');
    this.loader.addTextureToQueue(sky_ny, 'sky_ny');
    this.loader.addTextureToQueue(sky_nz, 'sky_nz');
    this.loader.addTextureToQueue(sky_px, 'sky_px');
    this.loader.addTextureToQueue(sky_py, 'sky_py');
    this.loader.addTextureToQueue(sky_pz, 'sky_pz');

    this.loader.addOBJToQueue(table, 'table');
    this.loader.addTextureToQueue(tTable, 'tTable');
    this.loader.addTextureToQueue(nTable, 'nTable');

    this.loader.addTextureToQueue(nGround, 'ground');

    this.loader.addGltfToQueue(oDoor, 'door');
  }

  _loadTable(asset) {
    const mesh = asset.obj.children[0];
    const material = new THREE.MeshPhongMaterial({
      normalMap : asset.normal
    });
    mesh.material.copy(material);
    mesh.position.set(0, -5.5, -15);
    this.scene.add(mesh);
  }

  _textureGround(texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 100);
    const material = new THREE.MeshPhongMaterial({
      color       : 'gray',
      specular    : 0xffffff,
      shininess   : 2.5,
      normalMap   : texture
    });
    this.ground.material.copy(material);
  }

  /**
   * override this to handle adding adding assets to the scene
   * @param {object} assetCache cache with all assets, accessible by their `id`
   */
  onAssetsLoaded(cache) {
    super.onAssetsLoaded(cache);

    const skyboxTextures = [
      cache.sky_nz, cache.sky_pz,
      cache.sky_py, cache.sky_ny,
      cache.sky_px, cache.sky_nx 
    ];

    const tableAsset = {};
    tableAsset.obj = cache.table;
    tableAsset.texture = cache.tTable;
    tableAsset.normal = cache.nTable;

    const groundTexture = cache.ground;

    const door = cache.door.scene.children[0];

    this.scene.background = cache.skybox;
    this._loadTable(tableAsset);
    this._textureGround(groundTexture);
    this._createDoor(door);
  }

  _createDoor(door) {
    const doorBody = door.children[0]
    door.scale.set(2.5, 2.5, 2.5);
    door.position.set(0, -8, 25);
    const mDoorBody = new THREE.MeshPhongMaterial({color: 0x7c5c3a});
    const mDoorFrame = new THREE.MeshPhongMaterial({color: 0x543d25});
    door.material = mDoorFrame;
    doorBody.material = mDoorBody;

    doorBody[Interactions] = {
      hover() {
        door.children[0].material.color.set('tan');
      },
      hover_end() {
        door.children[0].material.color.set(0x7c5c3a);
      },
      select: () => {
        this.changeRoom('/home');
      }
    }

    this.scene.add(door);

  }

  _initMenu() {
    const buttonGeo = new THREE.BoxGeometry(2, 3, 0.5);
    const buttonGeo2 = new THREE.BoxGeometry(2, 3, 0.5);

    const buttonMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const createButton = new TriggerMesh(buttonGeo.clone(), buttonMat.clone());
    const reverseButton = new TriggerMesh(buttonGeo2.clone(), buttonMat.clone());

    const menu = new THREE.Object3D();
    const menu2 = new THREE.Object3D();

    menu.add(createButton);
    menu2.add(reverseButton);

    this.scene.add(menu);
    this.scene.add(menu2);

    menu.position.set(1, -2, -32);
    menu2.position.set(8, -2, -32);

    createButton.position.set(10, 0, 0.25);
    reverseButton.position.set(0, 0, 0.25);

    const createLabelGravity = createTextPlane('Gravity', 'white', 'orange');
    createButton.add(createLabelGravity);
    createLabelGravity.position.set(-1.5, 3, 0.26);

    const createLabelOn = createTextPlane('On', 'white', 'green');
    createButton.add(createLabelOn);
    createLabelOn.position.set(-3, -1, 1);

    const createLabelOff = createTextPlane('off', 'white', 'red');
    reverseButton.add(createLabelOff);
    createLabelOff.position.set(3, -1, 1);

    createButton.addFunction('toggleGravity', this.toggleGravity);
    reverseButton.addFunction('reverseGravity', this.reverseGravity);

    createButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set('green');
      }
    };

    createButton.select = function () {
      this.functions.toggleGravity();
      setting = mode.CREATE;
      this.position.z = -0.125;
      this.material.color.set(0x999999);
      reverseButton.position.z = 0.25;
      reverseButton.material.color.set(0x222222);
    };

    createButton.exit = function () {
      if (setting === mode.CREATE) {
        this.material.color.set(0x999999);
      }
    };

    reverseButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set('green');
      }
    };

    reverseButton.select = function () {
      this.functions.reverseGravity();
      setting = mode.CREATE;
      this.position.z = -0.125;
      this.material.color.set(0x999999);
      createButton.position.z = 0.25;
      createButton.material.color.set(0x222222);
    };

    reverseButton.exit = function () {
      if (setting === mode.CREATE) {
        this.material.color.set(0x999999);
      }
    };

    this.triggers.add(menu);
    this.triggers.add(menu2);
  }

  _createEnv() {
    // Generate room geometry.
    const gGround = new THREE.PlaneGeometry(this.width, this.length);
    const mGround = new THREE.MeshPhongMaterial({
      color       : 'gray',
      specular    : 0xffffff,
      shininess   : 10
    });
    const ground = new THREE.Mesh(gGround, mGround);
    ground.receiveShadow = true;
    ground.rotateX(-1.5708);
    ground.position.set(0, -8, 0);

    ground[Interactions] = {
      select_start({ distance, point }) {
        if(distance <= 75) {
          point.y += 8;
          const offsetMatrix = XR.getOffsetMatrix();
          point.multiplyScalar(-1);
          offsetMatrix.setPosition(point);
          XR.setOffsetMatrix(offsetMatrix);
        }
      }
    }

    this.ground = ground;
    this.scene.add(ground);

    // Create spawner tube
    const tubeMaterials = new THREE.MeshPhongMaterial({ color: 'gray', side: THREE.DoubleSide });
    const spawnTubeGeo = new THREE.CylinderGeometry(2, 2, 3, 32, 32, true);
    const spawnTube = new THREE.Mesh(spawnTubeGeo, tubeMaterials);
    spawnTube.position.set(0, 8 - 1, 0);
    this.scene.add(spawnTube);
  }

  // Create Gui folders.
  _initGui = (context) => {
    const createFolder = dat.GUIVR.create('Object Settings');
    this.menu.addFolder(createFolder);

    createFolder.add(context.position, 'x').min(-1)
      .max(1)
      .step(0.25)
      .name('Position X')
      .listen();

    createFolder.add(context.position, 'y').min(-1)
      .max(1)
      .step(0.25)
      .name('Position Y')
      .listen();

    createFolder.add(context.position, 'z').min(-1)
      .max(1)
      .step(0.25)
      .name('Position Z')
      .listen();

    createFolder.add(context.material, 'wireframe')
      .name('Wireframe')
      .listen();
  }

  _spawnBall = () => {
    const ballBody = new CANNON.Body({ mass: 1, material: this.objectMaterial });
    ballBody.addShape(this.ballShape);
    const material = new THREE.MeshPhongMaterial({ color: 'red' });
    const ball = new THREE.Mesh(this.ballGeo, material);
    ball.castShadow = true;
    ball.receiveShadow = true;
    this.world.addBody(ballBody);

    this.arrowHelpers = [];
    let direction = new THREE.Vector3(0, 0, 0);
    let origin = new THREE.Vector3(0, 0, 0);

    // Ball ArrowHelper
    this.arrowHelper = new THREE.ArrowHelper(
      direction,
      origin,
      3,
      'yellow'
    );
    ball.add(this.arrowHelper);

    let lastTime;
    ball[Interactions] = {
      hover_start() {
        if (!this.isSelected) {
          ball.material.color.set(0xFF0000);
        }
      },
      hover_end() {
        ball.material.color.set('orange');
      },
      drag_start: (intersection, pointerMatrix) => {
        lastTime = performance.now();
        const pointerInverse = new THREE.Matrix4().getInverse(pointerMatrix, true);
        const target = new THREE.Matrix4().copy(intersection.object.matrixWorld);
        const transformMatrix = new THREE.Matrix4().multiplyMatrices(pointerInverse, target);
        return {
          object: intersection.object,
          transformMatrix,
          matrixAutoUpdate: intersection.object.matrixAutoUpdate
        };
      },
      drag(matrix) {
        const now = performance.now();
        const diff = (now - lastTime) / 1000; // ms to s
        lastTime = now;
        ball.velocity = new THREE.Vector3().setFromMatrixPosition(matrix);
        ball.velocity.sub(new THREE.Vector3().setFromMatrixPosition(ball.matrix));
        ball.velocity.divideScalar(diff);
        ball.matrix.copy(matrix);
        const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
        ballBody.position.x = pos.x;
        ballBody.position.y = pos.y;
        ballBody.position.z = pos.z;
        ball.updateMatrixWorld(true);
      },
      drag_end: () => {
        const instVel = ball.velocity;
        delete ball.velocity;
        ballBody.velocity.x = instVel.x;
        ballBody.velocity.y = instVel.y;
        ballBody.velocity.z = instVel.z;
      }
    };

    this.scene.add(ball);

    this.bodies.push(ballBody);
    this.meshes.push(ball);

    this.checkObjectLimit();

    ballBody.position.set(0, 7, 0);
    ball.position.set(0, 7, 0);
  }

  _spawnBox = () => {
    const boxBody = new CANNON.Body({ mass: 1, material: this.objectMaterial });
    boxBody.addShape(this.boxShape);
    const material = new THREE.MeshPhongMaterial({ color: 'red' });
    const box = new THREE.Mesh(this.boxGeo, material);
    box.castShadow = true;
    box.receiveShadow = true;
    this.world.addBody(boxBody);

    const direction = new THREE.Vector3(0, 0, 0);
    const origin = new THREE.Vector3(0, 0, 0);

    // Box ArrowHelper
    this.arrowHelper = new THREE.ArrowHelper(
      direction,
      origin,
      3,
      'yellow'
    );
    box.add(this.arrowHelper);

    let lastTime;
    box[Interactions] = {
      hover_start() {
        if (!this.isSelected) {
          box.material.color.set(0xFF0000);
        }
      },
      hover_end() {
        box.material.color.set('orange');
      },
      drag_start: (intersection, pointerMatrix) => {
        // this.paused = true;
        // TODO: Stop associated pendulum swing's motion
        lastTime = performance.now();
        const pointerInverse = new THREE.Matrix4().getInverse(pointerMatrix, true);
        const target = new THREE.Matrix4().copy(intersection.object.matrixWorld);
        const transformMatrix = new THREE.Matrix4().multiplyMatrices(pointerInverse, target);
        return {
          object: intersection.object,
          transformMatrix,
          matrixAutoUpdate: intersection.object.matrixAutoUpdate
        };
      },
      drag(matrix) {
        const now = performance.now();
        const diff = (now - lastTime) / 1000; // ms to s
        lastTime = now;
        box.velocity = new THREE.Vector3().setFromMatrixPosition(matrix);
        box.velocity.sub(new THREE.Vector3().setFromMatrixPosition(box.matrix));
        box.velocity.divideScalar(diff);
        box.matrix.copy(matrix);
        const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
        boxBody.position.x = pos.x;
        boxBody.position.y = pos.y;
        boxBody.position.z = pos.z;
        box.updateMatrixWorld(true);
      },
      drag_end: () => {
        const instVel = box.velocity;
        delete box.velocity;
        boxBody.velocity.x = instVel.x;
        boxBody.velocity.y = instVel.y;
        boxBody.velocity.z = instVel.z;
      }
    };

    this.scene.add(box);

    this.bodies.push(boxBody);
    this.meshes.push(box);

    this.checkObjectLimit();

    boxBody.position.set(0, 7, 0);
    box.position.set(0, 7, 0);
  }

  _createSpawners() {
    // Sphere
    let material = new THREE.MeshPhongMaterial({ color: 'white' });
    const ballSpawner = new TriggerMesh(this.ballGeo, material);
    ballSpawner.castShadow = true;
    ballSpawner.receiveShadow = true;
    ballSpawner.position.set(0, -1.6, -13);

    ballSpawner.addFunction('spawnBall', this._spawnBall);

    ballSpawner.hover = function () {
      if (!this.isSelected) {
        this.material.color.set('green');
      }
    };

    ballSpawner.select = function () {
      this.material.color.set('white');
      this.functions.spawnBall();
    };

    ballSpawner.exit = function () {
      this.material.color.set('grey');
    };

    this.triggers.add(ballSpawner);

    const ballBody = new CANNON.Body({ mass: 0 });
    ballBody.addShape(this.ballShape);
    ballBody.position.copy(ballSpawner.position);
    this.world.addBody(ballBody);

    // Box
    material = new THREE.MeshPhongMaterial({ 
      color     : 'white',
      specular  : 0xffffff,
      shininess : 2
    });

    const boxSpawner = new TriggerMesh(this.boxGeo, material);
    boxSpawner.castShadow = true;
    boxSpawner.receiveShadow = true;
    boxSpawner.position.set(-4, -1.6, -13);

    boxSpawner.addFunction('spawnBox', this._spawnBox);

    boxSpawner.hover = function () {
      if (!this.isSelected) {
        this.material.color.set('green');
      }
    };

    boxSpawner.select = function () {
      this.material.color.set('white');
      this.functions.spawnBox();
    };

    boxSpawner.exit = function () {
      this.material.color.set('grey');
    };

    this.triggers.add(boxSpawner);

    const boxBody = new CANNON.Body({ mass: 0 });
    boxBody.addShape(this.boxShape);
    boxBody.position.copy(boxSpawner.position);
    this.world.addBody(boxBody);
  }

  toggleGravity = () => {
    if (this.world.gravity.y === -9.8) {
      this.world.gravity.y = 0;
    }
  }

  reverseGravity = () => {
    if (this.world.gravity.y === 0) {
      this.world.gravity.y = -9.8;
    }
  }

  onKeyUp = (event) => {
    switch (event.keyCode) {
      // G
      case 71:
        this.toggleGravity();
        break;
      // R
      case 82:
        this.reverseGravity();
        break;
      default:
        break;
    }
  }

  checkObjectLimit() {
    if (this.meshes.length > 100) {
      this.world.remove(this.bodies[0]);
      this.triggers.remove(this.meshes[0]);
      this.scene.remove(this.meshes[0]);
      this.bodies.shift();
      this.meshes.shift();
    }
  }

  _initCannon() {
    // const radius = 1;
    const length = this.length / 2;
    const width = this.width / 2;
    const height = 8;
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.gravity.set(0, -9.8, 0);

    // Creating Ground.
    const groundShape = new CANNON.Plane();
    const groundMaterial = new CANNON.Material();
    const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, -height, 0);
    this.world.addBody(groundBody);

    const groundContact = new CANNON.ContactMaterial(
      groundMaterial, this.objectMaterial, { friction: 0.5, restitution: 0.2 }
    );
    const objectContact = new CANNON.ContactMaterial(
      this.objectMaterial, this.objectMaterial, { friction: 0.4, restitution: 0.4 }
    );
    this.world.addContactMaterial(groundContact);
    this.world.addContactMaterial(objectContact);

    const roofBody = new CANNON.Body({ mass: 0 });
    roofBody.addShape(groundShape);
    roofBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    roofBody.position.set(0, height, 0);
    this.world.addBody(roofBody);

    const wallFrontBody = new CANNON.Body({ mass: 0 });
    wallFrontBody.addShape(groundShape);
    wallFrontBody.position.set(-length, 0, -width);
    this.world.addBody(wallFrontBody);

    const wallBackBody = new CANNON.Body({ mass: 0 });
    wallBackBody.addShape(groundShape);
    wallBackBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI);
    wallBackBody.position.set(length, 0, width);
    this.world.addBody(wallBackBody);

    const wallRightBody = new CANNON.Body({ mass: 0 });
    wallRightBody.addShape(groundShape);
    wallRightBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    wallRightBody.position.set(length, 0, -width);
    this.world.addBody(wallRightBody);

    const wallLeftBody = new CANNON.Body({ mass: 0 });
    wallLeftBody.addShape(groundShape);
    wallLeftBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    wallLeftBody.position.set(-length, 0, width);
    this.world.addBody(wallLeftBody);
  }

  _addLight() {
    const dLight = new THREE.DirectionalLight( 0xd7cbb1, 1.0 );
    dLight.position.x = 500;
    dLight.position.y = 500;
    dLight.position.z = 500;
    this.scene.add( dLight );

    const aLight = new THREE.AmbientLight(0xaabbff, 0.2);
    this.scene.add(aLight);

    const pLight = new THREE.PointLight(0xffffff, 0.5, 75);
    pLight.position.set(0, 10, 0);
    this.scene.add(pLight);
  }

  _updateArrowHelpers() {

  }

  animate(delta) {
    this.updatePhysics(delta);
    this._updateArrowHelpers();

    // Update position of meshes
    for (let i = 0; i < this.bodies.length; i++) {
      this.meshes[i].position.copy(this.bodies[i].position);
      this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
    }
  }
}
