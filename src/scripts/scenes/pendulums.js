import {
  PointLight,
  Vector3, Matrix4, Quaternion,
  MeshBasicMaterial, MeshPhongMaterial
} from 'three';
import XrScene from './xr-scene';
import { navigate } from '../router';
import { Interactions } from '../interactions';
import pendulumSceneGlb from '../../assets/pendulum_scene.glb';
import { XR } from '../xrController';
import MoonTexture from '../../assets/textures/moon.png';
import EarthTexture from '../../assets/textures/earth.png';
import MarsTexture from '../../assets/textures/mars.png';
import WoodTexture from '../../assets/textures/wood.png';
import WoodTexture2 from '../../assets/textures/wood-2.png';

const selectedMaterial = new MeshBasicMaterial({
  color: '#f5b700'
});
const savedMaterials = new Map();
function yellowOnHover(object) {
  return {
    hover_start() {
      savedMaterials.set(object, object.material);
      console.log('Saved material', object.material);
      object.material = selectedMaterial;
    },
    hover_end() {
      object.material = savedMaterials.get(object);
      console.log('Restored material', object.material);
      savedMaterials.delete(object);
    }
  };
}
function teleportOnSelect() {
  return {
    select(intersection) {
      if (intersection) {
        const { point } = intersection;
        console.log('Teleporting to:', point);
        const offsetMatrix = XR.getOffsetMatrix();
        point.y = 0;
        point.multiplyScalar(-1);
        offsetMatrix.setPosition(point);
        XR.setOffsetMatrix(offsetMatrix);
      }
    }
  };
}

function calculateMotion(pendulum_swing, length, gravity) {
  // Assumption: pendulum_swing's matrix is always a rotation matrix
  if (gravity) {
    const orientation = new Quaternion().setFromRotationMatrix(pendulum_swing.matrix);
    const amplitude = Math.atan(-orientation.x / orientation.y);
    const val = Math.sqrt(gravity / length);
    let timer = Math.asin(1) / val;
    return (timeDifference) => {
      timer += timeDifference;
      const i = amplitude * Math.sin(val * timer);
      const x = -length * Math.sin(i);
      const y = length * Math.cos(i);
      /* silent: g */
      const quat = new Quaternion(x, y, 0, 0);
      quat.normalize();
      const position = new Vector3();
      const scale = new Vector3();
      pendulum_swing.matrix.decompose(position, new Quaternion(), scale);
      pendulum_swing.matrix.compose(position, quat, scale);
      pendulum_swing.updateMatrixWorld(true);
    };
  }
  const position = new Vector3(), scale = new Vector3();
  pendulum_swing.matrix.decompose(position, new Quaternion(), scale);
  pendulum_swing.matrix.compose(position, new Quaternion(), scale);
  return () => undefined;
}

const snappingPoints = [];
function getSnappingObj(objPos) {
  const THRESHHOLD = 0.7;
  for (const snappingPoint of snappingPoints) {
    const snappingPointPos = new Vector3().setFromMatrixPosition(snappingPoint.matrixWorld);
    const distance = snappingPointPos.distanceTo(objPos);
    if (distance < THRESHHOLD) {
      return snappingPoint;
    }
  }
  return null;
}
function dragWithSnapping(object) {
  return {
    // For an object to be dragable at least one of drag, drag_start, or
    // drag_end must exist in the interactions
    // drag_start() {},
    // Drag isn't completely necessary - Only if you want to customize in what
    // ways the object can be manipulated,
    drag_start: (intersection, pointerMatrix) => {
      // this.paused = true;
      // TODO: Stop associated pendulum swing's motion
      const pointerInverse = new Matrix4().getInverse(pointerMatrix, true);
      const target = new Matrix4().copy(intersection.object.matrixWorld);
      const transformMatrix = new Matrix4().multiplyMatrices(pointerInverse, target);
      return {
        object: intersection.object,
        transformMatrix,
        matrixAutoUpdate: intersection.object.matrixAutoUpdate
      };
    },
    drag(matrix) {
      // Check if we should snap to any of our snapping points.
      const snap = getSnappingObj(new Vector3().setFromMatrixPosition(matrix));
      if (snap) {
        object.matrix.copy(snap.matrix);
      } else {
        // Didn't find anything to snap to
        object.matrix.copy(matrix);
      }
      object.updateMatrixWorld(true);
    }
  };
}

