import THREE from '../../three';
import controllerGLB from '../../../assets/controller/controller.glb';

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
      this.loadControllerModel();
    }

    get length() {
      return this.controllers.length;
    }

    loadControllerModel() {
      const gltfLoader = new THREE.GLTFLoader();
      gltfLoader.load(controllerGLB, (object) => {
        this.controllerMesh = object.scene;
      });
    }

    /**
     * Loads mesh for specified controller type.
     * Adds mesh to scene and controllers array.
     * @param {THREE.Scene} scene
     */
    addController() {
      const controller = this.controllerMesh.clone();
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
      if (controller.geometry) controller.geometry.dispose();
      if (controller.material) controller.material.dispose();

      // Remove controller from array
      this.controllers.splice(index, 1);

      controller = undefined;
    }

    removeAllControllers() {
      for (let i = 0; i < this.controllers.length; i++) {
        this.removeController(i);
      }
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
