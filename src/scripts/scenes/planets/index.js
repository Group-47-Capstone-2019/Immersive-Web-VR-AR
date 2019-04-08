import {
  AmbientLight,
  PointLight,
  Color,
  SphereGeometry,
  MeshPhongMaterial,
  MeshBasicMaterial,
  Mesh,
  RingGeometry,
  DoubleSide
} from 'three';
import XrScene from '../xr-scene';
import { createPlanets } from './create';
import { movePlanets } from './orbit';
import planetData from './planets';
import ringTextureUrl from '../../../assets/planets/saturnRings.jpg';

export default class PlanetsScene extends XrScene {
  /**
   *
   * @param {THREE.Renderer} renderer
   * @param {THREE.Camera} camera
   */
  constructor(renderer, camera) {
    super(renderer, camera);

    Object.keys(planetData).forEach(planet =>
      this.loader.addTextureToQueue(planetData[planet].texture, planet)
    );

    this.loader.addTextureToQueue(ringTextureUrl, 'rings-texture');
    this.addLighting();
  }

  addLighting() {
    const ambientLight = new AmbientLight('white', 0.3);
    this.scene.add(ambientLight);
  }

  onAssetsLoaded(cache) {
    super.onAssetsLoaded(cache);

    this.planets = createPlanets(planetData, cache);
    this.planets.forEach(p => this.scene.add(p.mesh));

    // saturn's rings
    const saturn = this.scene.getObjectByName('Saturn');
    const saturnRingGeo = new RingGeometry(6, 9, 50);
    const saturnRingMat = new MeshPhongMaterial({
      map: cache['rings-texture'],
      side: DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const saturnRingMesh = new Mesh(saturnRingGeo, saturnRingMat);
    saturnRingMesh.rotateX(Math.PI / 2);
    saturn.add(saturnRingMesh);

    // uranus's rings
    const uranus = this.scene.getObjectByName('Uranus');
    const uranusRingGeo = new RingGeometry(6, 9, 50);
    const uranusRingMat = new MeshPhongMaterial({
      map: cache['rings-texture'],
      side: DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const uranusRingMesh = new Mesh(uranusRingGeo, uranusRingMat);
    uranusRingMesh.rotateX(Math.PI / 2);
    uranus.add(uranusRingMesh);

    // add light to the sun
    const sun = this.scene.getObjectByName('Sun');
    const pointLight = new PointLight('white', 0.8, 1000);
    sun.add(pointLight);
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
