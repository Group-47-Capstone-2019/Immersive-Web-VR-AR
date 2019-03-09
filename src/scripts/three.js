import * as THREE from 'three'; // build/three.js from node_module/three

window.THREE = THREE;

require('three/examples/js/controls/PointerLockControls.js'); // Append pointer lock controls
require('three/examples/js/loaders/MTLLoader');
require('three/examples/js/loaders/OBJLoader');

export default THREE;
