import * as THREE from 'three';

class Experience {
    
    static get CAMERA_SETTINGS() {
        return {
            viewAngle : 90,
            near : 0.1,
            far : 1000 
        }
    }

    constructor()
    {
        this._scene;
        this._renderer;
        this._camera;
        this._container;

        this._camSettings;
        this._aspect;
        this._width;
        this._height;

        this._getContainer();

        this._initWindow();

        this._createScene();

        this._createCamera();

        this._createRenderer();

        this._animate();
    }

    /*
     * Gets width and height of the current window.
     * Generates an aspect ratio
     */
    _initWindow()
    {
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._aspect = this._width / this._height;
    }

    /*
     * Allocates a new THREE scene for _scene
     */
    _createScene()
    {
        this._scene = new THREE.Scene();
    }

    /*
     * Generates a new three perspective camera based on CAMERA_SETTINGS
     */
    _createCamera()
    {
        this._camSettings = Experience.CAMERA_SETTINGS;
        this._camera = new THREE.PerspectiveCamera(
            this._camSettings.viewAngle,
            this._aspect, 
            this._camSettings.near, 
            this._camSettings.far
            );
    }

    /*
     * Generates a new THREE WebGLRenderer and appends it to the HTML container
     */
    _createRenderer()
    {
        this._renderer = new THREE.WebGLRenderer();
        this._container.appendChild(this._renderer.domElement);
    }

    /*
     * Query selects for HTML element with 'container' id
     */
    _getContainer()
    {
        this._container = document.querySelector('#container');
    }

    /*
     * This is where the magic happens. Frame updates take place here.
     * Can also be called the event loop
     */
    _animate()
    {
        requestAnimationFrame(this._animate);
        this._renderer.render(this._scene, this._camera);
    }
};

new Experience();