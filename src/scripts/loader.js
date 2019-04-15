import { ObjectLoader, TextureLoader } from 'three';
import THREE from './three';

const objectLoader = new ObjectLoader();
const gltfLoader = new THREE.GLTFLoader();
const objLoader = new THREE.OBJLoader();
const textureLoader = new TextureLoader();

export class Loader {
  _queue = [];

  cache = {};

  /**
   * add gltf to the queue, and return a promise with the gltf
   *
   * @param {string} url
   * @param {string} id unique id to access the gltf from the cache
   * @returns {Promise<THREE.GLTF>}
   */
  addGltfToQueue = (url, id) => {
    const promise = new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => { // onSuccess
          this.cache[id] = gltf;
          resolve(gltf);
        },
        () => {}, // onProgress
        err => reject(err) // onError
      );
    });
    this._queue.push(promise);

    return promise;
  }

  /**
   * add texture to the queue, and return a promise with the texture
   *
   * @param {string} url
   * @param {string} id unique id to access the texture from the cache
   * @returns {Promise<THREE.Texture>}
   */
  addTextureToQueue = (url, id) => {
    const promise = new Promise((resolve, reject) => {
      textureLoader.load(
        url,
        (texture) => { // onSuccess
          this.cache[id] = texture;
          resolve(texture);
        },
        () => {}, // onProgress
        err => reject(err) // onError
      );
    });
    this._queue.push(promise);

    return promise;
  }

  // This is to have one loader wait until another loader / task has finished before it finishes itself
  depend(promise) {
    this._queue.push(promise);
    return promise;
  }

  /**
   * add object to the queue, and return a promise with the object
   *
   * @param {string} url
   * @param {string} id unique id to access the object from the cache
   * @returns {Promise<THREE.Object3D>}
   */
  addObjectToQueue = (url, id) => {
    const promise = new Promise((resolve, reject) => {
      objectLoader.load(
        url,
        (object) => { // onSuccess
          this.cache[id] = object;
          resolve(object);
        },
        () => {}, // onProgress
        err => reject(err) // onError
      );
    });
    this._queue.push(promise);

    return promise;
  }

  /**
   * add object to the queue, and return a promise with the object
   *
   * @param {string} url
   * @param {string} id unique id to access the object from the cache
   * @returns {Promise<THREE.Object3D>}
   */
  addOBJToQueue = (url, id) => {
    const promise = new Promise((resolve, reject) => {
      objLoader.load(
        url,
        (object) => { // onSuccess
          this.cache[id] = object;
          resolve(object);
        },
        () => {}, // onProgress
        err => reject(err) // onError
      );
    });
    this._queue.push(promise);

    return promise;
  }

  /**
   * waits for all assets, returns promise with cache object as value.
   */
  async waitForCache() {
    await Promise.all(this._queue);
    return this.cache;
  }
}
