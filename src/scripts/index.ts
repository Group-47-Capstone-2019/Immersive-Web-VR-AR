import * as THREE from 'three';

//Three variables - Global for now
var scene       : THREE.Scene, 
    camera      : THREE.PerspectiveCamera, 
    renderer    : THREE.WebGLRenderer,
/*
 * Initializes three.js
 */
function initThree()
{
    //Initialize scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0);

    //Init renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //Init camera
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 2000);

    //Add event listener for automatic resizing
    window.addEventListener('resize', onWindowResize, false);
}

/*
 * Main event loop
 */
function animate()
{
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

/*
 * Handles automatic resizing
 */
function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

initThree();
animate();
