import {
  Scene, Matrix4, Vector3, Clock
} from 'three';
import { World } from 'cannon';

import { XR } from '../xrController';
import { canvas } from '../renderer/canvas';
import { userPosition, updateTouchPosition, touchscreen } from '../controls/touch-controls';
import {
  keyboard,
  controls,
  updatePosition
} from '../controls/keyboard-controls';

export default class XrScene {
  scene = new Scene();

  world = new World();

  clock = new Clock();


  isActive = true;

  frame = null;

  state = {};

  eventListeners = [];

  /**
   * Initialize the scene. Sets this.scene, this.renderer, and this.camera for you.
   *
   * @param {THREE.Renderer} renderer
   * @param {THREE.Camera} camera
   */
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera = camera;

    // Ray variables
    this.raycaster = new THREE.Raycaster();
    this.interactive = new THREE.Group();
    this.scene.add(this.interactive);

    // For highlighting objects
    this.selectedObj = null;
    this.selectedObjColor;
    this.colorSet = false;

    

    // Make sure that animation callback is called on an xrAnimate event.
    this._addEventListener(window, 'xrAnimate', this._restartAnimation);
    this._addEventListener(window, 'mousedown', this.onClick);

    this._checkForKeyboardMouse();
  }

  /**
   * Basic ray functionality interacting with objects in the interactive group. 
   * Add objects that you want to be able to interact with into this.interactive and then they will be
   * highlighted when you look at them.
   */
  updateRay() {
    if (this.selectedObj) {
      this.selectedObj.material.color.set(this.selectedObjColor);
      this.colorSet = false;
      this.selectedObj = null;
    }

    // Get ray from keyboard controls
    if(controls != null) {
      let direction = new THREE.Vector3();
      controls.getDirection(direction);
      this.raycaster.set(controls.getObject().position, direction);
    }
    

    let intersects = this.raycaster.intersectObject(this.interactive, true);
    if (intersects.length > 0) {
      let res = intersects.filter(function(res) {
        return res && res.object;
      })[0];
      
      if(res && res.object) {
        this.selectedObj = res.object;
        if(!this.colorSet) {
          this.selectedObjColor = this.selectedObj.material.color.getHex();
          
          this.colorSet = true;
        }
        this.selectedObj.material.color.set('green');
      }
    }
  }

  /**
   * Override this to handle animating objects in your scene.
   * @param {number} delta time since last scene update
   */
  animate(delta) {
    this.updateRay();
    return delta;
  }

  /**
   * Step the physics world.
   */
  updatePhysics(delta) {
    this.world.step(delta);
  }

  /**
   * Call this to begin animating your frame.
   */
  startAnimation() {
    this._animationCallback();
  }

  _restartAnimation = () => {
    if (this.frame) window.cancelAnimationFrame(this.frame);
    this._animationCallback();
  };

  _animationCallback = (timestamp, xrFrame) => {
    if (this.isActive) {
      // Update the objects in the scene that we will be rendering
      const delta = this.clock.getDelta();
      this.animate(delta);
      // Update the user position if keyboard and mouse controls are enabled.
      if (controls && controls.enabled) {
        updatePosition();
      }

      if (!XR.session) {
        this.renderer.context.viewport(0, 0, canvas.width, canvas.height);
        this.renderer.autoClear = true;
        this.scene.matrixAutoUpdate = true;
        this.renderer.render(this.scene, this.camera);
        this.frame = requestAnimationFrame(this._animationCallback);
        return this.frame;
      }
      if (!xrFrame) {
        this.frame = XR.session.requestAnimationFrame(this._animationCallback);
        return this.frame;
      }

      // Get the correct reference space for the session.
      const xrRefSpace = XR.session.mode === 'immersive-vr'
        ? XR.immersiveRefSpace
        : XR.nonImmersiveRefSpace;

      const pose = xrFrame.getViewerPose(xrRefSpace);

      if (pose) {
        this.scene.matrixAutoUpdate = false;
        this.renderer.autoClear = false;
        this.renderer.clear();

        this.renderer.setSize(
          XR.session.renderState.baseLayer.framebufferWidth,
          XR.session.renderState.baseLayer.framebufferHeight,
          false
        );

        this.renderer.context.bindFramebuffer(
          this.renderer.context.FRAMEBUFFER,
          XR.session.renderState.baseLayer.framebuffer
        );

        for (let i = 0; i < pose.views.length; i++) {
          const view = pose.views[i];
          const viewport = XR.session.renderState.baseLayer.getViewport(view);
          const viewMatrix = new Matrix4().fromArray(view.viewMatrix);

          this.renderer.context.viewport(
            viewport.x,
            viewport.y,
            viewport.width,
            viewport.height
          );

          // Update user position if touch controls are in use with magic window.
          if (XR.magicWindowCanvas && XR.magicWindowCanvas.hidden === false) {
            updateTouchPosition(viewMatrix);
            this._translateViewMatrix(viewMatrix, userPosition);
          } else {
            this._translateViewMatrix(viewMatrix, new Vector3(0, 0, 0));
          }

          this.camera.matrixWorldInverse.copy(viewMatrix);
          this.camera.projectionMatrix.fromArray(view.projectionMatrix);
          this.scene.matrix.copy(viewMatrix);

          this.scene.updateMatrixWorld(true);
          this.renderer.render(this.scene, this.camera);
          this.renderer.clearDepth();
        }
        this.frame = XR.session.requestAnimationFrame(this._animationCallback);
        return this.frame;
      }
    }
    this.frame = null;
    return this.frame;
  };

  _checkForKeyboardMouse() {
    if (keyboard) {
      this.scene.add(controls.getObject());
    }
  }

  _translateViewMatrix(viewMatrix, position) {
    // Save initial position for later
    const tempPosition = new Vector3(position.x, position.y, position.z);
    const tempViewMatrix = new Matrix4().copy(viewMatrix);

    tempViewMatrix.setPosition(new Vector3());
    tempPosition.applyMatrix4(tempViewMatrix);

    const translationInView = new Matrix4();
    translationInView.makeTranslation(
      tempPosition.x,
      tempPosition.y,
      tempPosition.z
    );

    viewMatrix.premultiply(translationInView);
  }

  /**
   * Override this function with the interaction you want for the objects in your scene.
   */
  objectInteraction(object) {
    return object
  }

  /**
   * The funcion that gets called when the mousedown event is fired. This is where the interaction
   * for objects will be called if the object is in the interactive group.
   */
  onClick = (event) => {
    if (touchscreen.enabled) {
      let touch = new THREE.Vector3();
      touch.x = (event.clientX / window.innerWidth) * 2 - 1;
      touch.y = - (event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(touch, this.camera);
    }

    this.updateRay();

    let intersects = this.raycaster.intersectObject(this.interactive, true);
    if (intersects.length > 0) {
      let res = intersects.filter(function(res) {
        return res && res.object;
      })[0];

      if (res && res.object) {
        this.objectInteraction(res.object);
      }
    }
  }

  /**
     * Initializes all event listeners associated with this room
     */
  _initEventListeners() {}

  /**
     *
     * @param {HTMLElement} target
     * @param {String} type
     * @param {Function} listener
     */
  _addEventListener(target, type, listener) {
    target.addEventListener(type, listener);
    this.eventListeners.push({
      target,
      type,
      listener
    });
  }

  /**
     * Removes all event listeners associated with this room
     */
  removeEventListeners() {
    for (let i = 0; i < this.eventListeners.length; i++) {
      const eventListener = this.eventListeners[i];
      eventListener.target.removeEventListener(
        eventListener.type,
        eventListener.listener
      );
    }
  }
}
