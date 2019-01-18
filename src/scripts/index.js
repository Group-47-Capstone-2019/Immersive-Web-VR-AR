import * as THREE from 'three';

class Experience {
    
    static get CAMERA_SETTINGS() {
        return {
            viewAngle : 90,
            near : 0.1,
            far : 1000 
        }
    }

    static get DEBUG() {
        return {
            enabled : true
        }
    }

    constructor()
    {
        this._debug = Experience.DEBUG;

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

        this._initGeometry();

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
     * Creates all the geometry, materials and meshes for the scene
     */
    _initGeometry()
    {
        if(this._debug.enabled) { this._boxTest(); }
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
    _animate = () =>
    {
        requestAnimationFrame(this._animate);
        this._renderer.render(this._scene, this._camera);
    }

    //TESTING FUNCTIONS!

    /*
     * Adds a simple box to the scene at (0, 0, -5)
     */
    _boxTest()
    {
        console.log("In box test");
        let geometry = new THREE.BoxGeometry(1, 1, 1);
        let material = new THREE.MeshBasicMaterial({color : 0xff0000});

        if(!geometry)
            console.log("Failed to generate geometry");
        if(!material)
            console.log("Failed to generate material");

        let box = new THREE.Mesh(geometry, material);
        if(!box)
            console.log("Failed to create box mesh");

        box.name = "testBox001";
        box.position.set(new THREE.Vector3(0, 0, -5));

        this._scene.add(box);

        let found = false;
        this._scene.children.forEach(function(child) {
            if(child.name == box.name)
                found = true;
        });

        if(!found)
            console.log("Box not found in scene");
    }
};

new Experience();