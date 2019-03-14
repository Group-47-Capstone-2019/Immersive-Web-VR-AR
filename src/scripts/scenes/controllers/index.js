/**
 * The purpose of this class is to hold onto references
 * to XR controller and laser meshes for updating
 * frame by frame
 */
export default class Controller {
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
}
