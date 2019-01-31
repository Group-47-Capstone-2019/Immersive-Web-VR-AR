import {canvas} from './renderer/canvas';
import {camera} from './renderer/camera';
import {renderer} from './renderer';

import WebXRPolyfill from 'webxr-polyfill';


export const polyfill = new WebXRPolyfill();

//XR fields
export let
    xrDevice,
    xrSession,
    xrFrameOfRef,
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
    console.log(device);

    //TODO: @author TimForsyth put the reference to your VR button setup here

    xrValidateMagicWindow(device);

    //Give the threejs rendering context access to the xr device
    //renderer.vr.setDevice(device);
}

/**
 * Checks for magic window compatibility
 */
function xrValidateMagicWindow(device) 
{
    xrMagicWindowCanvas = document.createElement('canvas');
    xrMagicWindowCanvas.setAttribute('id', 'vr-port');

    //Set canvas rendering context to xrpresent
    let xrMagicWindowContext = xrMagicWindowCanvas.getContext('xrpresent');

    device.supportsSession({outputContext : xrMagicWindowContext}).then(() => {
        console.log("Supports magic window session.");
    }).catch((err) => {
        console.error("Magic Window : Not supported : " + err);
    });
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