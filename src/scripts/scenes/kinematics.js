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

    //Assets
    this._loadAssets();

    // Objects
    this.bodies = [];
    this.meshes = [];

    this.arrows = [];

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

    this._initGuide();

    this._initCannon();
    this._addEventListener(window, 'mousedown', this.onClick);
    this._addEventListener(window, 'keyup', this.onKeyUp);
  }

  _initGuide() {
    const guide = createTextPlane(
    `
    KINEMATICS SANDBOX
    ------------------

    In this experience, you can spawn in spheres and cubes to toss around the scene.
    
    Spheres and Cubes are spawned by pointing the cursor at the respective shape
    on the table and clicking. The object will spawn from the tube above the table.

    Pick up and throw objects by pointing the cursor at them and holding the select button down
    then releasing when you wish to let go of the object.

    Drag the gravity slider to the left and right to change the magnitude of gravity in the scene.

    Change the direction of gravity by selecting and dragging the white directional arrow to the
    right of the table.
    `, 'white');
    guide.position.set(-20, 2.5, 2.5);
    guide.rotateY(Math.PI / 2);
    this.scene.add(guide);
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
    mesh.position.set(0, -5.5, -19);
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
    const gravityLabel = createTextPlane('9.8', 'white', 'orange');
    gravityLabel.raycast = () => [];

    const gravSliderGeo = new THREE.BoxGeometry(1, 1, 0.25);
    const gravSliderMat = new THREE.MeshBasicMaterial( {color: 'white'} );
    const gravitySlider = new THREE.Mesh(gravSliderGeo, gravSliderMat);
    gravitySlider.position.set(-3.8, 8, -20);
    gravitySlider.add(gravityLabel);
    gravityLabel.position.set(0, 2, 0);

    gravitySlider[Interactions] = {
      hover_start() {
        if (!this.isSelected) {
          gravitySlider.material.color.set(0x999999);
        }
      },
      hover_end() {
        gravitySlider.material.color.set(0xfafafa);
      },
      drag_start: (intersection, pointerMatrix) => {
        const pointerInverse = new THREE.Matrix4().getInverse(pointerMatrix, true);
        const target = new THREE.Matrix4().copy(intersection.object.matrixWorld);
        const transformMatrix = new THREE.Matrix4().multiplyMatrices(pointerInverse, target);
        return {
          object: intersection.object,
          transformMatrix,
          matrixAutoUpdate: intersection.object.matrixAutoUpdate
        };
      },
      drag: (matrix) => {
        const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
        pos.y = 8;
        pos.z = -20;

        if (pos.x < -6.24) {
          pos.x = -6.24;
        } else if (pos.x > 6.25) {
          pos.x = 6.25;
        }
        let scalar = (pos.x + 3.8) * 4 + 9.8;
        let gravity = this.world.gravity;
        let grav = new THREE.Vector3();
        grav.set(gravity.x, gravity.y, gravity.z);
        grav.normalize().multiplyScalar(scalar);

        if (gravitySlider.children.length > 0) {
          gravitySlider.children[0].geometry.dispose();
          gravitySlider.children[0].material.dispose();
          gravitySlider.remove(gravitySlider.children[0]);
        }

        const rounded = Math.round(scalar * 10) / 10;
        const gravityLabel = createTextPlane(rounded.toString(), 'white', 'orange');
        gravityLabel.raycast = () => [];
        gravitySlider.add(gravityLabel);
        gravityLabel.position.set(0, 2, 0);

        gravitySlider.matrix.setPosition(pos);
        gravitySlider.position.x = pos.x
        gravitySlider.updateMatrixWorld(true);
        this.world.gravity.set(grav.x, grav.y, grav.z);
      }
    };

    const gravGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const gravMat = new THREE.MeshBasicMaterial( {color: 'white'} );
    const gravityBall = new THREE.Mesh(gravGeo, gravMat);
    gravityBall.position.set(9, 4, -20);
    
    const gravityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(9, 4, -20),
      6,
      'white'
    );
    gravityArrow.raycast = () => [];

    gravityBall[Interactions] = {
      hover_start() {
        if (!this.isSelected) {
          gravityBall.material.color.set(0x999999);
        }
      },
      hover_end() {
        gravityBall.material.color.set(0xfafafa);
      },
      drag_start: (intersection, pointerMatrix) => {
        const pointerInverse = new THREE.Matrix4().getInverse(pointerMatrix, true);
        const target = new THREE.Matrix4().copy(intersection.object.matrixWorld);
        const transformMatrix = new THREE.Matrix4().multiplyMatrices(pointerInverse, target);
        return {
          object: intersection.object,
          transformMatrix,
          matrixAutoUpdate: intersection.object.matrixAutoUpdate
        };
      },
      drag: (matrix) => {
        const dir = new THREE.Vector3();
        
        if (this.scene.getObjectByName('controller')) {
          const controller = this.scene.getObjectByName('controller');
          controller.getWorldDirection(dir);
          dir.negate();
        } else {
          this.camera.getWorldDirection(dir);
        }

        gravityArrow.setDirection(dir);

        let gravity = new THREE.Vector3();
        gravity.set(this.world.gravity.x, this.world.gravity.y, this.world.gravity.z);
        const scalar = gravity.length();

        dir.multiplyScalar(scalar);

        this.world.gravity.set(dir.x, dir.y, dir.z);
      }
    };

    const buttonGeo = new THREE.BoxGeometry(2, 3, 0.5);
    const buttonGeo2 = new THREE.BoxGeometry(2, 3, 0.5);

    const buttonMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const zeroButton = new TriggerMesh(buttonGeo.clone(), buttonMat.clone());
    const resetButton = new TriggerMesh(buttonGeo2.clone(), buttonMat.clone());

    const menu = new THREE.Object3D();
    const menu2 = new THREE.Object3D();

    menu.add(zeroButton);
    menu2.add(resetButton);

    this.scene.add(menu);
    this.scene.add(menu2);

    menu.position.set(-4, 3, -20);
    menu2.position.set(4, 3, -20);

    zeroButton.position.set(6, 0, 0.25);
    resetButton.position.set(-6, 0, 0.25);

    const createLabelGravity = createTextPlane('Gravity', 'white', 'orange');
    zeroButton.add(createLabelGravity);
    createLabelGravity.position.set(-2, 3, 0.26);

    const createLabelZero = createTextPlane('Zero', 'white', 'red');
    zeroButton.add(createLabelZero);
    createLabelZero.position.set(0, -1, 1);

    const createLabelReset = createTextPlane('Reset', 'white', 'green');
    resetButton.add(createLabelReset);
    createLabelReset.position.set(0, -1, 1);

    zeroButton.addFunction('toggleGravity', this.toggleGravity);
    resetButton.addFunction('reverseGravity', this.reverseGravity);

    zeroButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set('green');
      }
    };

    zeroButton.select = function () {
      this.functions.toggleGravity();
      this.position.z = -0.125;
      this.material.color.set(0x999999);
      resetButton.position.z = 0.25;
      resetButton.material.color.set(0x222222);

      gravitySlider.position.x = -6.26;

      if (gravitySlider.children.length > 0) {
        gravitySlider.children[0].geometry.dispose();
        gravitySlider.children[0].material.dispose();
        gravitySlider.remove(gravitySlider.children[0]);
      }

      const gravityLabel = createTextPlane('0', 'white', 'orange');
      gravityLabel.raycast = () => [];
      gravitySlider.add(gravityLabel);
      gravityLabel.position.set(0, 2, 0);
    };

    zeroButton.exit = function () {
      this.material.color.set(0x999999);
    };

    resetButton.hover = function () {
      if (!this.isSelected) {
        this.material.color.set('green');
      }
    };

    resetButton.select = function () {
      this.functions.reverseGravity();
      this.position.z = -0.125;
      this.material.color.set(0x999999);
      zeroButton.position.z = 0.25;
      zeroButton.material.color.set(0x222222);

      gravitySlider.position.x = -3.8;

      if (gravitySlider.children.length > 0) {
        gravitySlider.children[0].geometry.dispose();
        gravitySlider.children[0].material.dispose();
        gravitySlider.remove(gravitySlider.children[0]);
      }

      const gravityLabel = createTextPlane('9.8', 'white', 'orange');
      gravityLabel.raycast = () => [];
      gravitySlider.add(gravityLabel);
      gravityLabel.position.set(0, 2, 0);

      gravityArrow.setDirection(new THREE.Vector3(0, -1, 0));
    };

    resetButton.exit = function () {
      this.material.color.set(0x999999);
    };
    
    this.scene.add(gravitySlider);
    this.scene.add(gravityBall);
    this.scene.add(gravityArrow);

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
    spawnTube.position.set(0, 12, -10);
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
    const material = new THREE.MeshPhongMaterial({ color: 'orange' });
    const ball = new THREE.Mesh(this.ballGeo, material);
    ball.castShadow = true;
    ball.receiveShadow = true;
    this.world.addBody(ballBody);

    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      0,
      'yellow'
    );

    this.arrows.push({position : ball.position, velocity : ballBody.velocity, arrow : arrow});
    this.scene.add(arrow);

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

    ballBody.position.set(0, 11, -10);
    ball.position.set(0, 11, -10);
  }

  _spawnBox = () => {
    const boxBody = new CANNON.Body({ mass: 1, material: this.objectMaterial });
    boxBody.addShape(this.boxShape);
    const material = new THREE.MeshPhongMaterial({ color: 'orange' });
    const box = new THREE.Mesh(this.boxGeo, material);
    box.castShadow = true;
    box.receiveShadow = true;
    this.world.addBody(boxBody)

    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      0,
      'yellow'
    );

    this.arrows.push({position : box.position, velocity : boxBody.velocity, arrow : arrow});
    this.scene.add(arrow);

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

    boxBody.position.set(0, 11, -10);
    box.position.set(0, 11, -10);
  }

  _createSpawners() {
    // Sphere
    let material = new THREE.MeshPhongMaterial({ color: 'white' });
    const ballSpawner = new TriggerMesh(this.ballGeo, material);
    ballSpawner.castShadow = true;
    ballSpawner.receiveShadow = true;
    ballSpawner.position.set(0, -1.6, -17);

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
    boxSpawner.position.set(-4, -1.6, -17);

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
    this.world.gravity.set(0, 0.001, 0);
  }

  reverseGravity = () => {
    this.world.gravity.set(0, -9.8, 0);
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
    for(let i = 0; i < this.arrows.length; i++) {
      const velocity = this.arrows[i].velocity;
      const position = this.arrows[i].position;
      const arrow = this.arrows[i].arrow

      const direction = new THREE.Vector3(
        position.x + velocity.x,
        position.y + velocity.y,
        position.z + velocity.z
      );

      arrow.position.copy(position);
      arrow.setLength(velocity.length());
      arrow.setDirection(direction.normalize());
    }
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
