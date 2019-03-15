import { Mesh } from 'three';

export default class TriggerMesh extends Mesh {
    // True if raycaster intersects this object
    isIntersected = false;

    // True if raycaster selected this object
    isSelected = false;

    // Trigger functions
    hover;

    exit;

    hold;

    release;

    /**
     * Called when raycaster is currently intersecting
     */
    onTriggerHover() {
      this.isIntersected = true;
      if (this.hover) this.hover();
    }

    /**
     * Called when raycaster no longer intersects
     * this object
     */
    onTriggerExit() {
      this.isIntersected = false;
      if (this.isSelected) this.onTriggerRelease();
      if (this.exit) this.exit();
    }

    /**
     * Called when raycaster intersects and
     * the input device clicks and holds
     */
    onTriggerHold() {
      this.isSelected = true;
      if (this.hold) this.hold();
    }

    /**
     * Called when raycaster input device
     * releases a click when intersecting
     */
    onTriggerRelease() {
      this.isSelected = false;
      if (this.release) this.release();
    }
}
