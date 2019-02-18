import { Vector3 } from 'three';
import { Planet } from './create';

export const G = 6.673e-11;

/**
 * returns force of gravity on p1 and p2 from the other
 *
 * @param {Vector3} p1
 * @param {Vector3} p2
 */
function forceGrav(p1, p2, m1, m2) {
  const rSquared = p1.distanceToSquared(p2);

  return (G * m1 * m2) / rSquared;
}

/**
 * returns new `Vector3` that points from v1 to v2
 *
 * @param {Vector3} v1
 * @param {Vector3} v2
 */
function relativePos(v1, v2) {
  const distVec = new Vector3();
  distVec.subVectors(v2, v1);

  return distVec;
}

/**
 * moves planet p1 by amount other planet is acting on it
 *
 * @param {Planet} p1 planet to move
 * @param {Vector3} pos1 old position planet to move
 * @param {Vector3} pos2 old position of other planet
 * @param {number} mass2 mass of other planet
 * @param {number} time delta time
 */
function movePlanet(p1, pos1, pos2, mass2, time) {
  const forceScalar = forceGrav(pos1, p2, p1.mass, mass2);

  const accelerationVec = relativePos(pos1, pos2)
    .multiplyScalar(forceScalar) // force
    .divideScalar(p1.mass); // acceleration

  // update pos
  const d1 = new Vector3().set(p1.velocity).multiplyScalar(time);

  const d2 = new Vector3()
    .set(accelerationVec)
    .multiplyScalar(0.5 * Math.pow(time, 2));

  p1.mesh.position.add(d1).add(d2);

  // update vel
  accelerationVec.multiply(time);
  p1.velocity.add(accelerationVec); // accelerationVec is now a*t
}

/**
 *
 * @param {Planet[]} allPlanets
 * @param {number} time
 */
export function movePlanets(allPlanets, time) {
  const oldPlanetPositions = allPlanets.map(p =>
    new Vector3().set(p.mesh.position)
  );

  // loop through all pairs of planets
  for (let i = 0; i < allPlanets.length; i++) {
    for (let j = 0; j < allPlanets.length; j++) {
      if (i !== j) {
        movePlanet(
          allPlanets[i],
          oldPlanetPositions[i],
          oldPlanetPositions[j],
          allPlanets[j].mass,
          time
        );
      }
    }
  }
}
