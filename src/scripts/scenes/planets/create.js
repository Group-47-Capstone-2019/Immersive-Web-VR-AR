import {
  SphereGeometry,
  Mesh,
  MeshPhongMaterial,
  MeshBasicMaterial,
  Object3D
} from 'three';

const DISTANCE_DIVIDER = 1e6;
const CAMERA_VIEW_DISTANCE = 10;

export const cameraPointName = planetName => `CameraPoint${planetName}`;

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

    const cameraPoint = new Object3D();
    mesh.add(cameraPoint);
    const cameraDist = CAMERA_VIEW_DISTANCE + planet.fakeRadius;
    cameraPoint.position.set(cameraDist, cameraDist, cameraDist);
    cameraPoint.name = cameraPointName(planetName);

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
