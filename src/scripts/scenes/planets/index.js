import {
  SphereGeometry,
  Mesh,
  MeshBasicMaterial,
  AmbientLight,
  PointLight
} from 'three';
import XrScene from '../xr-scene';
import { planets } from './create';

export default class PlanetsScene extends XrScene {
  /**
   *
   * @param {THREE.Renderer} renderer
   * @param {THREE.Camera} camera
   */
  constructor(renderer, camera) {
    super(renderer, camera);

    this.createBalls();
    this.addLighting();
  }

  createBalls() {
    planets.forEach((p) => this.scene.add(p));
  }

  addLighting() {
    const ambientLight = new AmbientLight('white', 0.7);
    this.scene.add(ambientLight);

    const pointLight = new PointLight('white', 0.9);
    const { x, y, z } = this.camera.position;
    pointLight.position.set(x, y, z);
    this.scene.add(pointLight);
  }
}