export default class PendulumScene extends XrScene {
  constructor(renderer, camera) {
    super(renderer, camera);
    this.animateFunctions = new Map();

    this.loader.addGltfToQueue(pendulumSceneGlb, 'pendulum_scene');
    this.loader.addTextureToQueue(MoonTexture, 'moon-texture');
    this.loader.addTextureToQueue(EarthTexture, 'earth-texture');
    this.loader.addTextureToQueue(MarsTexture, 'mars-texture');
    this.loader.addTextureToQueue(WoodTexture, 'wood-texture');
    this.loader.addTextureToQueue(WoodTexture2, 'wood-2-texture');

    this.surfaces = {};
    this.currentSurface = 'Earth';

    this.materials = {
      selectedIcon: new MeshPhongMaterial({ color: '#40798c' }),
      normalIcon: new MeshPhongMaterial({ color: '#595f72' }),
      wrongIcon: new MeshBasicMaterial({ color: '#e63946' }),
      rightIcon: new MeshBasicMaterial({ color: '#04724d' })
    };

    this.paused = true;
  }

  onAssetsLoaded(assetCache) {
    const importedScene = assetCache['pendulum_scene'].scene;
    this.loadScene(importedScene, assetCache);
    this.setupInteractions(importedScene);

    this.run();
  }

