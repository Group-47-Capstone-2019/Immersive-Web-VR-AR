import * as THREE from 'three'; // build/three.js from node_module/three

window.THREE = THREE;

require('three/examples/js/controls/PointerLockControls'); // Append orbit controls
require('three/examples/js/loaders/GLTFLoader'); // also include gltf loader

export default THREE;
