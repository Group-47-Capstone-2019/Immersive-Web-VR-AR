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
    planets.forEach(p => this.scene.add(p));
  }

  addLighting() {
    const ambientLight = new AmbientLight('white', 0.7);
    //this.scene.add(ambientLight);

    const pointLight = new PointLight('white', 0.9, 1000);
    pointLight.position.set(1, 2, 3);
    this.scene.add(pointLight);
  }
}
