/* eslint-disable no-unused-vars */
import THREE from '../three';
import * as CANNON from 'cannon';
import XrScene from './xr-scene';
import { userPosition, touchscreen } from '../controls/touch-controls';
import { controls } from '../controls/keyboard-controls';
// import Table from '../../assets/table/Desk.fbx';

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
    //this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.createRoom();
    this.camera = camera;
    

    // Objects 
    this.bodies = [];
    this.meshes = [];
    
    // Balls
    this.ballShape = new CANNON.Sphere(1);
    this.ballGeo = new THREE.SphereGeometry(this.ballShape.radius, 32, 32);

    // Boxes
    this.boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    this.boxGeo = new THREE.BoxGeometry(2, 2, 2);

    // Cylinders

    console.log("constructor");

    // this.loadTable();
    this.raycaster = new THREE.Raycaster();
    this.mouseVector = new THREE.Vector3();
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.selectedObj = null;
    this.selectedObjColor;
    this.colorSet = false;

    this.createSpawners();
    //this.ball = this.createBall();
    
    this.addLight();
    
    this.initCannon();
    this._addEventListener(window, 'mousedown', this.onClick);
    this._addEventListener(window, 'keyup', this.onKeyUp);
  }

  createRoom() {
    // Generate room geometry.
    const roomGeometry = new THREE.BoxGeometry(24, 16, 24);
    const roomMaterials = new THREE.MeshPhongMaterial({ color: 0x003050, side: THREE.BackSide });
    this.room = new THREE.Mesh(roomGeometry, roomMaterials);
    this.room.receiveShadow = true;
    this.room.castShadow = true;
    this.scene.add(this.room);
    
    // Create spawner tube
    const tubeMaterials = new THREE.MeshPhongMaterial({ color: 'gray', side: THREE.DoubleSide});
    const spawnTubeGeo = new THREE.CylinderGeometry(2, 2, 3, 32, 32, true);
    let spawnTube = new THREE.Mesh(spawnTubeGeo, tubeMaterials);
    spawnTube.position.set(0, 7, 0);
    this.scene.add(spawnTube);
  }

  createSpawners() {
    // Sphere
    let material = new THREE.MeshPhongMaterial({color: 'gray'});
    this.ballSpawner = new THREE.Mesh(this.ballGeo, material);
    this.ballSpawner.castShadow = true;
    this.ballSpawner.receiveShadow = true;
    this.ballSpawner.position.set(0, -7, -8);
    this.group.add(this.ballSpawner);

    let ballBody = new CANNON.Body({mass: 0});
    ballBody.addShape(this.ballShape);
    ballBody.position.copy(this.ballSpawner.position);
    this.world.addBody(ballBody);

    // Box
    material = new THREE.MeshPhongMaterial({color: 'gray'});
    this.boxSpawner = new THREE.Mesh(this.boxGeo, material);
    this.boxSpawner.castShadow = true;
    this.boxSpawner.receiveShadow = true;
    this.boxSpawner.position.set(-3, -7, -8);
    this.group.add(this.boxSpawner);

    let boxBody = new CANNON.Body({mass: 0});
    boxBody.addShape(this.boxShape);
    boxBody.position.copy(this.boxSpawner.position);
    this.world.addBody(boxBody);
    
    // Cylinder
  }

  updateRay() {
    if (this.selectedObj) {
      this.selectedObj.material.color.set(this.selectedObjColor);
      this.colorSet = false;
      this.selectedObj = null;
    }

    // Get ray from keyboard controls
    if(controls != null) {
      let direction = new THREE.Vector3();
      controls.getDirection(direction);
      this.raycaster.set(controls.getObject().position, direction);
    

      let intersects = this.raycaster.intersectObject(this.group, true);
      if (intersects.length > 0) {
        let res = intersects.filter(function(res) {
          return res && res.object;
        })[0];
        
        if(res && res.object) {
          this.selectedObj = res.object;
          if(!this.colorSet) {
            this.selectedObjColor = this.selectedObj.material.color.getHex();
            
            this.colorSet = true;
          }
          this.selectedObj.material.color.set('green');
        }
      }
    }
  }

  // loadTable() {
  //   var loader = new THREE.FBXLoader();
  //   console.log("loading..");
  //   loader.load(Table, function(obj) {
  //     console.log("boo");
  //     this.scene.add(obj);
  //     obj.position.z = -2;
  //   });
  // }

  onKeyUp = () => {
    switch (event.keyCode) {
      case 71:
        this.toggleGravity();
        break;
      default:
        break;
    }
  }

  toggleGravity = () => {
    console.log("Toggling gravity.");
    if (this.world.gravity.y === -9.8) {
      console.log("Gravity off");
      this.world.gravity.y = 0;
    } else {
      console.log("Gravity on");
      this.world.gravity.y = -9.8;
    }
  }

  onClick = (event) => {
    if (touchscreen.enabled) {
      let touch = new THREE.Vector3();
      touch.x = (event.clientX / window.innerWidth) * 2 - 1;
      touch.y = - (event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(touch, this.camera);
    }

    let intersects = this.raycaster.intersectObject(this.group, true);
    if (intersects.length > 0) {
      let res = intersects.filter(function(res) {
        return res && res.object;
      })[0];

      if (res && res.object) {
        if (res.object === this.ballSpawner) {
          this.spawnBall();
        } else if (res.object === this.boxSpawner) {
          this.spawnBox();
        }
      }
    }
  }

  checkObjectLimit() {
    if (this.meshes.length > 100) {
      this.world.remove(this.bodies[0]);
      this.group.remove(this.meshes[0]);
      this.scene.remove(this.meshes[0]);
      this.bodies.shift();
      this.meshes.shift();
    }
  }

  spawnBall() {
    console.log("Spawn ball");
    
    let ballBody = new CANNON.Body({mass: 1});
    ballBody.addShape(this.ballShape);
    let material = new THREE.MeshPhongMaterial({color: 'orange'});
    let ballMesh = new THREE.Mesh(this.ballGeo, material);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    this.world.addBody(ballBody);
    this.group.add(ballMesh);
    
    this.bodies.push(ballBody);
    this.meshes.push(ballMesh);

    this.checkObjectLimit();
    
    ballBody.position.set(0, 7, 0);
    ballMesh.position.set(0, 7, 0);
  }

  spawnBox() {
    console.log("Spawn box");

    let boxBody = new CANNON.Body({mass: 1});
    boxBody.addShape(this.boxShape);
    let material = new THREE.MeshPhongMaterial({color: 'red'});
    let boxMesh = new THREE.Mesh(this.boxGeo, material);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    this.world.addBody(boxBody);
    this.group.add(boxMesh);

    this.bodies.push(boxBody);
    this.meshes.push(boxMesh);

    this.checkObjectLimit();
    
    boxBody.position.set(0, 7, 0);
    boxMesh.position.set(0, 7, 0);
  }

  initCannon() {
    //const radius = 1;
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.gravity.set(0, -9.8, 0);
    
    // const sphereBody = new CANNON.Body(
    //   {
    //     mass: 1,
    //     shape: new CANNON.Sphere(radius)
    //   }
    // );
    // sphereBody.position.set(0, 1, -5);
    // this.ballBody = sphereBody;
    // this.world.add(sphereBody);

    // Creating Ground.
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, -8, 0);
    this.world.addBody(groundBody);

    const roofBody = new CANNON.Body({ mass: 0 });
    roofBody.addShape(groundShape);
    roofBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    roofBody.position.set(0, 8, 0);
    this.world.addBody(roofBody);

    const wallFrontBody = new CANNON.Body({mass: 0});
    wallFrontBody.addShape(groundShape);
    wallFrontBody.position.set(-12, 0, -12);
    this.world.addBody(wallFrontBody);

    const wallBackBody = new CANNON.Body({mass: 0});
    wallBackBody.addShape(groundShape);
    wallBackBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI);
    wallBackBody.position.set(12, 0, 12);
    this.world.addBody(wallBackBody);

    const wallRightBody = new CANNON.Body({mass: 0});
    wallRightBody.addShape(groundShape);
    wallRightBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    wallRightBody.position.set(12, 0, -12);
    this.world.addBody(wallRightBody);

    const wallLeftBody = new CANNON.Body({mass: 0});
    wallLeftBody.addShape(groundShape);
    wallLeftBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    wallLeftBody.position.set(-12, 0, 12);
    this.world.addBody(wallLeftBody);
  }

  addLight() {
    const ambientLight = new THREE.AmbientLight('white', 0.5);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('white', 1.0, 1000);
    keyLight.position.set(-100, 0, 100);
    //keyLight.castShadow = true;
    //keyLight.shadow.bias = 0.0001;
    //keyLight.shadow.mapSize.width = 2048 * 2;
    //keyLight.shadow.mapSize.height = 2048 * 2;
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
    this.updatePhysics(delta);

    this.updateRay();

    // Update position of meshes
    for(var i = 0; i < this.bodies.length; i++) {
      this.meshes[i].position.copy(this.bodies[i].position);
      this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
    }
  }
}
