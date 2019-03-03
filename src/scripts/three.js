import * as THREE from 'three'; // build/three.js from node_module/three

window.THREE = THREE;

require('three/examples/js/controls/PointerLockControls.js'); // Append PointerLockControls
// require('three/examples/js/loaders/FBXLoader.js'); // Append FBXLoader

export default THREE;
