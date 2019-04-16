# Web XR Physics
The WebXR API is a brand new spec that gives developers the ability to create VR and AR experiences that run natively in the browser. Our physics demo uses this API to create an immersive experience that students can use to learn physics fundamentals.

This is an OSU Senior Capstone project for group 47. The goal is to demonstrate the abilities of the WebXR API by creating a sample project that can be referenced by others later. The project is sponsored by Intel. 

## Building and running the project
- Ensure the latest versions of [Node.js and Node Package Manager (npm)](https://nodejs.org/en/download/) are installed on your machine, and are accessible from the terminal. 

- After cloning the project, open up the root project repo and install the dependencies using
  ```
  $ npm i
  ```
- Start the development server using 
  ```
  $ npm run dev
  ```
- The project will be running on [`http://localhost:1234`](http://localhost:1234). The development server will watch for changes in the source files and automatically reload the page after compiling them.

## Working with mobile devices (Daydream)
Install [Chrome Dev](https://www.google.com/chrome/dev/). We tested using Chrome 75.0.3759.4, but later versions should work as well. 

Open the inspect tab: [`chrome://inspect`](chrome://inspect)  
Configure the port forwarding by selecing the `Port forwarding...` button. Add the following ports (such as the default 8080):
 - `localhost:1234` for the http that forwards to localhost:1234 
 - `localhost:64320` which is how Parcel does it's live updating stuff
 
 Be sure to check the `Enable port forwarding` box at the bottom of the `Port forwarding...` modal.
 
 In order for the port forwarding to work on your device, there are some settings you need to enable.
 
 Please follow the instructions [`at this site`](https://www.embarcadero.com/starthere/xe5/mobdevsetup/android/en/enabling_usb_debugging_on_an_android_device.html) to enable USB debugging on your android device.
 
 Now, connect an Android device with Daydream support via a USB cable and install and open Chrome Dev on your device. There are a couple flags that need to be enabled. Go to `chrome://flags` and ensure the following flags are enabled:
 - WebXR Device API
 - WebXR Hit Test
 
Go to `localhost:1234`. Click the 'check it out' button and you're in! There should be an 'EnterVR' button in the top left of the screen. Click it to enter immersive VR mode.
 
## Working with HMDs (VIVE/Oculus)
*Currrently, there are some issues with using/setting up HMDs. We met with our client in person on April 5th and he was able to get it working on his VIVE. However, we are unable to manage to get it working with the steps he provided us (down below). At the moment it appears to be an issue with the WebXR API itself. For now, we recommend only testing using a Daydream device, although feel free to attempt to get it working using the instructions given.*

In order to use an HMD (head mounted display), such as a VIVE or Oculus Rift, you first need to download Steam and SteamVR. Assuming you have connected your device, start up SteamVR and then open `localhost:1234` in your Chrome Dev browser. Ensure that the following flags are enabled by going to `chrome://flags` and enabling:
- WebXR Device API
- WebXR Hit Test
- WebXR orientation sensor device
- OpenVR hardware support

At `localhost:1234` click 'check it out' to load the home room. There should be an 'EnterVR' button in the top left of the screen. Click it to enter immersive VR mode.

## Scene not loading?
For unknown reasons, the scene you are trying to enter may not load the first time you try to enter it. If you observe a blank screen when entering a room, all you have to do is back navigate to the previous room/page then try again.

# How to use the experiments:
## Movement
To move around a scene (except the planets scene) in magic window sessions, drag the small circle in the bottom left portion of the screen. In immersive sessions, you can move about the scene by selecting a point on the floor to teleport instantaneously to that spot.

## The Home Scene
This room can be accessed by selecting `Check it out!` on the landing page. In this room you will find four doors. Each are labled with their respective scene. Selecting a door (either through touch or VR controller) will navigate you to the scene behind the door.

## The Kinematic Sandbox Scene
Within the kinematic sandbox scene you should be able to see a table with a cube and a sphere on it.  Clicking either of these will generate a new object that you can interact with that falls from a chute in the ceiling.  The newly created objects can be grabbed with your laser, thrown around and used to interact with the other objects in the scene. Beyond the table is a pair of two buttons that enable and disable earth gravity. Selecting the ON button sets the gravity in the scene to 9.8 m/s while selecting the OFF button sets the gravity in the scene to 0.0 m/s.

## The Pendulum Scene
Once you enter the pendulum scene, you should see two pendulums on a table and a list of planet's on your left.  The lighter blue planet icon is the planet that you are currently on.  You can drag the pendulum's swings to start them swinging.  If you want to stop the pendulums swinging you can either switch planets or pickup the pendulum and then place it back on the table.

Once you've gained a feeling for how the pendulums swing on each planet, hit the quiz icon which will put a box around you so that you can't see what planet you're on.  Then you can play with the pendulums and when you're ready, click the icon that you think is the planet you are on.  The correct planet's icon will light up green and if you're guess was incorrect then it will be shown as red.

Once you're ready to go back to the other experiments, there should be a door on the opposite side of the platform that will take you back to the home room.

## The Planets Scene
Upon entering the solar system simulation, you should see the sun, along with some information about it. You can explore the planets in the solar system either by clicking the "Next Planet" and "Previous Planet" buttons, or by clicking on another planet.

You can exit the simulation by returning to the Sun and clicking "Exit to Home".

## The Lasers Scene
Inside the laser room, there should be a wall with 4 large buttons on it. 3 of the buttons set the controls to a specific mode:
- CREATE: While in creation mode, you are not able to teleport, but will instead see an outline of a mirror where it would be placed if you selected the ground. Select the ground, and a mirror will be created in it's place. You can create as many mirrors as you would like while in this mode.

- SELECT: Selection mode allows the user to move mirrors via dragging them (holding the select button). Release the select button to place the mirror. Mirrors can also be rotated by dragging their base left or right.

- DELETE: Any mirror clicked on is this mode is deleted instantly, so be careful!

The final button, RESET, resets the entire scene, removing any placed mirrors and repositioning the goal.

The goal is the small box randomly placed in the scene. You're mission is to place and rotate mirrors in such a way to reflect the laser into the white cylinder on the goal. 

Finally, to exit the room, simply click on the door and you'll be transported back to the home room.
