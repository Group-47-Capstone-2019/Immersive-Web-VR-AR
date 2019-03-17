import * as THREE from 'three';
import wallTexture from '../../assets/wall.png';
import XrScene from './xr-scene';
import TriggerMesh from '../trigger';

const settings = {
  global: {
    lights: {
      ambient: true
    }
  },
  room: {
    textures: {
      enabled: false
    },
    lights: {
      point: true
    }
  }
};

export default class HomeScene extends XrScene {
  /**
   *
   * @param {THREE.Renderer} renderer
   * @param {THREE.Camera} camera
   */
  constructor(renderer, camera) {
    super(renderer, camera);

    // Basic lighting
    if (settings.global.lights.ambient) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      this.scene.add(ambientLight);
    }

    if (settings.room.lights.point) {
      const pointLight = new THREE.PointLight(0xffffff, 0.8);
      pointLight.position.set(0, 0, 0);
      this.scene.add(pointLight);
    }

    // Generate room geometry
    const roomGeometry = new THREE.BoxGeometry(24, 16, 24);

    let roomMaterials;

    if (settings.room.textures.enabled) {
      // Set room materials to an array such that it can hold a texture for each face
      roomMaterials = [];

      // Load texture images via path and converts them to THREE.Texture objects
      const loader = new THREE.TextureLoader();

      loader.load(
        wallTexture,
        (texture) => {
          for (let i = 0; i < 6; i++) {
            roomMaterials.push(
              new THREE.MeshPhongMaterial({
                map: texture,
                side: THREE.BackSide
              })
            );
          }
        },
        undefined,
        () => {
          console.error(
            'Texture not loading properly, using default material.'
          );
          for (let i = 0; i < 6; i++) {
            roomMaterials.push(
              new THREE.MeshPhongMaterial({
                color: 0x003050,
                side: THREE.BackSide
              })
            );
          }
        }
      );
    } else {
      // Set material to default if textures are not enabled
      roomMaterials = new THREE.MeshPhongMaterial({
        color: 0x003050,
        side: THREE.BackSide
      });
    }

    // Generate room mesh using geometry and materials
    const room = new THREE.Mesh(roomGeometry, roomMaterials);

    if (room) {
      room.receiveShadow = true;
      room.castShadow = true;
      this.scene.add(room);
    } else {
      console.error('Error creating room mesh.');
    }

    this._boxTest();
  }

  onAssetsLoaded(cache) {
    super.onAssetsLoaded(cache);
    return cache;
  }

  animate() {
    const box = this.triggers.getObjectByName('testBox001');
    box.rotateX(0.01);
    box.rotateY(0.01);
    box.rotateZ(0.03);
  }

  _boxTest() {
    console.log('In box test');
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true
    });

    if (!geometry) console.log('Failed to generate geometry');
    if (!material) console.log('Failed to generate material');

    const box = new TriggerMesh(geometry, material);
    if (!box) console.log('Failed to create box mesh');

    box.hover = function (intersection) {
      if (this.debug) console.log(intersection);
      if (!this.isSelected) {
        this.material.color.set(0xFF0000);
      }
    };

    box.select = function (intersection) {
      if (this.debug) console.log(intersection);
      this.material.color.set(0x00FF00);
    };

    box.release = function (intersection) {
      if (this.debug) console.log(intersection);
      this.material.color.set(0x0000FF);
    };

    box.exit = function (intersection) {
      if (this.debug) console.log(intersection);
      this.material.color.set(0xFFFFFF);
    };


    box.name = 'testBox001';
    box.position.set(-1, 0, -5);

    this.triggers.add(box);

    const box2 = box.clone();
    box2.position.set(1, 0, -5);

    this.triggers.add(box2);

    if (!this.scene.getObjectByName('testBox001')) {
      console.log('Box not found in scene');
    }
  }
}
