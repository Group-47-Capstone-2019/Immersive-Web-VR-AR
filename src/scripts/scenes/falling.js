/* eslint-disable no-unused-vars */
import * as CANNON from 'cannon';
import THREE from '../three';
import XrScene from './xr-scene';
import Table from '../../assets/Simple Wood Table.obj';
import TriggerMesh from '../trigger';

import sky_nx from '../../assets/textures/Skybox/sky_nx.png';
import sky_ny from '../../assets/textures/Skybox/sky_ny.png'; 
import sky_nz from '../../assets/textures/Skybox/sky_nz.png';
import sky_px from '../../assets/textures/Skybox/sky_px.png'; 
import sky_py from '../../assets/textures/Skybox/sky_py.png'; 
import sky_pz from '../../assets/textures/Skybox/sky_pz.png';

export default class FallingScene extends XrScene {
  /**
  *
  * @param {THREE.Renderer} renderer
  * @param {THREE.Camera} camera
  */
  constructor(renderer, camera) {
    super(renderer, camera);

    this.camera = camera;
    this.renderer = renderer;

    this.renderer.shadowMap.enabled = true;

    this._createRoom();
    this._loadTable();
    this.camera = camera;

    //Assets
    this.loader.addTextureToQueue(sky_nx, 'sky_nx');
    this.loader.addTextureToQueue(sky_ny, 'sky_ny');
    this.loader.addTextureToQueue(sky_nz, 'sky_nz');
    this.loader.addTextureToQueue(sky_px, 'sky_px');
    this.loader.addTextureToQueue(sky_py, 'sky_py');
    this.loader.addTextureToQueue(sky_pz, 'sky_pz');

    this.length = 2000;
    this.width = 2000;

    // Objects
    this.bodies = [];
    this.meshes = [];
    this.objectMaterial = new CANNON.Material();

    // Balls
    this.ballShape = new CANNON.Sphere(1);
    this.ballGeo = new THREE.SphereGeometry(this.ballShape.radius, 32, 32);

    // Boxes
    this.boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    this.boxGeo = new THREE.BoxGeometry(2, 2, 2);

    // Cylinders

    this._createSpawners();

    this._addLight();

    this._initCannon();
    this._addEventListener(window, 'mousedown', this.onClick);
    this._addEventListener(window, 'keyup', this.onKeyUp);
  }

  _createSkybox(textures) {
    const gSkybox = new THREE.BoxGeometry(3000, 3000, 3000);
    const mSkybox = [];
    for(let i = 0; i < 6; i++) {
        mSkybox.push(new THREE.MeshBasicMaterial({
            map : textures[i],
            side : THREE.DoubleSide
        }));
    }
    const skybox = new THREE.Mesh(gSkybox, mSkybox);
    skybox.name = 'skybox';
    this.scene.add(skybox);
    console.log(this.scene);
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

    this._createSkybox(skyboxTextures);
  }

  _createRoom() {
    // Generate room geometry.
    const gGround = new THREE.PlaneGeometry(this.width, this.length);
    const mGround = new THREE.MeshPhongMaterial({
      color : 0xa8a8a8,
      specular    : 0xffffff,
      shininess   : 10
    });
    const ground = new THREE.Mesh(gGround, mGround);
    ground.receiveShadow = true;
    ground.rotateX(-1.5708);
    ground.position.set(0, -8, 0);
    this.scene.add(ground);

    // Create spawner tube
    const tubeMaterials = new THREE.MeshPhongMaterial({ color: 'gray', side: THREE.DoubleSide });
    const spawnTubeGeo = new THREE.CylinderGeometry(2, 2, 3, 32, 32, true);
    const spawnTube = new THREE.Mesh(spawnTubeGeo, tubeMaterials);
    spawnTube.position.set(0, 7, 0);
    this.scene.add(spawnTube);
  }

  _spawnBall = () => {
    console.log('Spawn ball');

    const ballBody = new CANNON.Body({ mass: 1, material: this.objectMaterial });
    ballBody.addShape(this.ballShape);
    const material = new THREE.MeshPhongMaterial({ color: 'orange' });
    const ball = new TriggerMesh(this.ballGeo, material);
    ball.castShadow = true;
    ball.receiveShadow = true;
    this.world.addBody(ballBody);

    ball.hover = function () {
      if (!this.isSelected) {
        this.material.color.set(0xFF0000);
      }
    };

    ball.exit = function () {
      this.material.color.set('orange');
    };

    this.triggers.add(ball);

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
    let material = new THREE.MeshPhongMaterial({ color: 'gray' });
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
    material = new THREE.MeshPhongMaterial({ color: 'gray' });
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

    // Cylinder
  }

  _loadTable() {
    let object;

    function loadModel() {
      object.traverse((child) => {
        if (child.isMesh)child.material.map = texture;
      });

      object.position.z = -15;
      object.position.y = -5.5;
      this.scene.add(object);
    }

    const manager = new THREE.LoadingManager(loadModel.bind(this));

    manager.onProgress = function (item, loaded, total) {
      console.log(item, loaded, total);
    };

    const textureLoader = new THREE.TextureLoader(manager);

    const texture = textureLoader.load('../../assets/textures/Diffuse.jpeg');

    function onProgress(xhr) {
      if (xhr.lengthComputable) {
        const percentComplete = xhr.loaded / xhr.total * 100;
        console.log(`model${Math.round(percentComplete, 2)}% downloaded`);
      }
    }

    function onError() {}

    const loader = new THREE.OBJLoader();
    loader.load(Table, (obj) => {
      object = obj;
    }, onProgress, onError);
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

  _createPlane() {
    // Generate plane ground using geometry and materials.
    const geometry2 = new THREE.PlaneGeometry(25, 25, 25, 25);
    geometry2.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    const material2 = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, wireframe: true });
    const mesh2 = new THREE.Mesh(geometry2, material2);
    mesh2.castShadow = true;
    mesh2.receiveShadow = true;
    mesh2.position.set(0, -8, 0);
    this.scene.add(mesh2);
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
    const dLight = new THREE.DirectionalLight( 0xd7cbb1, 0.4 );
    dLight.position.x = 500;
    dLight.position.y = 500;
    dLight.position.z = 500;
    dLight.castShadow = true;
    this.scene.add( dLight );

    const aLight = new THREE.AmbientLight(0xaabbff, 0.2);
    this.scene.add(aLight);
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
