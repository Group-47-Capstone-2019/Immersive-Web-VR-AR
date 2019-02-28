/* eslint-disable no-unused-vars */
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { worker } from 'cluster';
import XrScene from './xr-scene';
import { controls } from '../controls/keyboard-controls';

export default class FallingScene extends XrScene {
  /**
  *
  * @param {THREE.Renderer} renderer
  * @param {THREE.Camera} camera
  */
  constructor(renderer, camera) {
    super(renderer, camera);

    // Generate room geometry.
    const roomGeometry = new THREE.BoxGeometry(24, 16, 24);
    const roomMaterials = new THREE.MeshPhongMaterial({ color: 0x003050, side: THREE.BackSide });
    this.room = new THREE.Mesh(roomGeometry, roomMaterials);
    this.room.receiveShadow = true;
    this.room.castShadow = true;
    //this.scene.fog = new THREE.Fog(0x000000, 0, 24);
    this.scene.add(this.room);
    this.camera = camera;
    this.balls = [];
    this.ballMeshes = [];
    this.ballShape = new CANNON.Sphere(0.5);
    this.ballGeo = new THREE.SphereGeometry(this.ballShape.radius, 32, 32);

    //this.ball = this.createBall();
    this.addAmbientLight();
    this.initCannon();
    this._addEventListener(window, 'click', this.spawnBall);
    this._addEventListener(window, 'keyup', this.onKeyUp);
  }

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

  spawnBall = () => {
    if(controls.enabled == true) {
      console.log("Spawn ball");
      let controlsYaw = controls.getObject();
      let direction = new THREE.Vector3(0, 0, -1);
      let speed = 20;
      direction.applyQuaternion(controlsYaw.quaternion);
      let x = controlsYaw.position.x;
      x += direction.x;
      let y = controlsYaw.position.y;
      y += direction.y;
      let z = controlsYaw.position.z;
      z += direction.z;
      let ballBody = new CANNON.Body({mass: 1});
      ballBody.addShape(this.ballShape);
      let material = new THREE.MeshLambertMaterial({color: 'orange'});
      let ballMesh = new THREE.Mesh(this.ballGeo, material);
      ballMesh.castShadow = true;
      ballMesh.receiveShadow = true;
      this.world.addBody(ballBody);
      this.scene.add(ballMesh);
      
      this.balls.push(ballBody);
      this.ballMeshes.push(ballMesh);

      ballBody.velocity.x = direction.x * speed;
      ballBody.velocity.y = direction.y * speed;
      ballBody.velocity.z = direction.z * speed;
      
      ballBody.position.set(x,y,z);
      ballMesh.position.set(x,y,z);
    }
  }

  // createBall() {
  //   // Create Sphere.
  //   const geometry = new THREE.SphereGeometry(1, 50, 50);
  //   const material = new THREE.MeshStandardMaterial({ color: 'orange' });
  //   const ball = new THREE.Mesh(geometry, material);
  //   ball.position.set(3, 5, -5);
  //   this.scene.add(ball);
  //   return ball;
  // }

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
    const groundShape = new CANNON.Box(new CANNON.Vec3(24, 24, 0.001));
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, -8, 0);
    this.world.addBody(groundBody);

    const roofBody = new CANNON.Body({ mass: 0 });
    roofBody.addShape(groundShape);
    roofBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    roofBody.position.set(0, 8, 0);
    this.world.addBody(roofBody);

    const wallFrontBody = new CANNON.Body({mass: 0});
    wallFrontBody.addShape(groundShape);
    wallFrontBody.position.set(-12, 0, -12);
    this.world.addBody(wallFrontBody);

    const wallBackBody = new CANNON.Body({mass: 0});
    wallBackBody.addShape(groundShape);
    wallBackBody.position.set(12, 0, 12);
    this.world.addBody(wallBackBody);

    const wallRightBody = new CANNON.Body({mass: 0});
    wallRightBody.addShape(groundShape);
    wallRightBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    wallRightBody.position.set(12, 0, -12);
    this.world.addBody(wallRightBody);

    const wallLeftBody = new CANNON.Body({mass: 0});
    wallLeftBody.addShape(groundShape);
    wallLeftBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    wallLeftBody.position.set(-12, 0, 12);
    this.world.addBody(wallLeftBody);
  }

  addAmbientLight() {
    const ambientLight = new THREE.AmbientLight('white', 0.7);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  animate(delta) {
    this.updatePhysics(delta);

    // Update position of meshes
    for(var i = 0; i < this.balls.length; i++) {
      this.ballMeshes[i].position.copy(this.balls[i].position);
      this.ballMeshes[i].quaternion.copy(this.balls[i].quaternion);
    }

    // this.ball.position.copy(this.ballBody.position);
    // this.ball.quaternion.copy(this.ballBody.quaternion);
  }
}
