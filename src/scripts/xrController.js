import { canvas } from './renderer/canvas';
import { cameraSettings } from './renderer/camera';
import { renderer } from './renderer';

/**
 * XR fields we are using
 * Explained here : { https://github.com/immersive-web/webxr-reference/tree/master/webxr-device-api } and here {https://immersive-web.github.io/webxr-reference/}
 */
export let
    xrDevice,               //Represents a single hardware device and provides methods for obtaining an XRSession object (For interfacing with the device).
    xrSession,              //Provides the means to interact with an XR Device.
    xrRefSpace,           //Provides information about the spatial point from which AR/VR measurements are made. 
    xrMagicWindowCanvas
    ;

/*
 * Waits for an XR device to connect to the session and validates its capabilities
 */
async function xrValidate() {
    //Check that the browser has XR enabled
    if (navigator.xr) {
        //Listens for when a device changes and calls this function once again to validate the new device / setup XR sessions
        navigator.xr.addEventListener('device-change', xrValidate);
        
        //Check if device is capable of an immersive-vr sessions
        try {
            await navigator.xr.supportsSessionMode('immersive-vr');
            //TODO: @author TimForsyth add the VR button creation here
        } catch (reason) {
            console.log("Device unable to support immersive-vr session : " + (reason ? reason : ""));
        }

        //Check to see if an non-immersive xr session is supported
        xrValidateMagicWindow();
    }
}

/**
 * Checks for magic window compatibility
 */
async function xrValidateMagicWindow() {
    xrMagicWindowCanvas = document.createElement('canvas');
    xrMagicWindowCanvas.setAttribute('id', 'vr-port');
    xrMagicWindowCanvas.setAttribute('name', 'magic-window');
    xrMagicWindowCanvas.width = window.innerWidth;
    xrMagicWindowCanvas.height = window.innerHeight;

    //Set canvas rendering context to xrpresent
    let xrMagicWindowContext = xrMagicWindowCanvas.getContext('xrpresent');

    try {
        xrSession = await navigator.xr.requestSession({outputContext : xrMagicWindowContext});
        canvas.parentNode.replaceChild(xrMagicWindowCanvas, canvas);
        xrOnSessionStarted();
    } catch (err) {
        console.error("Error initializing XR session : " + err);
    }
}

async function xrOnSessionStarted() {
    xrSession.addEventListener('end', xrOnSessionEnded);

    //Set rendering canvas to be XR compatible and add a baselayer
    try {
        await renderer.context.makeXRCompatible();
        xrSession.baseLayer = new XRWebGLLayer(xrSession, renderer.context);
    } catch (err) {
        console.error("Error creating XR BaseLayer : " + err);
    }

    //Set near and far settings for session camera
    xrSession.depthNear = cameraSettings.near;
    xrSession.depthFar = cameraSettings.far;

    try {
        xrRefSpace = await xrSession.requestReferenceSpace({
            type : 'stationary',
            subtype : 'eye-level'
        });
    } catch (err) {
        console.error("Error requesting reference space : " + err);
    }
}

function xrOnSessionEnded(event) {
    //Reset xrState when session ends
    if(event.session.immersive) {
        //TODO: Remove mirror canvas here
        xrSession = null;
    }
}

xrValidate();