import * as THREE from 'three';
import 'babel-polyfill';
import { HomeScene } from './scenes/home';
import { PlanetsScene } from './scenes/planets';

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
        //Scene classes
        this._homeScene;
        this._planetScene;

        //Three tools
        this._renderer;
        this._camera;
        this._canvas;

        //Camera fields
        this._camSettings;
        this._aspect;
        this._width;
        this._height;

        this._initCanvas();

        this._setDimensions();

        this._createCamera();

        this._createRenderer();

        this._initLinks();

        this._setEventListeners();

        this._navigateToScene(window.location.pathname);

    }

    /**
     * Query selects canvas HTML element
     */
    _initCanvas()
    {
        this._canvas = document.getElementById('vr-port');
    }

    /**
     * Gets width and height of the current window.
     * Generates an aspect ratio
     */
    _setDimensions()
    {
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._aspect = this._width / this._height;
    }
    
    /**
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
     * Generates a new THREE WebGLRenderer and appends it to the HTML canvas
     */
    _createRenderer()
    {
        this._renderer = new THREE.WebGLRenderer({canvas : this._canvas});
        this._renderer.setSize(this._width, this._height);
    }

    /**
     * Initialize on click listeners for the links on the page
     * that will route to different experience rooms
     */
    _initLinks() 
    {
        //Set up on click listeners
        const planetsLink = document.getElementById('planets-link');
        planetsLink.onclick = () => this._navigate('/planets');

        const fallingLink = document.getElementById('falling-link');
        fallingLink.onclick = () => this._navigate('/');

        const pendulumsLink = document.getElementById('pendulums-link');
        pendulumsLink.onclick = () => this._navigate('/');
    }

    /**
     * Sets up event listeners for the window
     */
    _setEventListeners()
    {
        window.addEventListener('resize', this._onWindowResize);

        window.onpopstate = () => {
            this._navigateToScene(window.location.pathname);
        };
    }

    /**
     * Correctly resizes the window and updates aspect ratio of canvas on resize
     */
    _onWindowResize = () =>
    {
        this._setDimensions();
        this._camera.aspect = this._aspect;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(this._width, this._height);
    }

    /**
     * Update currently displayed scene based on the pathname
     * @param {string} pathname
     */
    _navigateToScene(pathname) {
        switch (pathname) {
            case '/':
                this._homeScene = new HomeScene(this._renderer, this._camera);
                requestAnimationFrame(this._homeScene.animate);
                break;
            case '/planets':
                this._planetScene = new PlanetsScene(this._renderer, this._camera);
                requestAnimationFrame(this._planetScene.animate);
                break;
        }
    }

    /**
     * Add to browser history and display new scene
     * @param {string} newPath
     */
    _navigate(newPath) {
        window.history.pushState({}, newPath, window.location.origin + newPath);
        this._navigateToScene(newPath);
    }
};

new Experience();