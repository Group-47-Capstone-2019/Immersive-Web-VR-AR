/* eslint-disable no-undef */
/* eslint-disable eol-last */
import 'datguivr';

export default function createGUI(scene, camera, object, world, renderer) {
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
  const gui = dat.GUIVR.create('Settings');
  gui.position.set(3, 1, -13);

  // Set the size of the gui.
  gui.scale.set(2, 2, 2);

  // Create sliders for gravity and object position.
  gui.add(world.gravity, 'y', -9.8, 9.8).step(0.2)
    .name('Gravity')
    .listen();

  gui.add(object.position, 'x').min(-1)
    .max(1)
    .step(0.25)
    .name('Position X')
    .listen();

  gui.add(object.position, 'y').min(-1)
    .max(1)
    .step(0.25)
    .name('Position Y')
    .listen();

  // Toggle for specific object material as wireframe.
  gui.add(object.material, 'wireframe')
    .name('Wireframe')
    .listen();

  const state = {
    reset() {
      world.gravity.set(0, 0, 0);
    }
  };

  const newFolder = dat.GUIVR.create('Reset');
  newFolder.add(state, 'reset')
    .name('Turn Off Gravity');

  gui.addFolder(newFolder);
  scene.add(gui);
}