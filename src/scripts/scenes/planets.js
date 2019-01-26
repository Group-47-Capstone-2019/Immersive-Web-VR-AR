import * as THREE from 'three';

export class PlanetsScene {

    /**
     *
     * @param {THREE.Renderer} renderer
     * @param {THREE.Camera} camera
     */
    constructor(renderer, camera) 
    {
        this._renderer = renderer;
        this._camera = camera;

        this._scene = new THREE.Scene();

        this._initGeometry();

        this._addLighting();
    }

    /**
     * Initializes scene geometry
     */
    _initGeometry()
    {
        this._ball = this._createBall()
        this._ballVelocity = 0.01;
    }

    /**
     * Creates a wireframe ball and adds it to the scene
     */
    _createBall() 
    {
        const geometry = new THREE.SphereGeometry(1);
        const mat = new THREE.MeshBasicMaterial({ color: 'red', wireframe: true });
        const ball = new THREE.Mesh(geometry, mat);
        ball.position.set(0, 0, -5);

        this._scene.add(ball);

        return ball;
    }

    /**
     * Adds an ambient light source to the scene
     */
    _addLighting() 
    {
        let ambientLight = new THREE.AmbientLight('white', 0.7);
        this._scene.add(ambientLight);
    }

    /**
     * This is where the magic happens. Frame updates take place here.
     * Can also be called the event loop
     */
    animate = () => {
        const { x } = this._ball.position;
        if (x < -2 || x > 2) {
            this._ballVelocity *= -1;
        }

        this._ball.position.setX(x + this._ballVelocity);
        this._renderer.render(this._scene, this._camera);
        requestAnimationFrame(this.animate);
    };
}
