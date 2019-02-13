import { canvas } from './renderer/canvas';
import { cameraSettings } from './renderer/camera';
import { renderer } from './renderer';

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

function xrOnSessionEnded(event) {
  // Reset xrState when session ends and remove the mirror canvas
  if (event.session.immersive) {
    document.body.removeChild(document.querySelector('#mirror-canvas'));
    XR.session = null;
  }
}

async function xrOnSessionStarted() {
  XR.session.addEventListener('end', xrOnSessionEnded);

  // Set rendering canvas to be XR compatible and add a baselayer
  try {
    await renderer.context.makeXRCompatible();
    /* global XRWebGLLayer:true */
    XR.session.baseLayer = new XRWebGLLayer(XR.session, renderer.context);
  } catch (err) {
    console.error(`Error creating XR BaseLayer : ${err}`);
  }

  // Set near and far settings for session camera
  XR.session.depthNear = cameraSettings.near;
  XR.session.depthFar = cameraSettings.far;

  // With immersive and non immersive sessions we will be keeping track of
  // two reference spaces so we will hold two.
  try {
    const xrRefSpace = await XR.session.requestReferenceSpace({
      type: 'stationary',
      subtype: 'eye-level'
    });

    // Check if the session is immersive or non immersive and set the
    // respective refSpace.
    if (XR.session.immersive) {
      XR.immersiveRefSpace = xrRefSpace;
    } else {
      XR.nonImmersiveRefSpace = xrRefSpace;
    }
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
  document.body.appendChild(xrMirrorCanvas);

  // Attempt to create an XR session using the mirror canvas and the connected device
  try {
    alert("Session requested");
    XR.session = await navigator.xr.requestSession({ mode: 'immersive-vr', outputContext: xrMirrorContext });
    xrOnSessionStarted();
  } catch (err) {
    alert("Error requesting session");
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
    XR.session = await navigator.xr.requestSession({ outputContext: xrMagicWindowContext });
    canvas.parentNode.replaceChild(XR.magicWindowCanvas, canvas);
    xrOnSessionStarted();
  } catch (err) {
    console.error(`Error initializing XR session : ${err}`);
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
      // TODO: @author TimForsyth add the VR button creation here
      createVRButton();
      // TODO: Enable VR button here since immersive VR is available
    } catch (reason) {
      console.log(`Device unable to support immersive-vr session : ${reason || ''}`);
    }

    // Check to see if an non-immersive xr session is supported
    xrValidateMagicWindow();
  }
}

/*
* Creates a button that renders each eye for VR
*/
function createVRButton() {
  let vrButton = document.createElement('button');
  vrButton.classList.add('vr-toggle');
  vrButton.textContent = 'Enter VR';
  vrButton.addEventListener('click', _ => {
    xrOnRequestSession();
  });
  document.body.appendChild(vrButton);
}

xrValidate();
