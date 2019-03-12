import * as THREE from 'three';
import wallTexture from '../../images/wall.png';
import { touchscreen } from '../controls/touch-controls';
import { controls } from '../controls/keyboard-controls';
import XrScene from './xr-scene';
import { navigate } from '../router';

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
    this.camera = camera;
    this.renderer = renderer;
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

    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.raycaster = new THREE.Raycaster();
    this.selectedObj = null;
    this.selectedObjColor;
    this.colorSet = false;

    this.createDoors();
    this._boxTest();
    this._addEventListener(window, 'mousedown', this.onClick);
  }

  animate() {
    this.updateRay();
    const box = this.scene.getObjectByName('testBox001');
    box.rotateX(0.01);
    box.rotateY(0.01);
    box.rotateZ(0.03);
  }

  updateRay() {
    if (this.selectedObj) {
      this.selectedObj.material.color.set(this.selectedObjColor);
      this.colorSet = false;
      this.selectedObj = null;
    }

    // Get ray from keyboard controls
    if(controls != null) {
      let direction = new THREE.Vector3();
      controls.getDirection(direction);
      this.raycaster.set(controls.getObject().position, direction);
    }
    
    let intersects = this.raycaster.intersectObject(this.group, true);
    if (intersects.length > 0) {
      let res = intersects.filter(function(res) {
        return res && res.object;
      })[0];
      
      if(res && res.object) {
        this.selectedObj = res.object;
        if(!this.colorSet) {
          this.selectedObjColor = this.selectedObj.material.color.getHex();
          
          this.colorSet = true;
        }
        this.selectedObj.material.color.set('green');
      }
    }
  }

  onClick = (event) => {
    if (touchscreen.enabled) {
      let touch = new THREE.Vector3();
      touch.x = (event.clientX / window.innerWidth) * 2 - 1;
      touch.y = - (event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(touch, this.camera);
    }

    this.updateRay();

    let intersects = this.raycaster.intersectObject(this.group, true);
    if (intersects.length > 0) {
      let res = intersects.filter(function(res) {
        return res && res.object;
      })[0];

      if (res && res.object) {
        if (res.object === this.scene.getObjectByName('fallingDoor')) {
          console.log('Falling Door');
          navigate('/falling');
        } else if (res.object === this.scene.getObjectByName('planetsDoor')) {
          console.log('Planets Door');
          navigate('/planets');
        } else if (res.object === this.scene.getObjectByName('pendulumDoor')) {
          console.log('Pendulum Door');
          navigate('/pendulum');
        } else if (res.object === this.scene.getObjectByName('mirrorDoor')) {
          console.log('Mirror Door');
          navigate('/mirror');
        }
      }
    }
  }

  createDoors() {
    const geometry = new THREE.BoxGeometry(1, 12, 7);
    const fallingMaterial = new THREE.MeshPhongMaterial({
      color: '#402f00',
    });
    const fallingDoor = new THREE.Mesh(geometry, fallingMaterial);
    fallingDoor.name = 'fallingDoor';
    fallingDoor.position.set(-11.5, -2, 0);
    this.group.add(fallingDoor);

    const planetsMaterial = new THREE.MeshPhongMaterial({
      color: '#402f00',
    });
    const planetsDoor = new THREE.Mesh(geometry, planetsMaterial);
    planetsDoor.name = 'planetsDoor';
    planetsDoor.position.set(11.5, -2, 0);
    this.group.add(planetsDoor);

    const pendulumMaterial = new THREE.MeshPhongMaterial({
      color: '#402f00',
    });
    const pendulumDoor = new THREE.Mesh(geometry, pendulumMaterial);
    pendulumDoor.rotateY(Math.PI / 2);
    pendulumDoor.name = 'pendulumDoor';
    pendulumDoor.position.set(0, -2, -11.5);
    this.group.add(pendulumDoor);

    const mirrorMaterial = new THREE.MeshPhongMaterial({
      color: '#402f00',
    });
    const mirrorDoor = new THREE.Mesh(geometry, mirrorMaterial);
    mirrorDoor.rotateY(Math.PI / 2);
    mirrorDoor.name = 'mirrorDoor';
    mirrorDoor.position.set(0, -2, 11.5);
    this.group.add(mirrorDoor);
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

    const box = new THREE.Mesh(geometry, material);
    if (!box) console.log('Failed to create box mesh');

    box.name = 'testBox001';
    box.position.set(0, 0, -5);

    this.scene.add(box);

    if (!this.scene.getObjectByName('testBox001')) {
      console.log('Box not found in scene');
    }
  }
}
