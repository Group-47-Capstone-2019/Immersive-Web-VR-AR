import * as THREE from 'three';
import 'babel-polyfill';

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
            enabled : true,
            boxTest : true
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

        this._initContainer();

        this._createScene();

        this._createCamera();

        this._initGeometry();

        this._createRenderer();
        
        requestAnimationFrame(this._animate);
    }

    /*
     * Gets width and height of the current window.
     * Generates an aspect ratio
     */
    _initContainer()
    {
        this._container = document.querySelector('#container');
        this._width = this._container.clientWidth;
        this._height = this._container.clientHeight;
        this._aspect = this._width / this._height;
    }

    /*
     * Allocates a new THREE scene for _scene
     */
    _createScene()
    {
        this._scene = new THREE.Scene();
        this._scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color : 0xff0000})));
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
        if(this._debug.enabled) {
            if(this._debug.boxTest)
                this._boxTest(); 
        }
    }

    /*
     * Generates a new THREE WebGLRenderer and appends it to the HTML container
     */
    _createRenderer()
    {
        this._renderer = new THREE.WebGLRenderer();
        this._renderer.setSize(this._width, this._height);
        this._container.appendChild(this._renderer.domElement);
    }

    /*
     * This is where the magic happens. Frame updates take place here.
     * Can also be called the event loop
     */
    _animate = () =>
    {
        if(this._debug.enabled) {
            if(this._debug.boxTest){
                let box = this._scene.getObjectByName("testBox001");
                box.rotateX(0.01);
                box.rotateY(0.01);
                box.rotateZ(0.03);
            }
        }

        this._renderer.render(this._scene, this._camera);
        requestAnimationFrame(this._animate);
    }

    //TESTING FUNCTIONS!

    /*
     * Adds a simple box to the scene at (0, 0, -5) and tests its existence
     */
    _boxTest()
    {
        console.log("In box test");
        let geometry = new THREE.BoxGeometry(1, 1, 1);
        let material = new THREE.MeshBasicMaterial({color : 0xffffff});

        if(!geometry)
            console.log("Failed to generate geometry");
        if(!material)
            console.log("Failed to generate material");

        let box = new THREE.Mesh(geometry, material);
        if(!box)
            console.log("Failed to create box mesh");

        box.name = "testBox001";
        box.position.set(0, 0, -5);

        this._scene.add(box);

        if(!this._scene.getObjectByName("testBox001"))
            console.log("Box not found in scene");
    }
};

new Experience();