import { SphereGeometry, Mesh, MeshBasicMaterial, SmoothShading, MeshLambertMaterial } from 'three';

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
export function createPlanet(size, x, y, z) {
  const geometry = new SphereGeometry(size, 20, 20);
  const mat = new MeshLambertMaterial({ color: randomColor() });

  const ball = new Mesh(geometry, mat);
  ball.position.set(x, y, z);
  ball.material.smoothShading = true;

  return ball;
}

const sizes = [0.5, 0.75, 1, 0.5, 3, 2, 1, 0.5];
export const planets = sizes.map((s, i) => createPlanet(s, 10, 0, i * 7 - 30));
