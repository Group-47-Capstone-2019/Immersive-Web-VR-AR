import { Vector3, Quaternion, Matrix4 } from 'three';
import { canvas } from './renderer/canvas';
import { renderer } from './renderer';
import { addMouseKeyboardEventListeners } from './controls/keyboard-controls';
import { showTouchControls } from './controls/touch-controls';
import { setupInteractions, closeInteractions } from './interactions';

/**
 * XR fields we are using
 * Explained here : { https://github.com/immersive-web/webxr-reference/tree/master/webxr-device-api }
 * and here {https://immersive-web.github.io/webxr-reference/}
 */

export const XR = {
  session: null,
  refSpace: null,
  magicWindowCanvas: null,
  mirrorCanvas: null,
  getOffsetMatrix() {
    if (this.refSpace) {
      return new Matrix4().fromArray(this.refSpace.originOffset.matrix);
    }
    return new Matrix4();
  },
  setOffsetMatrix(matrix) {
    const position = new Vector3();
    const scale = new Vector3();
    const rotation = new Quaternion();
    matrix.decompose(position, rotation, scale);
    /* global XRRigidTransform */
    this.refSpace.originOffset = new XRRigidTransform(
      new DOMPoint(position.x, position.y, position.z, 1),
      new DOMPoint(rotation.x, rotation.y, rotation.z, rotation.w)
    );
  }
};

/*
* Checks to see if the user is on a mobile device.
*/
function isMobile() {
  var check = false;
  // Comprehensive regex that is used to cover as many mobile devices as possible.
  /* eslint-disable */
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  /* eslint-enable */
  return check;
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
  closeInteractions(event.session);
  if (event.session === XR.session) XR.session = null;

  if (event.session.renderState.outputContext) {
    // Not sure why it wasn't on the body element, but this should remove it no matter where it is.
    event.session.renderState.outputContext.canvas.remove();
  }

  // Reset xrState when session ends and remove the mirror canvas
  if (event.session.mode === 'immersive-vr') {
    // TODO: Need to change this to xrValidate() to handle cases where device cannot support
    // magic window on exit of immersive session
    xrValidateMagicWindow();
  }
}

async function xrOnSessionStarted(context) {
  // I'm seeing xrOnSessionEnded being called twice.  I'm going to see if using once fixes this / causes other problems.
  XR.session.addEventListener('end', xrOnSessionEnded, {
    once: true
  });

  setupInteractions();

  // Set rendering canvas to be XR compatible and add a baselayer
  try {
    await renderer.context.makeXRCompatible();
  } catch (err) {
    console.error(`Error making rendering context XR compatible : ${err}`);
  }

  /* global XRWebGLLayer:true */
  XR.session.updateRenderState({
    baseLayer: new XRWebGLLayer(XR.session, renderer.context),
    outputContext: context
  });

  try {
    // preserve originOffset
    const originOffset = XR.getOffsetMatrix();
    XR.refSpace = await XR.session.requestReferenceSpace({
      type: 'stationary',
      subtype: 'eye-level'
    });
    XR.setOffsetMatrix(originOffset);

    // Fire a restart xr animation event
    window.dispatchEvent(new Event('xrAnimate'));
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
    XR.session = await navigator.xr.requestSession('immersive-vr');
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
    XR.session = await navigator.xr.requestSession('inline');
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
      if (isMobile()) {
        await navigator.xr.supportsSessionMode('inline');
        showTouchControls();
        xrValidateMagicWindow();
      } else {
        addMouseKeyboardEventListeners();
      }
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
