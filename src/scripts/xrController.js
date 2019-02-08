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
  refSpace: null,
  magicWindowCanvas: null
};

/*
// Provides the means to interact with an XR Device.
export let xrSession;

// Provides information about the spatial point from which AR/VR measurements are made.
export let xrRefSpace;

// Canvas that the webglrenderer pipes into for xr visualization
export let xrMagicWindowCanvas;
*/

function xrOnSessionEnded(event) {
  // Reset xrState when session ends
  if (event.session.immersive) {
    // TODO: Remove mirror canvas here
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

  try {
    XR.refSpace = await XR.session.requestReferenceSpace({
      type: 'stationary',
      subtype: 'eye-level'
    });
  } catch (err) {
    console.error(`Error requesting reference space : ${err}`);
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
  // Check that the browser has XR enabled
  if (navigator.xr) {
    // Listens for when a device changes and calls this function once again
    // to validate the new device / setup XR sessions
    navigator.xr.addEventListener('device-change', xrValidate);

    // Check if device is capable of an immersive-vr sessions
    try {
      await navigator.xr.supportsSessionMode('immersive-vr');
      // TODO: @author TimForsyth add the VR button creation here
    } catch (reason) {
      console.log(`Device unable to support immersive-vr session : ${reason || ''}`);
    }

    // Check to see if an non-immersive xr session is supported
    xrValidateMagicWindow();
  }
}

xrValidate();
