import {
  Raycaster,
  Color,
  Vector3, Matrix4, Quaternion,
  BoxGeometry, MeshBasicMaterial, Mesh,
  Line, LineBasicMaterial,
  Geometry
} from 'three';
import { getCurrentScene } from './currentScene';
import { XR, applyOriginOffset } from './xrController';

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
let xrSession;
let inputSources = [];

const selectedMaterial = new MeshBasicMaterial({
  color: '#f5b700' // Ha! this is called selective yellow on https://coolors.co/04e762-f5b700-dc0073-008bf8-89fc00
});
let lastObject;
let oldMaterial;

const inputLaser = new Map();
function createLaser(scene, color) {
  const geometry = new Geometry();
  const line = new Line(geometry, new LineBasicMaterial({
    color
  }));
  geometry.vertices.push(new Vector3(0, 0, 0));
  geometry.vertices.push(new Vector3(0, 0, -1));
  geometry.verticesNeedUpdate = true;
  const [from, to] = geometry.vertices;
  line.from = from;
  line.to = to;
  line.raycast = () => null; // Make it so that the laser cannot be intersected with.
  line.matrixAutoUpdate = false;
  scene.add(line);
  return line;
}
const inputBoxes = new Map();
const inputColor = new Map();
const inputCursor = new Map();
function createBox(scene, color, size = 0.2) { // TODO: Rename to create cube
  const box = new Mesh(new BoxGeometry(size, size, size), new MeshBasicMaterial({
    color
  }));
  box.raycast = () => null;
  box.matrixAutoUpdate = false;
  scene.add(box);
  return box;
}

const handleInputSourcesChange = (e) => {
  const { scene } = getCurrentScene();
  inputSources = xrSession.getInputSources();
  for (const inputSource of inputColor.keys()) {
    if (inputSources.indexOf(inputSource) === -1) {
      scene.remove(inputCursor.get(inputSource),
        inputLaser.get(inputSource),
        ...inputBoxes.get(inputSource));
      inputColor.delete(inputSource);
      inputBoxes.delete(inputSource);
      inputCursor.delete(inputSource);
      inputLaser.delete(inputSource);
    } else if (!inputColor.has(inputSource)) {
      // A random color for each input source
      const color = new Color(Math.random(), Math.random(), Math.random());
      inputColor.set(inputSource, color);

      const boxes = steps.map(() => createBox(scene, color, 0.3));
      inputBoxes.set(inputSource, boxes);

      inputLaser.set(inputSource, createLaser(scene, color));

      inputCursor.set(inputSource, createBox(scene, color));
    }
  }
  console.log('Input Sources Changed.', e);
};

// Each input source can only be dragging one thing at a time, so:
// dragAndDrop is a map from inputSource -> {offset}
const dragAndDrop = new Map();
const handleSelectStart = ({ frame, inputSource }) => {
  const pose = frame.getInputPose(inputSource, XR.refSpace);
  if (pose && pose.targetRay) {
    const pointerMatrix = new Matrix4().fromArray(pose.targetRay.matrix);
    applyOriginOffset(pointerMatrix);

    for (const intersection of raycast(pose.targetRay)) {
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
      break;
    }
  }
};
const handleSelectEnd = ({ frame, inputSource }) => {
  const data = dragAndDrop.get(inputSource);
  if (data) {
    const dragend = data.object[Interactions].dragend;
    if (dragend) {
      dragend();
    }
//    data.object.matrixAutoUpdate = data.matrixAutoUpdate;
    dragAndDrop.delete(inputSource);
  } else {
    const pose = frame.getInputPose(inputSource, XR.refSpace);
    if (pose && pose.targetRay) {
      const pointerMatrix = new Matrix4().fromArray(pose.targetRay.matrix);
      applyOriginOffset(pointerMatrix);

      for (const intersection of raycast(pose.targetRay)) {
        const interactions = intersection.object[Interactions];
        if (interactions) {
          if (interactions.select_end) {
            interactions.select_end(0, intersection);
          }
        }
        break;
      }
    }
  }
};
const handleSelect = ({ frame, inputSource }) => {
  const pose = frame.getInputPose(inputSource, XR.refSpace);
  if (pose && pose.targetRay) {
    const pointerMatrix = new Matrix4().fromArray(pose.targetRay.matrix);
    applyOriginOffset(pointerMatrix);

    for (const intersection of raycast(pose.targetRay)) {
      const interactions = intersection.object[Interactions];
      if (interactions) {
        if (interactions.select) {
          interactions.select(0, intersection);
        }
      }
      break;
    }
  }
};

