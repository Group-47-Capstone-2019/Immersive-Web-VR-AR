import { PerspectiveCamera } from 'three';
import { initialAspect } from './canvas';

const cameraSettings = {
  viewAngle: 90,
  near: 0.1,
  far: 1000
};

export const camera = new PerspectiveCamera(
  cameraSettings.viewAngle,
  initialAspect,
  cameraSettings.near,
  cameraSettings.far
);
updateAspectRatio(window.innerWidth, window.innerHeight);

/**
 * updates the camera aspect ratio. to be called when window is
 * resized
 * @param {Number} width
 * @param {Number} height
 */
export function updateAspectRatio (width, height) {
  const ratio = width / height;
  const PixelsPerDegree = 10;
  const fov = height / PixelsPerDegree;
  camera.aspect = ratio;
  camera.fov = fov;
  camera.updateProjectionMatrix();
};

export function getAspectRatio() {
  return camera.aspect;
}
