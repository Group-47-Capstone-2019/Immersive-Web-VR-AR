import {canvas} from './renderer/canvas';
import {camera} from './renderer/camera';
import {renderer} from './renderer';

import WebXRPolyfill from 'webxr-polyfill';


export const polyfill = new WebXRPolyfill();

//XR fields
let
    xrDevice,
    xrSession,
    xrFrameOfRef
;

/*
 * Waits for an XR device to connect to the session and validates its capabilities
 */
function xrValidate()
{
    //Check that the browser has XR enabled
    if(navigator.xr)
    {
        // See if a device is available.
        navigator.xr.requestDevice().then(device => {
            device.supportsSession({immersive : true}).then(() => {
                xrInit(device);
            }).catch(function() {
                console.error("XR Device not compatible!");
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
    console.log(device);

    //TODO: Set up an XR session

    console.log(renderer.vr);

    //Give the threejs rendering context access to the xr device
    //renderer.vr.setDevice(device);
    xrDevice = device;
}

/*
 * Called when XR session begins
 * Gives the threejs renderer a reference to the xr session
 */
function xrOnSessionStart(session)
{
    console.log("Session obtained!");
    console.log(session);

    session.addEventListener('end', xrOnSessionEnd);

    renderer.vr.setSession(session);
    xrSession = session;
}

/*
 * Clears the session field and event listener
 */
function xrOnSessionEnd()
{
    xrSession.removeEventListener('end', xrOnSessionEnd);

    renderer.vr.setSession(null)

    xrSession = null;
}

xrValidate();