export function setupInteractions(session) {
  xrSession = session;
  inputSources = session.getInputSources();
  console.log(inputSources);
  xrSession.addEventListener('inputsourceschange', handleInputSourcesChange);

  xrSession.addEventListener('select', handleSelect);
  xrSession.addEventListener('selectstart', handleSelectStart);
  xrSession.addEventListener('selectend', handleSelectEnd);
}

const raycaster = new Raycaster();
function raycast(targetRay) {
  const { scene } = getCurrentScene();
  scene.matrix.identity();
  scene.updateMatrixWorld(true);
  const pointerMatrix = new Matrix4().fromArray(targetRay.matrix);
  applyOriginOffset(pointerMatrix);

  // Setup the raycaster:
  const raycasterOrigin = new Vector3();
  const raycasterDestination = new Vector3(0, 0, -1);
  const rayMatrixWorld = new Matrix4().multiplyMatrices(scene.matrixWorld, pointerMatrix);
  raycasterOrigin.setFromMatrixPosition(rayMatrixWorld);
  // raycasterOrigin.setFromMatrixPosition(pointerMatrix);
  raycaster.set(
    raycasterOrigin,
    raycasterDestination.transformDirection(pointerMatrix).normalize()
  );
  return raycaster.intersectObjects(scene.children, true);
}

export function handleInteractions(timestamp, frame) {
  if (frame) {
    for (const inputSource of inputSources) {
      const boxes = inputBoxes.get(inputSource);
      const laser = inputLaser.get(inputSource);
      const cursor = inputCursor.get(inputSource);

      const pose = frame.getInputPose(inputSource, XR.refSpace);
      if (pose) {
        /* Alex's Controller Handling */
        const isTrackedPointer = inputSource.targetRayMode === 'tracked-pointer';
        if (isTrackedPointer && inputPose.gripTransform.matrix) {
          if (this.controllers.length < inputSources.length) {
            const controller = new Controller();
            this.controllers.push(controller);
            this.scene.add(controller.mesh);
          }

          const gripMatrix = new Matrix4().fromArray(inputPose.gripTransform.matrix);
          applyOriginOffset(gripMatrix);

          const matrixPosition = new Vector3();
          gripMatrix.decompose(matrixPosition, new Quaternion(), new Vector3());
          this.controllers[i].updateControllerPosition(gripMatrix);
        }
        /* End */

        if (pose.targetRay) {
          const pointerMatrix = new Matrix4().fromArray(pose.targetRay.matrix);
          applyOriginOffset(pointerMatrix);

          // Handle Drag and Drop
          if (dragAndDrop.has(inputSource)) {
            const { object, transformMatrix } = dragAndDrop.get(inputSource);
            const newMatrix = new Matrix4().multiplyMatrices(pointerMatrix, transformMatrix);
            if (object[Interactions].drag) {
              object[Interactions].drag(newMatrix);
            } else {
              object.matrix = newMatrix;
              object.updateMatrixWorld(true);
            }
          }

          if (inputBoxes.has(inputSource)) {
            inputBoxes.get(inputSource).forEach((box, i) => {
              steps[i](box, pointerMatrix);
            });
          }

          if (lastObject) {
            lastObject.material = oldMaterial;
            lastObject = false;
            oldMaterial = null;
          }

          for (const intersection of raycast(pose.targetRay)) {
            const cursor = inputCursor.get(inputSource);
            if (cursor) {
              cursor.matrixWorld.setPosition(intersection.point);
            }

            oldMaterial = intersection.object.material;
            lastObject = intersection.object;
            intersection.object.material = selectedMaterial;

            const laser = inputLaser.get(inputSource);
            if (laser) {
              laser.matrixWorld.copy(pointerMatrix);
            }

            if (intersection.object[Interactions] && intersection.object[Interactions].hover) {
              intersection.object[Interactions].hover(0, intersection);
            }
            break; // MAYBE: Handle more than the closest object?
          }
        }
      }
    }
  }
}


export function closeInteractions() {
  xrSession.removeEventListener('inputsourceschange', handleInputSourcesChange);

  xrSession.removeEventListener('selectstart', handleSelectStart);
  xrSession.removeEventListener('selectend', handleSelectEnd);
}
