import { SphereGeometry, Mesh, MeshLambertMaterial, Vector3 } from 'three';

function randomColor() {
  return '#000000'.replace(/0/g, () => (~~(Math.random() * 16)).toString(16));
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
export function createPlanets() {
  const sizes = [0.5, 0.75, 1, 0.5, 3, 2, 1, 0.5];
  return sizes.map(radius => {
    const x = randBetween(4, 10);
    const y = randBetween(4, 10);
    const z = randBetween(4, 10);

    // const velocity = new Vector3(
    //   randBetween(0, 0.3),
    //   randBetween(0, 0.3),
    //   randBetween(0, 0.3)
    // );
    const velocity = new Vector3(0, 0, 0);

    return {
      velocity,
      radius,
      mass: Math.PI * (4 / 3) * radius ** 3,
      mesh: createPlanetMesh(radius, x, y, z)
    };
  });
}

/**
 * update `planet`'s z coord in place to ensure the planet's
 * velocity is equal to it's escape velocity
 *
 * @param {Planet} planet
 * @param {Planet[]} allPlanets
 */
export function safeInitialVelocity(planet, allPlanets) {}
