import WebXRPolyfill from 'webxr-polyfill';
import * as THREE from 'three';
import 'babel-polyfill';
import wallTexture from '/images/wall.png';

//Instantiate the WebXRPolyfill which will modify the page to allow for XR function
const polyfill = new WebXRPolyfill();

class Experience {

    static get SETTINGS() {
        return {
            global : {
                lights : {
                    ambient : true
                }
            },
            room : {
                textures : {
                    enabled : false
                },
                lights : {
                    point : true
                }
            }
        }
    }

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
        this._settings = Experience.SETTINGS;
        this._debug = Experience.DEBUG;

        this._scene;
        this._renderer;
        this._camera;
        this._container;

        this._camSettings;
        this._aspect;
        this._width;
        this._height;

        //XR fields
        this._xrDevice;
        this._xrSession;
        this._xrFrameOfRef;
        this._xrMagicWindowCanvas;

        this._initContainer();

        this._setDimensions();

        this._createScene();

        this._createCamera();

        this._initGeometry();

        this._createRenderer();

        this._setEventListeners();
        
        requestAnimationFrame(this._animate);

        this._validateXR();
    }
    
    /*
     * Query selects container HTML element and clears its content
     */
    _initContainer()
    {
        this._container = document.querySelector('header');
    }

    /*
     * Gets width and height of the current window.
     * Generates an aspect ratio
     */
    _setDimensions()
    {
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
     * Waits for an XR device to connect to the session and validates its capabilities
     */
    _validateXR()
    {
        //Check that the browser has XR enabled
        if(navigator.xr)
        {
            // See if a device is available.
            navigator.xr.requestDevice().then(device => {
                this._initXR(device);
            }).catch(function() {
                console.error("XR Device not found!\nListening for devices . . .");
            });
        }
    }

    /*
     * Obtains information about the connected XR device
     */
    _initXR(device)
    {
        console.log("Device found!\n");
        console.log(device);
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
        
        this._createRoom();
    }

    /*
     * Creates initial scene room with settings defined in SETTINGS
     */
    _createRoom()
    {
        let roomSettings = this._settings.room;

        // Basic lighting
        if(this._settings.global.lights.ambient)
        {
            let ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            this._scene.add(ambientLight);
        }

        if(roomSettings.lights.point)
        {
            let pointLight = new THREE.PointLight(0xffffff, 0.8);
            pointLight.position.set(0, 0, 0);
            this._scene.add(pointLight);
        }

        //Generate room geometry
        let roomGeometry = new THREE.BoxGeometry(12, 8, 12);

        let roomMaterials;
        
        if(roomSettings.textures.enabled)
        {
            //Set room materials to an array such that it can hold a texture for each face
            roomMaterials = [];

            //Load texture images via path and converts them to THREE.Texture objects
            let loader = new THREE.TextureLoader();

            loader.load(wallTexture, 
                function(texture){
                    for (let i = 0; i < 6; i++)
                    {
                        roomMaterials.push(new THREE.MeshPhongMaterial({map : texture, side : THREE.BackSide}));
                    }
                },
                undefined,
                function(err){
                    console.error("Texture not loading properly, using default material.");
                    for (let i = 0; i < 6; i++)
                    {
                        roomMaterials.push(new THREE.MeshPhongMaterial({color : 0x003050, side : THREE.BackSide}));
                    }
                }
            );
            
        }
        else //Set material to default if textures are not enabled
        {
            roomMaterials = new THREE.MeshPhongMaterial({color : 0x003050, side : THREE.BackSide})
        }

        //Generate room mesh using geometry and materials
        let room = new THREE.Mesh(roomGeometry, roomMaterials);

        if(room){
            room.receiveShadow = true;
            room.castShadow = true;
            this._scene.add(room);
        }
        else{
            console.error("Error creating room mesh.");
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

    _setEventListeners()
    {
        window.addEventListener('resize', this._onWindowResize);
        if(navigator.xr)
            navigator.xr.addEventListener('devicechange', this._validateXR);
    }

    _onWindowResize = () =>
    {
        this._setDimensions();
        this._camera.aspect = this._aspect;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(this._width, this._height);
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

    // -------------------------------------------------------------------------------------------------------------------------------------------------------
    // --- TESTING FUNCTIONS ---------------------------------------------------------------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------------------------------------------------------------------

    /*
     * Adds a simple box to the scene at (0, 0, -5) and tests its existence
     */
     _boxTest()
    {
        console.log("In box test");
        let geometry = new THREE.BoxGeometry(1, 1, 1);
        let material = new THREE.MeshBasicMaterial({color : 0xffffff, wireframe : true});

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
