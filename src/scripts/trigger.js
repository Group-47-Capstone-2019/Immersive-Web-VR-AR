import { Mesh } from 'three';
import { Interactions } from './interactions';

export default class TriggerMesh extends Mesh {
    // True if raycaster intersects this object
    isIntersected = false;

    // True if raycaster selected this object
    isSelected = false;

    // This should never change
    isTriggerObject = true;

    debug = false;

    // Trigger functions - Override these
    hover() {}

    exit() {}

    select() {}

    release() {}

    functions = {};

    get [Interactions]() {
      const self = this;
      let _isActuallyIntersected = false;
      return {
        select_start(intersection) {
          if (!self.isIntersected) {
            self.isIntersected = true;
            console.log('Trigger: hover');
            self.hover(intersection);
          }
          self.isSelected = true;
          console.log('Trigger: select');
          self.select(intersection);
        },
        select_end() {
          self.isSelected = false;
          console.log('Trigger: release');
          self.release();
          if (!_isActuallyIntersected) {
            self.isSelected = false;
            console.log('Trigger: exit');
            self.exit();
          }
        },
        hover_start(intersection) {
          if (!self.isIntersected) {
            self.isIntersected = true;
            console.log('Trigger: hover');
            self.hover(intersection);
          }
          _isActuallyIntersected = true;
        },
        hover_end() {
          if (self.isIntersected && !self.isSelected) {
            self.isIntersected = false;
            console.log('Trigger: exit');
            self.exit();
          }
          _isActuallyIntersected = false;
        }
      };
    }

    /**
     * Adds a function to the function list.
     * Useful for calling functions with their own contexts
     * (i.e. arrow functions)
     * Call a function: this.functions.key(params);
     * @param {String} key
     * @param {Function} func
     */
    addFunction(key, func) {
      this.functions[key] = func;
    }

    /**
     * Override of Object3D.clone() to include the object callbacks and material
     */
    clone() {
      const triggerMesh = super.clone();
      triggerMesh.material = this.material.clone();
      triggerMesh.hover = this.hover;
      triggerMesh.exit = this.exit;
      triggerMesh.select = this.select;
      triggerMesh.release = this.release;
      triggerMesh.functions = this.functions;
      return triggerMesh;
    }
}
