/* eslint-disable no-undef */
/* eslint-disable eol-last */
import 'datguivr';

/*
 * Create a Basic Gui Menu with Settings gui tab.
 */
export default function createGUI(scene, camera, renderer) {
  // Allow mouse input for non-VR app and testing without a VR device.
  dat.GUIVR.enableMouse(camera, renderer);

  // Gaze Input is use for on VR devices without controllers.
  const gazeInput = dat.GUIVR.addInputObject(camera);
  scene.add(gazeInput.cursor);

  // Bind mouse or touch on the GUI to a press.
  ['mousedown', 'touchstart']
    .forEach((e) => {
      window.addEventListener(e, () => {
        gazeInput.pressed(true);
      }, false);
    });

  ['mouseup', 'touchend']
    .forEach((e) => {
      window.addEventListener(e, () => {
        gazeInput.pressed(false);
      }, false);
    });

  // Create name settings to show at the top of the gui tab.
  const gui = dat.GUIVR.create('Global Settings');

  // Set the size of the gui.
  gui.scale.set(2, 2, 2);

  scene.add(gui);
  return gui;
}