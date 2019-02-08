import  { Scene, Matrix4, Vector3 } from 'three';
import  { xrSession,
          xrRefSpace,
          xrMagicWindowCanvas
 } from '../xrController';
import { canvas } from '../renderer/canvas';

export class XrScene {
    scene = new Scene();
    isActive = true;

    /**
     * Initialize the scene. Sets this.scene, this.renderer, and this.camera for you.
     *
     * @param {THREE.Renderer} renderer
     * @param {THREE.Camera} camera
     */
    constructor(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
    }

    /**
     * Override this to handle animating objects in your scene.
     */
    animate() {}

    /**
     * Call this to begin animating your frame.
     */
    startAnimation() {
        console.log(this.camera.aspect);
        this._animationCallback();
    }

    _animationCallback = (timestamp, xrFrame) => {
        if (this.isActive) {
            //Update the objects in the scene that we will be rendering
            this.animate();
            if(!xrSession) {
                this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
                this.renderer.autoClear = true;
                this.scene.matrixAutoUpdate = true;
                this.renderer.render(this.scene, this.camera);
                requestAnimationFrame(this._animationCallback);
            } else {
                if(!xrFrame)
                    return xrSession.requestAnimationFrame(this._animationCallback);

                let pose = xrFrame.getViewerPose(xrRefSpace);

                if(pose) {
                    this.scene.matrixAutoUpdate = false;
                    this.renderer.autoClear = false;
                    this.renderer.clear();

                    this.renderer.context.bindFramebuffer(this.renderer.context.FRAMEBUFFER, xrSession.baseLayer.framebuffer);
                    for(let view of pose.views) {
                        let viewport = xrSession.baseLayer.getViewport(view);
                        let viewMatrix = new Matrix4().fromArray(view.viewMatrix);

                        this._translateViewMatrix(viewMatrix, new Vector3(0, 0, 0));

                        this.renderer.setViewport(viewport.x, viewport.y, xrMagicWindowCanvas.width, xrMagicWindowCanvas.height);
                        this.camera.matrixWorldInverse.copy(viewMatrix);
                        this.camera.projectionMatrix.fromArray(view.projectionMatrix);
                        this.scene.matrix.copy(viewMatrix);

                        this.scene.updateMatrixWorld(true);
                        this.renderer.render(this.scene, this.camera);
                        this.renderer.clearDepth();
                    }
                }

                xrSession.requestAnimationFrame(this._animationCallback);
            }
        }
    };

    _translateViewMatrix(viewMatrix, position) {
        //Save initial position for later
        let tempPosition = new Vector3(
            position.x,
            position.y,
            position.z
        );

        let tempViewMatrix = new Matrix4().copy(viewMatrix);

        tempViewMatrix.setPosition(new Vector3());
        tempPosition.applyMatrix4(tempViewMatrix);

        let translationInView = new Matrix4();
        translationInView.makeTranslation(tempPosition.x, tempPosition.y, tempPosition.z);

        viewMatrix.premultiply(translationInView);
    }
};
