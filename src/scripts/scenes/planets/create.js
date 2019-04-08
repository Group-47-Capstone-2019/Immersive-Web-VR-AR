import {
  SphereGeometry,
  Mesh,
  MeshLambertMaterial,
  Vector3,
  MeshPhongMaterial,
  MeshBasicMaterial,
} from 'three';
import planets from './planets';

export const DISTANCE_MULTIPLIER = 100;
export const MASS_MULTIPLIER = 1e-24;

function randomColor() {
  return '#000000'.replace(/0/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

/**
 * build a planet mesh and return it
 *
 * @param {number} size
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function createPlanetMesh(size, x, y, z) {
  const geometry = new SphereGeometry(size, 20, 20);
  const mat = new MeshLambertMaterial({ color: randomColor() });

  const ball = new Mesh(geometry, mat);
  ball.position.set(x, y, z);
  ball.material.smoothShading = true;

  return ball;
}

/**
 * returns a random number between the two values
 *
 * @param {number} low
 * @param {number} high
 */
const randBetweenPos = (low, high) => Math.random() * (high - low) + low;

/**
 * return random number (posive or negative) whose absolute value
 * lies between the given values.
 *
 * @param {number} low
 * @param {number} high
 */
const randBetween = (low, high) =>
  randBetweenPos(low, high) * (Math.random() > 0.5 ? -1 : 1);

/**
 * @typedef Planet
 * @property {Vector3} velocity
 * @property {number} mass
 * @property {number} radius
 * @property {Mesh} mesh
 */

/**
 * build planets, with mesh and randomized position
 *
 * @returns {Planet[]} created planets
 */
export function createPlanets(planetData, cache) {
  return Object.keys(planetData).map(planetName => {
    const texture = cache[planetName];
    const planet = planetData[planetName];
    const geo = new SphereGeometry(2, 20, 20);

    let material;
    if (planetName === 'Sun') {
      material = new MeshBasicMaterial({ map: texture });
    } else {
      material = new MeshPhongMaterial({ map: texture });
    }

    const mesh = new Mesh(geo, material);

    mesh.position
      .fromArray(planet.initialPosition)
      .multiplyScalar(DISTANCE_MULTIPLIER);
    mesh.name = planetName;

    return {
      mesh,
      velocity: new Vector3()
        .fromArray(planet.initialVelocity)
        .multiplyScalar(DISTANCE_MULTIPLIER),
      name: planetName,
      mass: planet.mass * MASS_MULTIPLIER
    };
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
