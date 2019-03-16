import { Mesh } from 'three';

export default class TriggerMesh extends Mesh {
    // True if raycaster intersects this object
    isIntersected = false;

    // True if raycaster selected this object
    isSelected = false;

    // This should never change
    isTriggerObject = true;

    // Trigger functions - Override these
    hover;

    exit;

    select;

    release;

    /**
     * Called when raycaster is currently intersecting
     * Called every frame onHover
     * @param {Intersection} intersection
     */
    onTriggerHover(intersection) {
      console.log('TRIGGER: HOVER');
      this.isIntersected = true;
      if (this.hover) this.hover(intersection);
    }

    /**
     * Called when raycaster no longer intersects
     * this object.
     * Called once on exit.
     * @param {Intersection} intersection
     */
    onTriggerExit(intersection) {
      console.log('TRIGGER: EXIT');
      this.isIntersected = false;
      if (this.isSelected) this.onTriggerRelease(intersection);
      if (this.exit) this.exit();
    }

    /**
     * Called when raycaster intersects and
     * the input device clicks and holds.
     * Called every frame on selection.
     * @param {Intersection} intersection
     */
    onTriggerSelect(intersection) {
      console.log('TRIGGER: SELECT');
      this.isSelected = true;
      if (this.select) this.select(intersection);
    }

    /**
     * Called when raycaster input device
     * releases a click when intersecting.
     * Called once on release.
     * @param {Intersection} intersection
     */
    onTriggerRelease(intersection) {
      console.log('TRIGGER: RELEASE');
      this.isSelected = false;
      if (this.release) this.release(intersection);
    }
}
