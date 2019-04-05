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

    this.loader.addTextureToQueue(
      planetData.Saturn.ringsTexture,
      'rings-texture'
    );

    // this.planets = createPlanets();
    // this.planets.forEach(p => this.scene.add(p.mesh));
    this.addLighting();
  }

  addLighting() {
    const ambientLight = new AmbientLight('white', 0.3);
    this.scene.add(ambientLight);
  }

  onAssetsLoaded(cache) {
    super.onAssetsLoaded(cache);

    this.planets = [];
    let i = 0;

    Object.keys(planetData).forEach(planetName => {
      const texture = cache[planetName];
      const geo = new SphereGeometry(5, 20, 20);

      let material;
      if (planetName === 'Sun') {
        material = new MeshBasicMaterial({ map: texture });
      } else {
        material = new MeshPhongMaterial({ map: texture });
      }

      const mesh = new Mesh(geo, material);

      mesh.position.x = i++ * 20 - 80;
      mesh.position.y = 2;
      mesh.name = planetName;
      this.scene.add(mesh);
      this.planets.push(mesh);
    });

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
    // movePlanets(this.planets, delta);
  }
}
