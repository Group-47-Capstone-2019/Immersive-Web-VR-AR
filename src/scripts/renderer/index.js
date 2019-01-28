import { WebGLRenderer } from 'three';
import { initialWidth, initialHeight, canvas } from './canvas';
import { updateAspectRatio } from './camera';

export const renderer = new WebGLRenderer({ canvas: canvas });
renderer.setSize(initialWidth, initialHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// update renderer and camera size to match new canvas element size
const onResize = () => {
  const { innerWidth, innerHeight } = window;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  renderer.setSize(innerWidth, innerHeight);
  updateAspectRatio(innerWidth / innerHeight);
};

// call it every time the window is resized
window.addEventListener('resize', onResize);
