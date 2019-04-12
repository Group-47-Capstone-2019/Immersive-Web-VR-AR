import {
  SphereGeometry,
  Mesh,
  MeshPhongMaterial,
  MeshBasicMaterial,
  Object3D
} from 'three';
import { createPlanetText } from './ui';

const DISTANCE_DIVIDER = 1e6;

export const cameraPointName = planetName => `CameraPoint${planetName}`;
export const planetTextName = planetName => `TextPoint${planetName}`;
export const nextPointName = planetName => `NextPoint${planetName}`;
export const prevPointName = planetName => `PrevPoint${planetName}`;

/**
 * build planets, with mesh and randomized position
 *
 * @returns {Mesh[]} created planets
 */
export function createPlanets(planetData, cache) {
  return Object.keys(planetData).map(planetName => {
    const texture = cache[planetName];
    const planet = planetData[planetName];
    const geo = new SphereGeometry(planet.fakeRadius, 20, 20);

    let material;
    if (planetName === 'Sun') {
      material = new MeshBasicMaterial({ map: texture });
    } else {
      material = new MeshPhongMaterial({ map: texture });
    }

    const mesh = new Mesh(geo, material);

    mesh.position.setFromSphericalCoords(
      planet.orbitDistance / DISTANCE_DIVIDER,
      Math.PI / 2,
      Math.random() * Math.PI
    );
    mesh.name = planetName;

    // camera point
    const cameraPoint = new Object3D();
    mesh.add(cameraPoint);
    const cameraDist = 10 + planet.fakeRadius;
    cameraPoint.position.set(cameraDist, cameraDist, cameraDist);
    cameraPoint.name = cameraPointName(planetName);

    // text description
    const text = createPlanetText(planet);
    mesh.add(text);
    text.position.set(planet.fakeRadius + 5, 0, 0);
    text.name = planetTextName(planetName);
    text.visible = false;

    return mesh;
  });
}

/**
 * update `planet`'s z velocity in place to ensure the planet's
 * velocity is equal to it's escape velocity
 *
 * @param {Planet} planet
 * @param {Planet[]} allPlanets
 */
// export function safeInitialVelocity(planet, allPlanets) {}
