import * as THREE from 'three';
import wallTexture from '../../images/wall.png';

export class HomeScene {

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

	static get DEBUG() {
        return {
            enabled : true,
            boxTest : true
        }
    }

	/**
	 *
	 * @param {THREE.Renderer} renderer
	 * @param {THREE.Camera} camera
	 */
	constructor(renderer, camera) 
	{
		this._settings = HomeScene.SETTINGS;
		this._debug = HomeScene.DEBUG;
		
		this._renderer = renderer;
		this._camera = camera;

		this._scene = new THREE.Scene();

		this._initGeometry();
	}

	/**
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

    /**
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

	/**
     * This is where the magic happens. Frame updates take place here.
     * Can also be called the event loop
     */
    animate = () =>
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
        requestAnimationFrame(this.animate);
	}
	
	// -------------------------------------------------------------------------------------------------------------------------------------------------------
    // --- TESTING FUNCTIONS ---------------------------------------------------------------------------------------------------------------------------------
    // -------------------------------------------------------------------------------------------------------------------------------------------------------

    /**
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
}