# Web XR Physics
The WebXR API is a brand new spec that gives developers the ability to create VR and AR experiences that run natively in the browser. Our physics demo uses this API to create an immersive experience that students can use to learn physics fundamentals.

This is an OSU Senior Capstone project for group 47. The goal is to demonstrate the abilities of the WebXR API by creating a sample project that can be referenced by others later. The project is sponsored by Intel. 

## Getting set up
After cloning the project, open up the root project repo and install the dependencies using
```
$ npm i
```

Start the development server using 
```
$ npm run dev
```
The project will be running on `http://localhost:1234`. The development server will watch for changes in the source files and automatically reload the page after compiling them.

## Working with mobile devices (Daydream)
To then work on a remote device, install Chrome Dev v75.0.3759.4 for Windows 10 (we're playing with cutting edge stuff) and open the inspect tab: `chrome://inspect`  
Configure the port forwarding by selecing the `Port forwarding...` button. Add the following ports (such as the default 8080):
 - `localhost:1234` for the http that forwards to localhost:1234 
 - `localhost:64320` which is how Parcel does it's live updating stuff
 
 In order for the port forwarding to work on your device, there are some settings you need to enable.
 
 *settings info here*
 
 Now, connect an Android device with Daydream support via a USB cable and install and open Chrome Dev on your device. There are a couple flags that need to be enabled. Go to `chrome://flags` and ensure the following flags are enabled:
 - WebXR Device API
 - WebXR Hit Test
 
Go to `localhost:1234`. Click the 'check it out' button and you're in! There should be an 'EnterVR' button in the top left of the screen. Click it to enter immersive VR mode.
 
## Working with HMDs (VIVE/Oculus)
In order to use an HMD (head mounted display), such as a VIVE or Oculus Rift, you first need to download Steam and SteamVR. Start up SteamVR and then open `localhost:1234` in your Chrome Dev browser. Ensure that the following flags are enabled by going to `chrome://flags` and enabling:
- WebXR Device API
- WebXR Hit Test
- OpenVR hardware support

At `localhost:1234` click 'check it out' to load the home room. There should be an 'EnterVR' button in the top left of the screen. Click it to enter immersive VR mode.

# How to use the experiments:
## The Falling Objects Scene
Once you enter the falling objects scene you should be able to see a table with a cube and a sphere on it.  Clicking either of these will generate a new object that you can interact with that falls from a chute in the ceiling.  The newly created objects can be thrown around and used to interact with the other objects in the scene.

## The Pendulum Scene
Once you enter the pendulum scene, you should see two pendulums on a table and a list of planet's on your left.  The lighter blue planet icon is the planet that you are currently on.  You can drag the pendulum's swings to start them swinging.  If you want to stop the pendulums swinging you can either switch planets or pickup the pendulum and then place it back on the table.

Once you've gained a feeling for how the pendulums swing on each planet, hit the quiz icon which will put a box around you so that you can't see what planet you're on.  Then you can play with the pendulums and when you're ready, click the icon that you think is the planet you are on.  The correct planet's icon will light up green and if you're guess was incorrect then it will be shown as red.

Once you're ready to go back to the other experiments, there should be a door on the opposite side of the platform that will take you back to the home room.

## The Planets Scene

## The Lasers Scene
Inside the laser room, there should be a wall with 4 large buttons on it. 3 of the buttons set the controls to a specific mode:
- CREATE: While in creation mode, you are not able to teleport, but will instead see an outline of a mirror where it would be placed if you selected the ground. Select the ground, and a mirror will be created in it's place. You can create as many mirrors as you would like while in this mode.

- SELECT: Selection mode allows the user to move mirrors via dragging them (holding the select button). Release the select button to place the mirror. Mirrors can also be rotated by dragging their base left or right.

- DELETE: Any mirror clicked on is this mode is deleted instantly, so be careful!

The final button, RESET, resets the entire scene, removing any placed mirrors and repositioning the goal.

The goal is the small box randomly placed in the scene. You're mission is to place and rotate mirrors in such a way to reflect the laser into the white cylinder on the goal. 

Finally, to exit the room, simply click on the door and you'll be transported back to the home room.
