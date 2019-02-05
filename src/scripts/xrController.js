import * as THREE from 'three';
import { currentScene } from './router';
import { canvas } from './renderer/canvas';
import { camera, cameraSettings } from './renderer/camera';
import { renderer } from './renderer';

import WebXRPolyfill from 'webxr-polyfill';

new WebXRPolyfill();

/**
 * XR fields we are using
 * Explained here : { https://github.com/immersive-web/webxr-reference/tree/master/webxr-device-api } and here {https://immersive-web.github.io/webxr-reference/}
 */
export let
    xrDevice,               //Represents a single hardware device and provides methods for obtaining an XRSession object (For interfacing with the device).
    xrSession,              //Provides the means to interact with an XR Device.
    xrFrameOfRef,           //Provides information about the spatial point from which AR/VR measurements are made. 
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
        
        try {
            // See if a device is available.
            let device = await navigator.xr.requestDevice();
            //Does this device have immersive XR capability?
            await device.supportsSession({ immersive: true });
            xrInit(device);
        } catch {
            console.error("XR Device not found!\nListening for devices . . .");
        }
    }
}

/**
 * XR device has been found so begin setting up XR environment
 * @param {XRDevice} device 
 */
function xrInit(device) {
    console.log("Compatible XR device found!");

    xrDevice = device;

    //TODO: @author TimForsyth put the reference to your VR button setup here

    xrValidateMagicWindow(device);

    //Give the threejs rendering context access to the xr device
    //renderer.vr.setDevice(device);
}

/**
 * Checks for magic window compatibility
 */
async function xrValidateMagicWindow() {
    xrMagicWindowCanvas = document.createElement('canvas');
    xrMagicWindowCanvas.setAttribute('id', 'vr-port');
    xrMagicWindowCanvas.setAttribute('name', 'magic-window');

    //Set canvas rendering context to xrpresent
    let xrMagicWindowContext = xrMagicWindowCanvas.getContext('xrpresent');

    //Checks if the given context can support magic window sessions
    try {
        await xrDevice.supportsSession({ outputContext : xrMagicWindowContext });
        console.log("Device supports Magic Window session.");

        //Enable the magic window and replace the current canvas element with the new magic window canvas
        await xrEnableMagicWindow(xrMagicWindowContext);
        canvas.parentNode.replaceChild(xrMagicWindowCanvas, canvas);
    } catch (err) {
        console.error("Magic Window : Not supported : " + err);
    }
}


async function xrEnableMagicWindow(context) {
    try {
        //Get an XR session with the given context
        xrSession = await xrDevice.requestSession({ outputContext: context });

        //Set near and far settings for session camera
        xrSession.depthNear = cameraSettings.near;
        xrSession.depthFar = cameraSettings.far;

        console.log(xrSession);
        console.log(context);
        
        //Get frame of reference at eye level
        xrFrameOfRef = await xrSession.requestFrameOfReference('eye-level');

        //Tell the browser that we want to paint one frame of an animation at which time the browser will call the supplied callback function
        //In other words : Interfacing with the session every frame to gain updated information about the device
        xrSession.requestAnimationFrame(xrUpdate);

    } catch (err) {
        console.error("Magic Window : Error initializing : " + err);
    };
}

xrValidate();