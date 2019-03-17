import { Raycaster } from 'three';

// ThreeJS raycaster object
const raycaster = new Raycaster();

// Holds a reference to the last intersection
let prevIntersection;

/**
 * Updates the raycaster origin and direction
 * @param {Vector3} origin Point in world coordinates where ray begins
 * @param {Vector3} direction Normalized direction vector for ray
 */
export function updateRay(origin, direction) {
  raycaster.set(origin, direction);
}

/**
 * Updates the raycaster from camera. Used in keyboard session
 * @param {Vector2} mouse
 * @param {PerspectiveCamera} camera
 */
export function updateRayFromCamera(mouse, camera) {
  raycaster.setFromCamera(mouse, camera);
}

/**
 * Checks for intersections with the group of objects passed in.
 * If the previously intersected object is still being selected
 * then only raycast for that object else get first intersection
 * in the group passed in.
 * @param {Object3D} group Object with children (Scene or Group)
 * Must be a list of triggerMeshes
 * @returns {Intersection} Intersection information, can be null
 */
export function getIntersection(group) {
  // Raycast for the currently selected object only (Not hovered)
  if (prevIntersection && prevIntersection.object.isSelected) {
    const intersections = raycaster.intersectObject(prevIntersection.object);
    if (intersections && intersections.length) return intersections[0];
    return null;
  }

  // Check for intersection with the entire group
  const intersections = raycaster.intersectObject(group, true);
  if (intersections && intersections.length) {
    const intersection = intersections[0];

    // Intersecting a new object, different from previous intersection
    if (prevIntersection && intersection.object.id !== prevIntersection.object.id) {
      prevIntersection.object.onTriggerExit(prevIntersection);
    }
    prevIntersection = intersection;
    return intersection;
  }

  // Not intersecting anything, set prevIntersection to null and exit it if it exists
  if (prevIntersection) {
    prevIntersection.object.onTriggerExit(prevIntersection);
    prevIntersection = null;
  }

  return null;
}
