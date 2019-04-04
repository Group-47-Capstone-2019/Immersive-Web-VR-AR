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

    exit() {};

    select() {};

    release() {};

    functions = {};

    get [Interactions]() {
      const self = this;
      return {
        select_start(intersection) {
          console.log('TriggerMesh - select_start');
          self.select(intersection);
        },
        select_end(intersection) { // This doesn't actually receive an intersection
        console.log('TriggerMesh - select_end');
          self.release(intersection);
        },
        hover_start(intersection) {
          console.log('TriggerMesh - hover_start');
          self.hover(intersection);
        },
        hover_end(intersection) { // This doesn't actually receive an intersection
          console.log('TriggerMesh - hover_end');
          self.exit(intersection);
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
