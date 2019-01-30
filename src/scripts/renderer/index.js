import { WebGLRenderer } from 'three';
import { initialWidth, initialHeight, canvas } from './canvas';
import { updateAspectRatio, getAspectRatio } from './camera';

export const renderer = new WebGLRenderer({ canvas: canvas });
renderer.setSize(initialWidth, initialHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// update renderer and camera size to match new canvas element size
const onResize = () => {
  // Since Chrome issues a resize when the url bar leaves, we should gate this on only running if the phone changes from portrate to landscape or back.
  const { innerWidth, innerHeight } = window;
  const newAspect = innerWidth / innerHeight;
  const oldAspect = getAspectRatio();
  if ((newAspect > 1 && oldAspect < 1) || (newAspect < 1 && oldAspect > 1)) {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    renderer.setSize(innerWidth, innerHeight);
    updateAspectRatio(newAspect);
  }
};

// call it every time the window is resized
window.addEventListener('resize', onResize);
