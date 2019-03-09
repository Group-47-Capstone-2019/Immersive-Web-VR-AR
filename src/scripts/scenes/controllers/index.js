import * as THREE from 'three';

export default class Controllers {
    controllers = [];

    /**
     * Constructor. Gets a reference to the
     * currently rendered scene for which to
     * add the controller models.
     * @param {THREE.Scene} scene
     */
    constructor(scene) {
      this.scene = scene;
    }

    get length() {
      return this.controllers.length;
    }

    /**
     * Loads mesh for specified controller type.
     * Adds mesh to scene and controllers array.
     * @param {THREE.Scene} scene
     */
    addController(type) {
      let controller;

      // Get the correct controller mesh
      switch (type) {
        case 'vive': {
          // TODO: Load vive mesh
          break;
        }
        case 'occulus': {
          // TODO: Load occulus mesh
          break;
        }
        case 'daydream': {
          // TODO: Load daydream mesh
          break;
        }
        default: {
          const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.1);
          const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
          controller = new THREE.Mesh(geometry, material);
        }
      }

      this.controllers.push(controller);
      this.scene.add(controller);
    }

    /**
     * Removes a controller from the scene and the controllers array
     * @param {Number} index
     */
    removeController(index) {
      let controller = this.controllers[index];
      this.scene.remove(controller);

      // Clean up
      controller.geometry.dispose();
      controller.material.dispose();

      // Remove controller from array
      this.controllers.splice(index, 1);

      controller = undefined;
    }

    /**
     * Gets a grip matrix in three.js friendly Matrix4 format
     * and indexed position of controller in controllers array.
     * Applies the passed in matrix to the controller model
     * in the list.
     * @param {THREE.Matrix4} matrix
     * @param {Number} index
     */
    updateControllerPosition(matrix, index) {
      const controller = this.controllers[index];

      // Disable auto update so it doesn't update before we are done
      controller.matrixAutoUpdate = false;
      controller.matrix.copy(matrix);
      controller.updateMatrixWorld(true);
    }
}
