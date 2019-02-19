import {
  AmbientLight,
  PointLight
} from 'three';
import XrScene from '../xr-scene';
import { createPlanets } from './create';
import { movePlanets } from './orbit';

export default class PlanetsScene extends XrScene {
  /**
   *
   * @param {THREE.Renderer} renderer
   * @param {THREE.Camera} camera
   */
  constructor(renderer, camera) {
    super(renderer, camera);

    this.planets = createPlanets();
    this.planets.forEach(p => this.scene.add(p.mesh));
    this.addLighting();
  }

  addLighting() {
    const ambientLight = new AmbientLight('white', 0.1);
    this.scene.add(ambientLight);

    const pointLight = new PointLight('white', 0.8, 1000);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);
  }

  /**
   * animation function - called each frame
   *
   * @param {number} delta
   */
  animate(delta) {
    movePlanets(this.planets, delta);
  }
}
