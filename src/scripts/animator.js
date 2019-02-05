import {renderer} from './renderer';
import {camera} from './renderer/camera';
import {xrDevice, xrSession, xrFrameOfRef, xrMagicWindowCanvas} from './xrController';
import { room } from './router';

export function frameRenderer (timestamp, xrFrame) {
    
    // 1: Update the objects in the current scene
    room.update();

    // 2: Check if an XR Session is active
    if(!xrSession) {
        //Standard rendering loop takes place here (No XR computations)
        //TODO: Ensure that renderer's context, scene matrix stuff, canvas, is all reset on a session end event listener call
        renderer.render(room.scene, camera);
        requestAnimationFrame(frameRenderer);
    } else {
        console.debug("XR Session in progress");
    }
}