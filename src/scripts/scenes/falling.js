/* eslint-disable no-unused-vars */
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { worker } from 'cluster';
import XrScene from './xr-scene';

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
    const room = new THREE.Mesh(roomGeometry, roomMaterials);
    room.receiveShadow = true;
    room.castShadow = true;
    this.scene.fog = new THREE.Fog(0x000000, 0, 24);
    this.scene.add(room);
    this.createPlane();

    this.ball = this.createBall();
    this.addAmbientLight();
    this.body = this.initCannon();
  }

  createPlane() {
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

  createBall() {
    // Create Sphere.
    const geometry = new THREE.SphereGeometry(1);
    const mataterial = new THREE.MeshBasicMaterial({ color: 'orange', wireframe: true });
    const ball = new THREE.Mesh(geometry, mataterial);
    ball.position.set(0, 5, -5);
    this.scene.add(ball);
    return ball;
  }

  initCannon() {
    // Creating World.
    const radius = 1;
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.gravity.set(0, -15, 0);
    const sphereBody = new CANNON.Body(
      {
        mass: 1,
        position: new CANNON.Vec3(1, 0, 0),
        shape: new CANNON.Sphere(radius)
      }
    );
    sphereBody.position.set(0, 5, -5);

    // Creating Ground.
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, -8, 0);
    this.world.addBody(groundBody);
    
    this.world.add(sphereBody);
    const body = sphereBody;
    return body;
  }

  addAmbientLight() {
    const ambientLight = new THREE.AmbientLight('white', 0.7);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  animate() {
    this.updatePhysics();
    this.ball.position.copy(this.body.position);
    this.ball.quaternion.copy(this.body.quaternion);
  }
}
