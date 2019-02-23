import { PerspectiveCamera } from 'three';
import { initialAspect } from './canvas';

export const cameraSettings = {
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

/**
 * updates the camera aspect ratio. to be called when window is
 * resized
 * @param {number} ratio
 */
export const updateAspectRatio = (ratio) => {
  camera.aspect = ratio;
  camera.updateProjectionMatrix();
};
