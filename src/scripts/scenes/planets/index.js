import {
  AmbientLight,
  PointLight,
  MeshPhongMaterial,
  Mesh,
  RingGeometry,
  DoubleSide,
  Spherical,
  Object3D,
  Vector3
} from 'three';
import XrScene from '../xr-scene';
import {
  createPlanets,
  planetTextName,
  nextPointName,
  cameraPointName,
  prevPointName,
  CAMERA_OFFSET
} from './create';
import planetData from './planets';
import ringTextureUrl from '../../../assets/planets/saturnRings.jpg';
import { createTextPlane } from './text';
import TWEEN from '@tweenjs/tween.js';
import { XR } from '../../xrController';
import { navigate } from '../../router';

const EARTH_YEAR_SECONDS = 120;
const TWEEN_SECONDS = 5;

export default class PlanetsScene extends XrScene {
  currentPlanet = planetData.Sun;
  cameraPoint = new Object3D();
  isXr = false;
  buttonsEnabled = true;

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
    this.nextButton = createTextPlane('Next Planet', 'white', 'gray');
    this.prevButton = createTextPlane('Previous Planet', 'white', 'gray');
    this.exitButton = createTextPlane('Exit to Home', 'white', 'darkred');
    this.nextButton.select = this.nextPlanet;
    this.prevButton.select = this.prevPlanet;
    this.exitButton.select = this.exitToHome;

    const sun = this.planets.find(p => p.name === 'Sun');

    const sunDesc = sun.getObjectByName(planetTextName('Sun'));
    sunDesc.visible = true;

    const sunNext = sun.getObjectByName(nextPointName('Sun'));
    sunNext.add(this.nextButton);

    const sunPrev = sun.getObjectByName(prevPointName('Sun'));
    sunPrev.add(this.exitButton);

    const sunCamera = sun.getObjectByName(cameraPointName('Sun'));

    if (this.controls) {
      this.cameraPoint.add(this.controls.getObject());
    } else {
      this.isXr = true;
    }
    
    sunCamera.add(this.cameraPoint);

    // just for testing...
    // document.planets = this;
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
    const saturnRadius = planetData.Saturn.fakeRadius;
    const saturnRingGeo = new RingGeometry(
      saturnRadius + 0.5,
      saturnRadius + 2.5,
      50
    );
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
    const uranusRadius = planetData.Uranus.fakeRadius;
    const uranusRingGeo = new RingGeometry(
      uranusRadius + 0.5,
      uranusRadius + 2.5,
      50
    );
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
    if (this.buttonsEnabled) {
      this.movePlanets(1);
    }
  };

  prevPlanet = () => {
    if (this.buttonsEnabled) {
      this.movePlanets(-1);
    }
  };

  exitToHome = () => {
    if (this.buttonsEnabled) {
      navigate('/home');
    }
  }

  movePlanets(offset) {
    // index of current planet
    const index = this.planets.findIndex(
      p => p.name === this.currentPlanet.name
    );
    const nextIndex = index + offset;

    const currPlanetMesh = this.planets[index];
    const currPlanetName = currPlanetMesh.name;
    const nextPlanetMesh = this.planets[nextIndex];
    const nextPlanetName = nextPlanetMesh.name;

    // hide current planets text
    currPlanetMesh.getObjectByName(
      planetTextName(currPlanetName)
    ).visible = false;

    // show next planets text
    nextPlanetMesh.getObjectByName(
      planetTextName(nextPlanetName)
    ).visible = true;

    this.startTween(nextIndex);

    // move next button and hide it if needed
    if (nextIndex < this.planets.length - 2) {
      const nextPlanetNextButton = nextPlanetMesh.getObjectByName(
        nextPointName(nextPlanetName)
      );
      nextPlanetNextButton.add(this.nextButton);
      this.nextButton.visible = true;
    } else {
      this.nextButton.visible = false;
    }

    // move prev button and hide it if needed
    const nextPlanetPrevButton = nextPlanetMesh.getObjectByName(
      prevPointName(nextPlanetName)
    );
    if (nextIndex > 0) {
      nextPlanetPrevButton.add(this.prevButton);
      this.prevButton.visible = true;
      this.exitButton.visible = false;
    } else {
      // show/hide exit button
      this.prevButton.visible = false;
      this.exitButton.visible = true;
      nextPlanetPrevButton.add(this.exitButton);
    }

    // show/hide exit button
    if(nextIndex === 0) {

    }

    // update currentPlanet with next planet's data
    this.currentPlanet = planetData[nextPlanetName];
  }

  startTween(nextIndex) {
    // disable buttons
    this.buttonsEnabled = false;

    // unlock cameraPoint from current planet, keep in same position
    this.cameraPoint.localToWorld(this.cameraPoint.position);
    this.scene.add(this.cameraPoint);

    // angular velocity of second planet
    const nextPlanetName = this.planets[nextIndex].name;
    const angularVel =
      (2 * Math.PI) /
      planetData[nextPlanetName].orbitYears /
      EARTH_YEAR_SECONDS;

    // final position of next planet we're tweening to
    const nextPlanetPos = new Spherical().setFromVector3(
      this.planets[nextIndex].position
    );
    nextPlanetPos.theta += angularVel * TWEEN_SECONDS;
    const endVec = new Vector3().setFromSpherical(nextPlanetPos);
    const coords = {
      x: endVec.x + CAMERA_OFFSET.x,
      y: endVec.y + CAMERA_OFFSET.y + planetData[nextPlanetName].fakeRadius,
      z: endVec.z + CAMERA_OFFSET.z
    };

    // start tween from position of current planet (now in world coords)
    const from = {
      x: this.cameraPoint.position.x,
      y: this.cameraPoint.position.y,
      z: this.cameraPoint.position.z
    };

    new TWEEN.Tween(from)
      .to(coords, TWEEN_SECONDS * 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((a) => {
        this.cameraPoint.position.set(a.x, a.y, a.z);
        // this.camera.lookAt(coords);
      })
      .onComplete(() => {
        // this.camera.lookAt(coords.x, coords.y, coords.z);

        // add camera to next planet and reset to local coords
        this.cameraPoint.position.set(0, 0, 0);
        const nextPlanetCamera = this.planets[nextIndex].getObjectByName(
          cameraPointName(nextPlanetName)
        );
        nextPlanetCamera.add(this.cameraPoint);

        // re-enable buttons
        this.buttonsEnabled = true;
      })
      .start();
  }

  addSunLight() {
    const sun = this.scene.getObjectByName('Sun');
    const pointLight = new PointLight('white', 0.8, 10000);
    sun.add(pointLight);
  }

  updateXrCamera() {
    const offsetMatrix = XR.getOffsetMatrix();
    const cameraPos = new Vector3();
    this.cameraPoint.getWorldPosition(cameraPos);
    cameraPos.multiplyScalar(-1);
    offsetMatrix.setPosition(cameraPos);
    XR.setOffsetMatrix(offsetMatrix);
  }

  /**
   * animation function - called each frame
   *
   * @param {number} deltaSeconds
   */
  animate(deltaSeconds) {
    TWEEN.update();

    if (this.isXr) {
      this.updateXrCamera();
    }

    this.planets.forEach(mesh => {
      const spherical = new Spherical().setFromVector3(mesh.position);
      const angularVel =
        (2 * Math.PI) / planetData[mesh.name].orbitYears / EARTH_YEAR_SECONDS;
      spherical.theta += angularVel * deltaSeconds;
      mesh.position.setFromSpherical(spherical);
    });
  }
}
