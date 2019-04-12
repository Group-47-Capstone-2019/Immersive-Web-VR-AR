import {
  Raycaster,
  Vector3, Matrix4
} from 'three';
import { getCurrentScene } from './currentScene';
import { XR } from './xrController';
import Controller from './scenes/controllers';

// TODO: Split Interactions into indevidual interfaces:
// - HoverInteraction
// - DragInteraction
// - SelectInteraction
// Make different symbols for each so that instead of checking if an object has
// interactions and then checking if it has the specific function, then we could
// just check for the one symbol.

// Put Interaction Callbacks under a special symbol
// so that we don't get confused with things on the three Object
export const Interactions = Symbol('Symbol Interactions');

// Everything needs to be a map.  If there was a single hoveredObject or selectedObject, then we wouldn't be able to have more than a single input source.
// This maps input sources -> controllers
const controllers = new Map();
const hoveredObjects = new Map();
const selectedObjects = new Map();
// Each input source can only be dragging one thing at a time, so:
// dragAndDrop is a map from inputSource -> {offset, transformMatrix, matrixAutoUpdate}
const dragAndDrop = new Map();

let inputSources = new Set();
// Maintain a list of input sources
const handleInputSourcesChange = ({ session }) => {
  const newSources = new Set(session.getInputSources());
  for (const old of inputSources.values()) {
    if (!newSources.has(old)) {
      const controller = controllers.get(old);
      if (controller) { controller.unbind(); }
    }
  }
  inputSources = newSources;
  // console.log('Input Sources Changed.', inputSources);
};

// Create a ray from the input source.  Used in the event listeners as well as handle interactions
function createRay(inputSource, xrFrame) {
  if (inputSource.targetRaySpace) {
    const rayPose = xrFrame.getPose(inputSource.targetRaySpace, XR.refSpace);

    if (rayPose) {
      /* global XRRay:true */
      return new XRRay(rayPose.transform);
    }
  }
  return null;
}

// Higher order function to reduce code duplication in the XR event handlers
function handlerCommon(func) {
  return function ({ frame, inputSource }) {
    const ray = createRay(inputSource, frame);
    if (ray) {
      for (const intersection of raycast(ray)) {
        func(intersection, inputSource, new Matrix4().fromArray(ray.matrix));
        break;
      }
    }
  };
}
const handleSelectStart = handlerCommon((intersection, inputSource, pointerMatrix) => {
  const interactions = intersection.object[Interactions];
  if (interactions) {
    // If there are any drag interactions then handle dragging
    if (interactions.drag_start || interactions.drag_end || interactions.drag) {
      let data;
      if (interactions.drag_start) {
        // console.log('Calling drag_start');
        data = interactions.drag_start(intersection, pointerMatrix);
      } else {
        // console.log('Using default drag_start implementation');
        // This is the default implementation for drag_start
        const pointerInverse = new Matrix4().getInverse(pointerMatrix, true);
        const target = new Matrix4().copy(intersection.object.matrixWorld);
        const transformMatrix = new Matrix4().multiplyMatrices(pointerInverse, target);
        data = {
          object: intersection.object,
          transformMatrix,
          matrixAutoUpdate: intersection.object.matrixAutoUpdate
        };
      }
      intersection.object.matrixAutoUpdate = false;
      dragAndDrop.set(inputSource, data);
    }
    // Handle select_start
    if (interactions.select_start) {
      // console.log('Calling select_start');
      interactions.select_start(intersection);
    }
  }
  selectedObjects.set(inputSource, intersection.object);
});
const handleSelectEnd = handlerCommon((_, inputSource) => {
  // Handle the end of dragging
  const data = dragAndDrop.get(inputSource);
  if (data) {
    const dragend = data.object[Interactions].drag_end;
    data.object.matrixAutoUpdate = data.matrixAutoUpdate;
    dragAndDrop.delete(inputSource);
    if (dragend) {
      // console.log('Calling drag_end');
      dragend();
    } else { }
  }

  const selectedObject = selectedObjects.get(inputSource);
  const interactions = selectedObject[Interactions];
  if (interactions) {
    // Handle the end of selection
    if (interactions.select_end) {
      // console.log('Calling select_end');
      interactions.select_end();
    } else { }
  }
  selectedObjects.delete(inputSource);
});
const handleSelect = handlerCommon((intersection) => {
  const interactions = intersection.object[Interactions];
  if (interactions) {
    if (interactions.select) {
      // console.log('Calling select');
      interactions.select(intersection);
    } else { }
  }
});

// Called when a session is created:
export function setupInteractions() {
  // console.log('Setting up interactions');
  handleInputSourcesChange({ session: XR.session });
  XR.session.addEventListener('inputsourceschange', handleInputSourcesChange);

  XR.session.addEventListener('select', handleSelect);
  XR.session.addEventListener('selectstart', handleSelectStart);
  XR.session.addEventListener('selectend', handleSelectEnd);
}

