import {
  Raycaster,
  Color,
  Vector3, Matrix4, Quaternion,
  BoxGeometry, MeshBasicMaterial, Mesh,
  Line, LineBasicMaterial,
  Geometry
} from 'three';
import { getCurrentScene } from './currentScene';
import { XR } from './xrController';
import { userPosition } from './controls/touch-controls';

function translateObjectMatrix(matrix) {
 const currentPosition = new Vector3(
   userPosition.x,
   userPosition.y,
   userPosition.z
 );

 // Get matrix components and set position
 const matrixPosition = new Vector3();
 matrix.decompose(matrixPosition, new Quaternion(), new Vector3());
 currentPosition.add(matrixPosition);
 matrix.setPosition(currentPosition);
}

// TODO: Split the interactions interface into multiple interfaces:
/*
Interactions.jsm:
export const Draggable = new Symbol('Interactions - Draggable: This object has drag_start, drag, and drag_end implemented')
export const DraggableDefaults = {
  drag_start(...) { ... },
  drag(...) { ... },
  drag_end(...) { ... }
}
Usage:
import { Draggable, DraggableDefaults } from 'interactions.jsm';

Option 1 -
class PendulumBaseMesh extends mesh {
  constructor() { ... }
  get [Draggable] () { return this; } // Declare that this object implements Draggable
  drag() {
    // Do special majic
  }
  drag_start(...parameters) { return DraggableDefaults.drag_start(...parameters)}
  drag_end(...parameters) { return DraggableDefaults.drag_end(...parameters)}
}

Option 2 -
const obj = scene.getObjectByName('<Some name>');
obj[Draggable] = {
  drag() {
    // Do special majic
  }
  drag_start(...parameters) { return DraggableDefaults.drag_start(...parameters)}
  drag_end(...parameters) { return DraggableDefaults.drag_end(...parameters)}
};
*/

// Put Interaction Callbacks under a special symbol
// so that we don't get confused with things on the three Object
export const Interactions = Symbol('Symbol Interactions');
let inputSources = [];

const handleInputSourcesChange = (e) => {
  console.log('Input Sources Changed.', e);
};

function createRay(inputSource, xrFrame) {
  const xrRefSpace = (XR.session.mode === 'immersive-vr')
    ? XR.immersiveRefSpace
    : XR.nonImmersiveRefSpace;

  if (inputSource.targetRaySpace) {
    const rayPose = xrFrame.getPose(inputSource.targetRaySpace, xrRefSpace);

    if (rayPose) {
      /* global XRRay:true */
      const ray = new XRRay(rayPose.transform);

      if (pose.targetRay) {
        return new XRRay(pose.transform);
      }
    }
  }
  return null;
}

function handlerCommon(func) {
  return function({frame, inputSource}) {
    const ray = createRay(inputSource, frame);
    if (ray) {
      for (const intersection of raycast(ray)) {
        func(intersection);
        break;
      }
    }
  }
}
// Each input source can only be dragging one thing at a time, so:
// dragAndDrop is a map from inputSource -> {offset}
const dragAndDrop = new Map();
const handleSelectStart = handlerCommon((intersection) => {
  const interactions = intersection.object[Interactions];
  if (interactions) {
    if (interactions.drag_start || interactions.drag_end || interactions.drag) {
      // TODO: Apply rotation
      const pointerInverse = new Matrix4().getInverse(pointerMatrix, true);
      const transformMatrix = new Matrix4().multiplyMatrices(pointerInverse, intersection.object.matrixWorld);
      const data = {
        object: intersection.object,
        transformMatrix,
        matrixAutoUpdate: intersection.object.matrixAutoUpdate
      };
      intersection.object.matrixAutoUpdate = false;
      dragAndDrop.set(inputSource, data);
    } else if (interactions.select_start) {
      interactions.select_start(0, intersection);
    }
  }
});
const handleSelectEnd = handlerCommon((intersection) => {
  const interactions = intersection.object[Interactions];
  if (interactions) {
    // Handle the end of dragging
    const data = dragAndDrop.get(inputSource);
    if (data) {
      const dragend = data.object[Interactions].drag_end;
      if (dragend) {
        dragend();
      }
      data.object.matrixAutoUpdate = data.matrixAutoUpdate;
      dragAndDrop.delete(inputSource);
    }
    // Handle the end of selection
    if (interactions.select_end) {
      interactions.select_end(0, intersection);
    }
  }
});
const handleSelect = handlerCommon((intersection) => {
  const interactions = intersection.object[Interactions];
  if (interactions) {
    if (interactions.select) {
      interactions.select(0, intersection);
    }
  }
});

export function setupInteractions() {
  inputSources = XR.session.getInputSources();
  console.log(inputSources);
  XR.session.addEventListener('inputsourceschange', handleInputSourcesChange);

  XR.session.addEventListener('select', handleSelect);
  XR.session.addEventListener('selectstart', handleSelectStart);
  XR.session.addEventListener('selectend', handleSelectEnd);
}

const raycaster = new Raycaster();
function raycast(xrRay) {
  const { scene } = getCurrentScene();

  const trMatrix = new Matrix4().fromArray(xrRay.matrix);
  translateObjectMatrix(trMatrix);

  // Transformed ray matrix from the current scene matrix world
  const scene = getCurrentScene().scene;
  const rMatrix = new Matrix4().multiplyMatrices(scene.matrixWorld, trMatrix);

  raycaster.set(
    new Vector3().setFromMatrixPosition(rMatrix),
    new Vector3(0, 0, -1).transformDirection(rMatrix).normalize()
  );
  return raycaster.intersectObjects(scene.children, true);
}

export function handleInteractions(timestamp, frame) {
  if (frame) {
    for (const inputSource of inputSources) {
      const ray = createRay(inputSource, frame);
      // Handle Drag and Drop
      if (dragAndDrop.has(inputSource)) {
        const { object, transformMatrix } = dragAndDrop.get(inputSource);
        const newMatrix = new Matrix4().multiplyMatrices(new Matrix4().fromArray(ray.matrix), transformMatrix);
        if (object[Interactions].drag) {
          object[Interactions].drag(newMatrix);
        } else {
          object.matrix = newMatrix;
          object.updateMatrixWorld(true);
        }
      }

      for (const intersection of raycast(ray)) {
        if (intersection.object[Interactions] && intersection.object[Interactions].hover) {
          intersection.object[Interactions].hover(intersection);
        }
        break; // MAYBE: Handle more than the closest object?
      }
    }
  }
}


export function closeInteractions() {
  XR.session.removeEventListener('inputsourceschange', handleInputSourcesChange);

  XR.session.removeEventListener('select', handleSelect);
  XR.session.removeEventListener('selectstart', handleSelectStart);
  XR.session.removeEventListener('selectend', handleSelectEnd);
}
