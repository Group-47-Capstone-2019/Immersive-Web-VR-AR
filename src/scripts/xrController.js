import {
  Matrix4,
  Vector3,
  Quaternion
} from 'three';
import { canvas } from './renderer/canvas';
import { cameraSettings } from './renderer/camera';
import { renderer } from './renderer';
import { addMouseKeyboardEventListeners } from './controls/keyboard-controls';
import { showTouchControls } from './controls/touch-controls';
import { getCurrentScene } from './currentScene';

/**
 * XR fields we are using
 * Explained here : { https://github.com/immersive-web/webxr-reference/tree/master/webxr-device-api }
 * and here {https://immersive-web.github.io/webxr-reference/}
 */

export const XR = {
  session: null,
  immersiveRefSpace: null,
  nonImmersiveRefSpace: null,
  magicWindowCanvas: null,
  mirrorCanvas: null
};

export function applyOriginOffset(matrix) {
  const refSpace = (XR.session.mode === 'immersive-vr')
    ? XR.immersiveRefSpace
    : XR.nonImmersiveRefSpace;

  const originOffset = new Matrix4();
  originOffset.fromArray(refSpace.originOffset.matrix, 0);
  const currentPosition = new Vector3();
  const currentRotation = new Quaternion();
  originOffset.decompose(currentPosition, currentRotation, new Vector3());


  const matrixWithoutTranslation = new Matrix4();
  matrixWithoutTranslation.copy(matrix);
  // The reason we do this here is because the view matrix may have
  // a position set, for example in a 6DoF system or on a 3 DoF
  // system where the height is emulated. What we want to do here is
  // to apply the view matrix on our user position.
  matrixWithoutTranslation.setPosition(new Vector3());
  // The result below gives us the position after the rotation of the
  // view has been applied. This will make the direction right.
  currentPosition.applyMatrix4(matrixWithoutTranslation);
  const translationInMatrix = new Matrix4();
  // Let's build a translation matrix out of rotated position. We don't need to
  // care about the rotation because we're going to apply that translation
  // on the view matrix (which is rotated and translated).
  translationInMatrix.makeTranslation(currentPosition.x, currentPosition.y, currentPosition.z);
  const rotationInMatrix = new Matrix4();
  rotationInMatrix.makeRotationFromQuaternion(currentRotation);
  // pre-multiply because we want to translate before rotating. Otherwise we
  // may end up with a wrong position.
  matrix.premultiply(translationInMatrix);
  matrix.premultiply(rotationInMatrix);
}

/*
* Creates a button that renders each eye for VR
*/
function createVRButton() {
  const vrButton = document.createElement('button');
  vrButton.classList.add('vr-toggle');
  vrButton.id = 'vr-toggle';
  vrButton.textContent = 'Enter VR';
  vrButton.addEventListener('click', () => {
    if (XR.session) {
      XR.session.end();
    }
    xrOnRequestSession();
  });
  document.body.appendChild(vrButton);
}

function xrOnSessionEnded(event) {
  XR.session = null;

  if (event.session.renderState.outputContext) {
    document.body.removeChild(event.session.renderState.outputContext.canvas);
  }

  // Reset xrState when session ends and remove the mirror canvas
  if (event.session.mode === 'immersive-vr') {
    // TODO: Need to change this to xrValidate() to handle cases where device cannot support
    // magic window on exit of immersive session
    xrValidateMagicWindow();
  }
}