// Only have one Raycaster
const raycaster = new Raycaster();
function raycast(xrRay) {
  const { scene } = getCurrentScene();

  const trMatrix = new Matrix4().fromArray(xrRay.matrix);

  // Transformed ray matrix from the current scene matrix world
  // Actually, with originOffset, I don't think this is neccessary:
  const rMatrix = new Matrix4().multiplyMatrices(scene.matrixWorld, trMatrix);

  raycaster.set(
    new Vector3().setFromMatrixPosition(rMatrix),
    new Vector3(0, 0, -1).transformDirection(rMatrix)
      .normalize()
  );
  const intersections = raycaster.intersectObjects(scene.children, true);
  // for (const intersection of intersections) {
  //   intersection.point.applyMatrix4(scene.matrixWorld);
  // }
  if (intersections) return intersections;
  return [];
}

export function bindControllers(scene) {
  for (const controller of controllers.values()) {
    controller.bind(scene);
  }
}
export function unbindControllers() {
  for (const controller of controllers.values()) {
    controller.unbind();
  }
}
function updateInputSource(inputSource, ray, frame) {
  if (!controllers.has(inputSource)) {
    controllers.set(inputSource, new Controller(inputSource));
  }
  const controller = controllers.get(inputSource);
  // Handle Drag and Drop
  if (dragAndDrop.has(inputSource)) {
    const { object, transformMatrix } = dragAndDrop.get(inputSource);
    const newMatrix = new Matrix4().multiplyMatrices(new Matrix4().fromArray(ray.matrix), transformMatrix);
    if (object[Interactions].drag) {
      // console.log('Calling drag');
      object[Interactions].drag(newMatrix);
    } else {
      // console.log('Using default drag implementation');
      object.matrix = newMatrix;
      object.updateMatrixWorld(true);
    }
  }
  const lastHovered = hoveredObjects.get(inputSource);
  const intersections = raycast(ray);
  if (!selectedObjects.get(inputSource)) {
    for (const intersection of intersections) {
      // console.log(intersection);
      if (intersection.object.name === 'controller') {
        continue;
      }
      const interactions = intersection.object[Interactions];
      if (lastHovered !== intersection.object) {
        // End the hover of the previous object
        if (lastHovered && lastHovered[Interactions] && lastHovered[Interactions].hover_end) {
          console.log('Calling hover_end');
          lastHovered[Interactions].hover_end();
        } else { }
  
        // Hover the new Object
        if (interactions && interactions.hover_start) {
          // console.log('Calling hover_start');
          interactions.hover_start(intersection);
        } else { }
  
        // Mark the object as the one hovered by this input source
        hoveredObjects.set(inputSource, intersection.object);
      }
  
      // Call the hover method for every frame as lon as the same object is hovered
      if (interactions && interactions.hover) {
        // console.log('Calling hover');
        interactions.hover(intersection);
      }
      // else console.log('Using default hover implementation');
      break;
    }
  }

  // Update the controller for the current frame
  controller.update(frame, intersections[0]);

  // Handle if there are no objects to be intersected with
  if (intersections.length === 0) {
    if (lastHovered) {
      if (lastHovered[Interactions] && lastHovered[Interactions].hover_end) {
        lastHovered[Interactions].hover_end();
      }
      lastHovered.delete(inputSource);
    }
  }
}
// Called every frame.
export function handleInteractions(timestamp, frame) {
  if (frame) {
    if (inputSources.size > 0) {
      for (const inputSource of inputSources.values()) {
        const ray = createRay(inputSource, frame);
        updateInputSource(inputSource, ray, frame);
      }
    }
  }
}

// Called when the session ends:
export function closeInteractions(session) {
  function cleanupHelper(map, interactions) {
    for (const [inputSource, object] of map.entries()) {
      if (object) {
        if (object[Interactions]) {
          for (const interaction of interactions) {
            if (object[Interactions][interaction]) {
              // console.log(`Calling ${interaction}`);
              object[Interactions][interaction]();
            }
          }
        }
      }
      map.delete(inputSource);
    }
  }
  // Make sure that we call hover_end, select_end, and select on any objects that we would have if the person hadn't exited their session
  cleanupHelper(hoveredObjects, ['hover_end']);
  cleanupHelper(selectedObjects, ['select_end', 'select']);
  cleanupHelper(dragAndDrop, ['drag_end']);

  // console.log('Closing interactions');
  // console.trace();
  session.removeEventListener('inputsourceschange', handleInputSourcesChange);
  for (const [inputSource, controller] of controllers.entries()) {
    inputSources.delete(inputSource);
    controller.unbind();
    controllers.delete(inputSource);
  }

  session.removeEventListener('select', handleSelect);
  session.removeEventListener('selectstart', handleSelectStart);
  session.removeEventListener('selectend', handleSelectEnd);
}