  setupInteractions(importedScene) {
    // Add the interactions for the pendulums
    for (const pendulum of ['Pendulum', 'Pendulum_Tall'].map(name => importedScene.getObjectByName(name))) {
      const self = this;
      pendulum[Interactions] = Object.assign(yellowOnHover(pendulum), dragWithSnapping(pendulum, snappingPoints), {
        select_start: () => {
          for (const child of pendulum.children) {
            if (self.animateFunctions.has(child)) {
              self.animateFunctions.set(child, calculateMotion(child, child.length, 0));
            }
          }
        }
      });
      // Things that can be dragged shouldn't have matrix auto update on because
      // the dragging sets the object's matrix which would then be overwritten by
      // the unaffected position, rotation, and scale properties.
      pendulum.matrixAutoUpdate = false;
      // But we need to update the matrix and matrixWorld with the imported pos / rot / scale
      pendulum.updateMatrix();
      pendulum.updateMatrixWorld();
    }

    // Interactions for the pendulum swings
    const pendulumLengths = [0.5, 0.801];
    const pendulumNames = ['Pendulum_Swing', 'Pendulum_Swing_Tall'];
    for (let i = 0; i < pendulumNames.length; ++i) {
      const pendulum_swing = importedScene.getObjectByName(pendulumNames[i]);
      // Calculate the starting animation functions
      pendulum_swing.length = pendulumLengths[i];
      this.animateFunctions.set(pendulum_swing, calculateMotion(pendulum_swing, pendulum_swing.length, 0));
      
      const self = this;
      pendulum_swing[Interactions] = Object.assign(yellowOnHover(pendulum_swing), {
        drag_start(intersection, pointerMatrix) {
          // this.paused = true;
          self.animateFunctions.set(pendulum_swing, calculateMotion(pendulum_swing, pendulum_swing.length, 0));
          const transformMatrix = new Matrix4().makeTranslation(intersection.point.x, intersection.point.y, intersection.point.z);
          transformMatrix.premultiply(new Matrix4().getInverse(pointerMatrix, true));
          return {
            object: intersection.object,
            transformMatrix,
            matrixAutoUpdate: intersection.object.matrixAutoUpdate
          };
        },
        drag(matrix) {
          const target = new Vector3().setFromMatrixPosition(matrix);
          // Transform the world coordinates of the point into local coordinates so that we know what to use fot he up direction in lookAt.
          pendulum_swing.updateMatrixWorld();
          // const origin = new Vector3(0, 0, 0);
          const origin = new Vector3().setFromMatrixPosition(pendulum_swing.matrixWorld);
          const transform = new Matrix4().lookAt(origin, target, new Vector3(0, 0, 1));

          const quat = new Quaternion().setFromRotationMatrix(transform);
          quat.z = 0;
          quat.w = 0;
          quat.x *= -1; // Might need to adjust this.
          quat.normalize();
          transform.makeRotationFromQuaternion(quat);

          transform.copyPosition(pendulum_swing.matrix);
          pendulum_swing.matrix.copy(transform);
          pendulum_swing.updateMatrixWorld(true);
        },
        drag_end: () => {
          this.animateFunctions.set(pendulum_swing, calculateMotion(pendulum_swing, pendulum_swing.length, self.surfaces[self.currentSurface].gravity));
          // this.paused = false;
        }
      });
      // See above about drag / import
      pendulum_swing.matrixAutoUpdate = false;
      pendulum_swing.updateMatrix();
      pendulum_swing.updateMatrixWorld();
    }
    
    // Interactions for the exit door
    const exitObj = importedScene.getObjectByName('Exit');
    exitObj[Interactions] = Object.assign(yellowOnHover(exitObj), {
      /**
       * NOTE: the format for the parameters to these functions are:
       * hover({ distance, point, face, faceIndex, uv });
       */
      select: () => {
        this.changeRoom('/home'); // Navigate to the home room
      }
    });

    // Interactions for the floor + surfaces (Teleport);
    const floor = importedScene.getObjectByName('Floor');
    floor[Interactions] = Object.assign(yellowOnHover(floor), teleportOnSelect());

    // Interactions for the surfaces
    for (const key in this.surfaces) {
      const surface = this.surfaces[key];
      // Teleport for the floors
      surface.surface[Interactions] = teleportOnSelect();

      // Promises for the icons
      let resolver = null;
      surface.icon.select = () => {
        return new Promise(resolve => resolver = resolve);
      };
      surface.icon[Interactions] = {
        select() {
          if (resolver) {
            resolver(key);
            resolver = null;
          }
        }
      }
    }

    // Interactions for the quiz icon
    let quizResolver = null;
    this.quiz.icon.select = () => {
      return new Promise(resolve => quizResolver = resolve);
    }
    this.quiz.icon[Interactions] = {
      select() {
        if (quizResolver) {
          quizResolver('quiz');
          quizResolver = null;
        }
      }
    }
  }

