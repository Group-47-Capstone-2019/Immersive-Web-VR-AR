import {
  AmbientLight,
  PointLight,
  MeshPhongMaterial,
  Mesh,
  RingGeometry,
  DoubleSide,
  Spherical
} from 'three';
import XrScene from '../xr-scene';
import { createPlanets, planetTextName, nextPointName, cameraPointName } from './create';
import planetData from './planets';
import ringTextureUrl from '../../../assets/planets/saturnRings.jpg';
import { createTextSprite } from './text';

const EARTH_YEAR_SECONDS = 120;

export default class PlanetsScene extends XrScene {
  currentPlanet = planetData.Sun;

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

  addGui() {
    this.nextButton = createTextSprite('Next Planet', 'white', 'gray');
    this.prevButton = createTextSprite('Previous Planet', 'white', 'gray');

    const sun = this.planets.find(p => p.name === 'Sun');

    const sunDesc = sun.getObjectByName(planetTextName('Sun'));
    sunDesc.visible = true;

    const sunNext = sun.getObjectByName(nextPointName('Sun'));
    sunNext.add(this.nextButton);

    const cameraPoint = sun.getObjectByName(cameraPointName('Sun'));
    cameraPoint.add(this.camera);
  }

  addLighting() {
    const ambientLight = new AmbientLight('white', 0.3);
    this.scene.add(ambientLight);
  }

  onAssetsLoaded(cache) {
    super.onAssetsLoaded(cache);

    this.planets = createPlanets(planetData, cache);
    this.planets.forEach(p => this.scene.add(p));

    this.addPlanetRings(cache);
    this.addSunLight();
    this.addGui();
  }

  addPlanetRings(cache) {
    // saturn's rings
    const saturn = this.scene.getObjectByName('Saturn');
    const saturnRingGeo = new RingGeometry(2.5, 3.5, 50);
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
    const uranusRingGeo = new RingGeometry(2.5, 3.5, 50);
    const uranusRingMat = new MeshPhongMaterial({
      map: cache['rings-texture'],
      side: DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const uranusRingMesh = new Mesh(uranusRingGeo, uranusRingMat);
    uranusRingMesh.rotateX(Math.PI / 2);
    uranus.add(uranusRingMesh);
  }

  nextPlanet = () => {
    const index = this.planets.findIndex(
      p => p.name === this.currentPlanet.name
    );
    const nextPlanet = this.planets[index + 1];
    this.planets[index].getObjectByName(
      planetTextName(this.currentPlanet.name)
    ).visible = false;

    this.currentPlanet = planetData[nextPlanet.name];
    nextPlanet.getObjectByName(
      planetTextName(this.currentPlanet.name)
    ).visible = true;
  };

  addSunLight() {
    const sun = this.scene.getObjectByName('Sun');
    const pointLight = new PointLight('white', 0.8, 1000);
    sun.add(pointLight);
  }

  /**
   * animation function - called each frame
   *
   * @param {number} deltaSeconds
   */
  animate(deltaSeconds) {
    this.planets.forEach(mesh => {
      const spherical = new Spherical().setFromVector3(mesh.position);
      const angularVel =
        (2 * Math.PI) / planetData[mesh.name].orbitYears / EARTH_YEAR_SECONDS;
      spherical.theta += angularVel * deltaSeconds;
      mesh.position.setFromSpherical(spherical);
    });
  }
}
