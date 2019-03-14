import THREE from '../../three';
import { getController } from '../../../assets/loader';

export default class Controller {

    constructor() {
      this.controller = getController();
    }

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
      const controller = this.controller;

      // Disable auto update so it doesn't update before we are done
      controller.matrixAutoUpdate = false;
      controller.matrix.copy(matrix);
      controller.updateMatrixWorld(true);
    }
}