  loadScene(importedScene, assetCache) {
    const static_materials = {
      'Moon': new MeshPhongMaterial({
        map: assetCache['moon-texture']
      }),
      'Earth': new MeshPhongMaterial({
        map: assetCache['earth-texture']
      }),
      'Mars': new MeshPhongMaterial({
        map: assetCache['mars-texture']
      }),
      'Wood': new MeshPhongMaterial({
        map: assetCache['wood-texture']
      }),
      'Wood_2': new MeshPhongMaterial({
        map: assetCache['wood-2-texture']
      })
    };

    // Add textured materials:
    importedScene.getObjectByName('Exit').material = static_materials['Wood'];
    importedScene.getObjectByName('Exit_Frame').material = static_materials['Wood_2'];

    importedScene.getObjectByName('Pendulum').material = static_materials['Wood_2'];
    importedScene.getObjectByName('Pendulum_Tall').material = static_materials['Wood_2'];

    importedScene.getObjectByName('Table').material = static_materials['Wood'];

    // Upgrade light placeholders into full fledged lights
    for (let i = 1, placeholder = importedScene.getObjectByName(`Light_${i}`); placeholder; placeholder = importedScene.getObjectByName(`Light_${++i}`)) {
      console.log(placeholder);
      const pointLight = new PointLight(0xffffff, 1);
      pointLight.position.copy(placeholder.position);
      placeholder.parent.add(pointLight);
      placeholder.parent.remove(placeholder);
    }

    // Pull the snapping points out of the imported scene
    for (
      let i = 1, snappingPoint = importedScene.getObjectByName(`Snap_Point_${i}`);
      snappingPoint;
      snappingPoint = importedScene.getObjectByName(`Snap_Point_${++i}`)
    ) {
      snappingPoints.push(snappingPoint);
    }

    // Extract the surfaces
    const gravities = {
      'Earth': 9.8,
      'Moon': 1.62,
      'Mars': 3.711,
    };
    for (const planet of ['Earth', 'Mars', 'Moon']) {
      const surface = importedScene.getObjectByName(planet + '_Surface');
      surface.material = static_materials[planet];
      if (planet != this.currentSurface) {
        surface.parent.remove(surface);
      }
      const icon = importedScene.getObjectByName(planet + '_Icon');
      icon.material = this.materials.normalIcon;
      this.surfaces[planet] = {
        surface,
        icon,
        gravity: gravities[planet]
      };
    }

    // Extract the Quiz icon and quiz box
    this.quiz = {
      icon: importedScene.getObjectByName('Quiz_Icon'),
      covering: importedScene.getObjectByName('Quiz_Covering'),
      floor: importedScene.getObjectByName('Floor')
    };
    this.quiz.covering.parent.remove(this.quiz.covering);
    this.quiz.icon.material = this.materials.normalIcon;

    this.loadSurface('Earth');

    // Put the scene in for rendering
    this.scene.add(importedScene);
  }

  loadSurface(name, highlightPlanet = true) {
    const oldSurface = this.surfaces[this.currentSurface];
    const newSurface = this.surfaces[name];
    if (name !== this.currentSurface) {
      const parent = oldSurface.surface.parent;
      parent.add(newSurface.surface);
      parent.remove(oldSurface.surface);
  
      this.currentSurface = name;
    }

    // Kill the motion of the pendulums because we're on a new planet
    for (const [key, value] of this.animateFunctions.entries()) {
      this.animateFunctions.set(key, calculateMotion(key, key.length, 0));
    }

    for (const surface of Object.values(this.surfaces)) {
      surface.icon.material = this.materials.normalIcon;
    }
    if (highlightPlanet) {
      newSurface.icon.material = this.materials.selectedIcon;
    }
  }

  async run() {
    this.paused = false;

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Main loop:
    while (true) {
      // Check for an icon click
      const selects = Object.values(this.surfaces).map(surface => surface.icon.select());
      selects.push(this.quiz.icon.select());
      const planet = await Promise.race(selects);
      if (planet == 'quiz') {
        // Start the quiz

        // Move the covering over the player
        this.quiz.floor.parent.add(this.quiz.covering);

        // Pick a random planet...
        const planets = Object.keys(this.surfaces);
        const chosenPlanet = planets[Math.floor(Math.random() * planets.length)];

        // Switch to it...
        this.loadSurface(chosenPlanet, false);

        // Listen for clicks on the planet icons...
        const guessedPlanet = await Promise.race(Object.values(this.surfaces).map(surface => surface.icon.select()));


        // Denote the one that they chose and the correct one...
        this.surfaces[guessedPlanet].icon.material = this.materials.wrongIcon;
        this.surfaces[chosenPlanet].icon.material = this.materials.rightIcon;

        // Raise the covering...
        this.quiz.covering.parent.remove(this.quiz.covering);

        // Wait for a second or two so that they can know what they chose...
        await delay(1500);

        // Restore the matrials on the icons...
        this.loadSurface(chosenPlanet);

        // Go back to the beginning and wait again...
      } else {
        this.loadSurface(planet);
      }
    }
  }

  animate(delta) {
    if (!this.paused) {
      for (const func of this.animateFunctions.values()) {
        func(delta);
      }
    }
  }
}
