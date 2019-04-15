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

## Working with remote devices
To then work on a remote device, install Chrome Canary (we're playing with cutting edge stuff) and open the inspect tab: chrome://inspect  Configure the port forwarding.  It should have a port (such as 8080) for the http that forwards to localhost:1234 and another one from 64320 to localhost:64320 which is how Parcel does it's live updating stuff.

# How to use the experiments:
## The Falling Objects Scene
Once you enter the falling objects scene you should be able to see a table with a cube and a sphere on it.  Clicking either of these will generate a new object that you can interact with that falls from a chute in the ceiling.  The newly created objects can be thrown around and used to interact with the other objects in the scene.

## The Pendulum Scene
Once you enter the pendulum scene, you should see two pendulums on a table and a list of planet's on your left.  The lighter blue planet icon is the planet that you are currently on.  You can drag the pendulum's swings to start them swinging.  If you want to stop the pendulums swinging you can either switch planets or pickup the pendulum and then place it back on the table.

Once you've gained a feeling for how the pendulums swing on each planet, hit the quiz icon which will put a box around you so that you can't see what planet you're on.  Then you can play with the pendulums and when you're ready, click the icon that you think is the planet you are on.  The correct planet's icon will light up green and if you're guess was incorrect then it will be shown as red.

Once you're ready to go back to the other experiments, there should be a door on the oposite side of the platform that will take you back to the home room.

## The Planets Scene

## The Lasers Scene