import {canvas} from './renderer/canvas';
import {camera, cameraSettings} from './renderer/camera';
import {renderer} from './renderer';

import WebXRPolyfill from 'webxr-polyfill';


export const polyfill = new WebXRPolyfill();

/**
 * XR fields we are using
 * Explained here : { https://github.com/immersive-web/webxr-reference/tree/master/webxr-device-api }
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
function xrValidate()
{
    //Check that the browser has XR enabled
    if(navigator.xr)
    {
        //Listens for when a device changes and calls this function once again to validate the new device / setup XR sessions
        navigator.xr.addEventListener('device-change', xrValidate);
        // See if a device is available.
        navigator.xr.requestDevice().then(device => {
            //Does this device have immersive XR capability?
            device.supportsSession({immersive : true}).then(() => {
                xrInit(device);
            }).catch(function() {
                console.error("Not an XR device!");
            });
        }).catch(function() {
            console.error("XR Device not found!\nListening for devices . . .");
        });
    }
}

/*
 * Obtains information about the connected XR device
 */
function xrInit(device)
{
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
function xrValidateMagicWindow() 
{
    xrMagicWindowCanvas = document.createElement('canvas');
    xrMagicWindowCanvas.setAttribute('id', 'vr-port');
    xrMagicWindowCanvas.setAttribute('name', 'magic-window');

    //Set canvas rendering context to xrpresent
    let xrMagicWindowContext = xrMagicWindowCanvas.getContext('xrpresent');

    //Checks if the given context can support magic window sessions
    xrDevice.supportsSession({outputContext : xrMagicWindowContext}).then(() => {
        console.log("Device supports Magic Window session.");
        xrEnableMagicWindow(xrMagicWindowContext);

        canvas.parentNode.replaceChild(xrMagicWindowCanvas, canvas);
    }).catch((err) => {
        console.error("Magic Window : Not supported : " + err);
    });
}

async function xrEnableMagicWindow(context) 
{
    try {
        //Get an XR session with the given context
        xrSession = await xrDevice.requestSession({outputContext : context});

        //Set near and far settings for session camera
        xrSession.depthNear = cameraSettings.near;
        xrSession.depthFar = cameraSettings.far;

        //Get frame of reference at eye level
        xrFrameOfRef = await xrSession.requestFrameOfReference("eye-level");

        renderer.vr.setDevice(xrDevice);

        xrSession.baseLayer = new XRWebGLLayer(xrSession, renderer.context);

        xrSession.requestAnimationFrame(xrUpdate); //Gets a view

    } catch (err) {
        console.error("Magic Window : Error initializing : " + err);
    };
}

function xrUpdate(time, frame) {
    console.log(frame);
}

//Not sure how to use these yet

// /*
//  * Called when XR session begins
//  * Gives the threejs renderer a reference to the xr session
//  */
// function xrOnSessionStart(session)
// {
//     console.log("Session obtained!");
//     console.log(session);

//     session.addEventListener('end', xrOnSessionEnd);

//     //renderer.vr.setSession(session);
//     xrSession = session;
// }

// /*
//  * Clears the session field and event listener
//  */
// function xrOnSessionEnd()
// {
//     xrSession.removeEventListener('end', xrOnSessionEnd);

//     renderer.vr.setSession(null)

//     xrSession = null;
// }


xrValidate();