import { Vector3 } from 'three';
import { Planet } from './create';
export const G = 6.673e-11;

/**
 * returns force of gravity on p1 and p2 from the other
 * 
 * @param {Planet} p1
 * @param {Planet} p2
 */
function forceGrav(p1, p2) {
  const rSquared = p1.mesh.position.distanceToSquared(p2.mesh.position);

  return (G * p1.mass * p2.mass) / rSquared;
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

function 