async function xrOnSessionStarted(context) {
  XR.session.addEventListener('end', xrOnSessionEnded);

  // Set rendering canvas to be XR compatible and add a baselayer
  try {
    await renderer.context.makeXRCompatible();
  } catch (err) {
    console.error(`Error making rendering context XR compatible : ${err}`);
  }

  // Set near and far settings for session camera
  XR.session.depthNear = cameraSettings.near;
  XR.session.depthFar = cameraSettings.far;

  /* global XRWebGLLayer:true */
  XR.session.updateRenderState({
    baseLayer: new XRWebGLLayer(XR.session, renderer.context),
    outputContext: context
  });

  // With immersive and non immersive sessions we will be keeping track of
  // two reference spaces so we will hold two.
  try {
    const xrRefSpace = await XR.session.requestReferenceSpace({
      type: 'stationary',
      subtype: 'eye-level'
    });
    // Check if the session is immersive or non immersive and set the
    // respective refSpace.
    if (XR.session.mode === 'immersive-vr') {
      XR.immersiveRefSpace = xrRefSpace;
      if (XR.nonImmersiveRefSpace) {
        XR.immersiveRefSpace.originOffset = XR.nonImmersiveRefSpace.originOffset;
      }
      XR.nonImmersiveRefSpace = null;
    } else {
      XR.nonImmersiveRefSpace = xrRefSpace;
      if (XR.immersiveRefSpace) {
        XR.nonImmersiveRefSpace.originOffset = XR.immersiveRefSpace.originOffset;
      }
      XR.immersiveRefSpace = null;
    }

    // Fire a restart xr animation event
    const experiment = getCurrentScene();
    XR.session.requestAnimationFrame(experiment._animationCallback);
  } catch (err) {
    console.error(`Error requesting reference space : ${err}`);
  }
}

/**
 * Gets an immersive two eye view xr session when the 'ENTER XR' button has been pressed
 */
async function xrOnRequestSession() {
  // Create a mirror canvas for rendering the second eye
  const xrMirrorCanvas = document.createElement('canvas');
  const xrMirrorContext = xrMirrorCanvas.getContext('xrpresent');
  xrMirrorCanvas.setAttribute('id', 'mirror-canvas');

  // Add the mirror canvas to our XR object and the document.
  XR.mirrorCanvas = xrMirrorCanvas;

  // Attempt to create an XR session using the mirror canvas and the connected device
  try {
    XR.session = await navigator.xr.requestSession({ mode: 'immersive-vr' });
    document.body.appendChild(xrMirrorCanvas);
    xrOnSessionStarted(xrMirrorContext);
  } catch (err) {
    xrValidateMagicWindow();
    console.error(`Error initializing XR session : ${err}`);
  }
}

/**
 * Checks for magic window compatibility
 */
async function xrValidateMagicWindow() {
  XR.magicWindowCanvas = document.createElement('canvas');
  XR.magicWindowCanvas.setAttribute('id', 'vr-port');
  XR.magicWindowCanvas.setAttribute('name', 'magic-window');

  XR.magicWindowCanvas.width = window.innerWidth;
  XR.magicWindowCanvas.height = window.innerHeight;

  // Set canvas rendering context to xrpresent
  const xrMagicWindowContext = XR.magicWindowCanvas.getContext('xrpresent');

  try {
    XR.session = await navigator.xr.requestSession();
    canvas.style.display = 'none';
    canvas.parentNode.insertBefore(XR.magicWindowCanvas, canvas);
    xrOnSessionStarted(xrMagicWindowContext);
  } catch (reason) {
    console.log(`Device unable to support magic window session : ${reason}`);
  }
}

/*
 * Waits for an XR device to connect to the session and validates its capabilities
 */
async function xrValidate() {
  // TODO: Create new VRButton object here

  // Check that the browser has XR enabled
  if (navigator.xr) {
    // Listens for when a device changes and calls this function once again
    // to validate the new device / setup XR sessions
    navigator.xr.addEventListener('device-change', xrValidate);

    // Check if device is capable of an immersive-vr sessions
    try {
      await navigator.xr.supportsSessionMode('immersive-vr');
      createVRButton();
    } catch (reason) {
      console.log(`Device unable to support immersive-vr session : ${reason || ''}`);
    }

    // Check to see if an non-immersive xr session is supported
    try {
      await navigator.xr.supportsSessionMode('inline');
      showTouchControls();
      xrValidateMagicWindow();
    } catch (reason) {
      console.log(`Device unable to support inline session : ${reason || ''}`);
      console.log('Instead, enable keyboard/mouse.');
      addMouseKeyboardEventListeners();
    }
  } else {
    addMouseKeyboardEventListeners();
  }
}

xrValidate();
