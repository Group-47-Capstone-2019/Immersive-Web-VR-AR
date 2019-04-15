/* eslint-disable no-unused-vars */
import * as CANNON from 'cannon';
import THREE from '../three';
import XrScene from './xr-scene';

import table from '../../assets/table.obj';
import tTable from '../../assets/textures/table/table.jpeg';
import nTable from '../../assets/textures/table/tableNormal.jpeg';

import nGround from '../../assets/textures/groundNormal.png';

import oDoor from '../../assets/door.glb';

import TriggerMesh from '../trigger';
import { Interactions } from '../interactions';

import sky_nx from '../../assets/textures/skybox/sky_nx.png';
import sky_ny from '../../assets/textures/skybox/sky_ny.png'; 
import sky_nz from '../../assets/textures/skybox/sky_nz.png';
import sky_px from '../../assets/textures/skybox/sky_px.png'; 
import sky_py from '../../assets/textures/skybox/sky_py.png'; 
import sky_pz from '../../assets/textures/skybox/sky_pz.png';

export default class KinematicsScene extends XrScene {
  /**
  *
  * @param {THREE.Renderer} renderer
  * @param {THREE.Camera} camera
  */
  constructor(renderer, camera) {
    super(renderer, camera);

    this.length = 2000;
    this.width = 2000;
    this._createEnv();

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

  _createSkybox(textures) {
    const gSkybox = new THREE.BoxGeometry(1000, 1000, 1000);
    const mSkybox = [];
    for(let i = 0; i < 6; i++) {
        mSkybox.push(new THREE.MeshBasicMaterial({
            map : textures[i],
            side : THREE.DoubleSide,
            depthTest : false
        }));
    }
    const skybox = new THREE.Mesh(gSkybox, mSkybox);
    skybox.name = 'skybox';
    this.scene.add(skybox);
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

    this._createSkybox(skyboxTextures);
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
    this.ground = ground;
    this.scene.add(ground);

    // Create spawner tube
    const tubeMaterials = new THREE.MeshPhongMaterial({ color: 'gray', side: THREE.DoubleSide });
    const spawnTubeGeo = new THREE.CylinderGeometry(2, 2, 3, 32, 32, true);
    const spawnTube = new THREE.Mesh(spawnTubeGeo, tubeMaterials);
    spawnTube.position.set(0, 8 - 1, 0);
    this.scene.add(spawnTube);
  }

  _spawnBall = () => {
    console.log('Spawn ball');

    const ballBody = new CANNON.Body({ mass: 1, material: this.objectMaterial });
    ballBody.addShape(this.ballShape);
    const material = new THREE.MeshPhongMaterial({ color: 'orange' });
    const ball = new THREE.Mesh(this.ballGeo, material);
    ball.castShadow = true;
    ball.receiveShadow = true;
    this.world.addBody(ballBody);

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
    console.log('Spawn box');

    const boxBody = new CANNON.Body({ mass: 1, material: this.objectMaterial });
    boxBody.addShape(this.boxShape);
    const material = new THREE.MeshPhongMaterial({ color: 'orange' });
    const box = new TriggerMesh(this.boxGeo, material);
    box.castShadow = true;
    box.receiveShadow = true;
    this.world.addBody(boxBody);

    box.hover = function () {
      if (!this.isSelected) {
        this.material.color.set(0xFF0000);
      }
    };

    box.exit = function () {
      this.material.color.set('orange');
    };

    this.triggers.add(box);

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
        this.material.color.set(0xFF0000);
      }
    };

    ballSpawner.select = function () {
      this.functions.spawnBall();
    };

    ballSpawner.exit = function () {
      this.material.color.set(0xFFFFFF);
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
        this.material.color.set(0xFF0000);
      }
    };

    boxSpawner.select = function () {
      this.functions.spawnBox();
    };

    boxSpawner.exit = function () {
      this.material.color.set(0xFFFFFF);
    };

    this.triggers.add(boxSpawner);

    const boxBody = new CANNON.Body({ mass: 0 });
    boxBody.addShape(this.boxShape);
    boxBody.position.copy(boxSpawner.position);
    this.world.addBody(boxBody);
  }

  toggleGravity = () => {
    console.log('Toggling gravity.');
    if (this.world.gravity.y === -9.8) {
      console.log('Gravity off');
      this.world.gravity.y = 0;
    } else {
      console.log('Gravity on');
      this.world.gravity.y = -9.8;
    }
  }

  reverseGravity() {
    console.log('Reverse gravity.');
    this.world.gravity.y *= -1;
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

  animate(delta) {
    this.updatePhysics(delta);

    // Update position of meshes
    for (let i = 0; i < this.bodies.length; i++) {
      this.meshes[i].position.copy(this.bodies[i].position);
      this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
    }
  }
}
