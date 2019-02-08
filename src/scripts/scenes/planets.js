import {
  SphereGeometry, Mesh, MeshBasicMaterial, AmbientLight
} from 'three';
import XrScene from './xr-scene';

export default class PlanetsScene extends XrScene {
  /**
   *
   * @param {THREE.Renderer} renderer
   * @param {THREE.Camera} camera
   */
  constructor(renderer, camera) {
    super(renderer, camera);

    this.ball = this.createBall();
    this.addLighting();
    this.ballVelocity = 0.01;
  }

  createBall() {
    const geometry = new SphereGeometry(1);
    const mat = new MeshBasicMaterial({ color: 'red', wireframe: true });
    const ball = new Mesh(geometry, mat);
    ball.position.set(0, 0, -5);
    this.scene.add(ball);

    return ball;
  }

  addLighting() {
    const ambientLight = new AmbientLight('white', 0.7);
    this.scene.add(ambientLight);
  }

  animate() {
    const { x } = this.ball.position;
    if (x < -2 || x > 2) {
      this.ballVelocity *= -1;
    }
    this.ball.position.setX(x + this.ballVelocity);
  }
}
