import {
  Line,
  LineBasicMaterial,
  Vector3,
  Geometry
} from 'three';

/**
 * The purpose of this class is to hold onto references
 * to XR controller and laser meshes for updating
 * frame by frame
 */
export default class Controller {
  controller;

  laser;

  constructor(mesh) {
    this.controller = mesh;
  }

  /**
     * Returns controller mesh
     */
  get mesh() {
    return this.controller;
  }

  /**
   * Creates a basic laser mesh with no length at (0,0,0)
   */
  createLaser() {
    const geometry = new Geometry();
    geometry.vertices.push(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0)
    );

    const material = new LineBasicMaterial({ color: 0xffffff });

    this.laser = new Line(geometry, material);
  }

  /**
     * Gets a grip matrix in three.js friendly Matrix4 format
     * and indexed position of controller in controllers array.
     * Applies the passed in matrix to the controller model
     * in the list.
     * @param {THREE.Matrix4} matrix
     * @param {Number} index
     */
  updateControllerPosition(matrix) {
    // Disable auto update so it doesn't update before we are done
    this.controller.matrixAutoUpdate = false;
    this.controller.matrix.copy(matrix);
    this.controller.updateMatrixWorld(true);
  }

  /**
   * Updates the laser mesh vertices
   * @param {Vector3} origin
   * @param {Vector3} direction
   * @param {Number} length
   */
  updateLaser(origin, direction, length) {
    // Set origin vertex
    this.laser.geometry.vertices[0] = origin;

    // Set end vertex by multiplying the direciton vector by the length
    // Add the origin so the end vertex is translated into the correct position
    this.laser.geometry.vertices[1] = direction.multiplyScalar(length).add(origin);
    this.laser.geometry.verticesNeedUpdate = true;
  }
}
