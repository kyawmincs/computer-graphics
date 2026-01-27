/*
 * UBC CPSC 314 2025W2
 * Assignment 2 Template
 */

import { setup, loadGLTFAsync, loadOBJAsync } from './js/setup.js';
import * as THREE from './js/three.module.js';
import { SourceLoader } from './js/SourceLoader.js';
import { THREEx } from './js/KeyboardState.js';

// Setup and return the scene and related objects.
// You should look into js/setup.js to see what exactly is done here.
const {
  renderer,
  scene,
  camera,
  worldFrame,
} = setup();

// Used THREE.Clock for animation
var clock = new THREE.Clock();

/////////////////////////////////
//   YOUR WORK STARTS BELOW    //
/////////////////////////////////

// Initialize uniforms

// As in A1 we position the sphere in the world solely using this uniform
// So the initial y-offset being 1.0 here is intended.
const sphereOffset = { type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0) };

// The following constants are provided as reference values. Feel free to adjust them.
// Distance threshold beyond which the armadillo should shoot lasers at the sphere (needed for Part e).
const LaserDistance = 10.0;

// Distance threshold for waving frequency modulation (needed for Part b).
const waveDistance = 10.0;

// Base frequency of armadillo waving its hand (needed for Part b).
const waveFreqBase = 1.0;

// Sphere max size when hit by lasers (needed for Part f).
const sphereMaxSize = 5.0;

// Sphere growth speed (needed for Part f).
const sphereGrowSpeed = 3.5;

// Color transition speed (needed for Part f).
const colorSpeed = 0.8;

// Diffuse texture map (this defines the main colors of the boxing glove)
const gloveColorMap = new THREE.TextureLoader().load('images/boxing_gloves_texture.png');

const boxingGloveMaterial = new THREE.MeshStandardMaterial({
  map: gloveColorMap,
});

const eyeMaterial = new THREE.ShaderMaterial();

// TODO: Create a material for the laser (needed for Part e).
// You can use MeshStandardMaterial like the sphere, or a ShaderMaterial like the eyes.

// Load shaders.
const shaderFiles = [
  'glsl/eye.vs.glsl',
  'glsl/eye.fs.glsl',
];

new SourceLoader().load(shaderFiles, function (shaders) {
  eyeMaterial.vertexShader = shaders['glsl/eye.vs.glsl'];
  eyeMaterial.fragmentShader = shaders['glsl/eye.fs.glsl'];
});

// PART A & B ---------------------------------------------------------------------------------
// Load Armadillo Model in GLTF format and attach Boxing Gloves
//
// TODO: Load and place the Armadillo's geometry in GLB format.
//       First, fill in the loadGLTFAsync() function in js/setup.js.
//       Then, call loadGLTFAsync() here with a post-loading callback.
//
// TODO: Load the boxing gloves (obj/boxing_glove.obj) using loadOBJAsync().
//       Attach them to the appropriate wrist bones of the armadillo.
//
// HINT: Traverse the model to find THREE.SkinnedMesh and access its skeleton.
//       Relevant bone names: "Forearm_L", "Forearm_R", "Wrist_L", "Wrist_R"
// --------------------------------------------------------------------------------------------


// https://threejs.org/docs/#api/en/geometries/SphereGeometry
const sphereGeometry = new THREE.SphereGeometry(1.0, 32.0, 32.0);
const sphereMaterial = new THREE.MeshStandardMaterial({
  emissive: new THREE.Color(0xffff00),    // add self-emission (yellow)
  emissiveIntensity: 1.0
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const sphereLight = new THREE.PointLight(0xffffff, 50.0, 100);
scene.add(sphereLight);

// PART C -------------------------------------------------------------------------------------
// Create eye balls and place on the armadillo
//
// Create an eye ball (left eye provided as example)
// HINT: Create two eye ball meshes from the same geometry.
const eyeGeometry = new THREE.SphereGeometry(1.0, 32, 32);
const eyeScale = 0.5;

const leftEyeSocket = new THREE.Object3D();
const leftEyeSocketPos = new THREE.Vector3(0, 4.0, 0);  // TODO: Adjust position to place on armadillo's face
leftEyeSocket.position.copy(leftEyeSocketPos);

const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
leftEye.scale.copy(new THREE.Vector3(eyeScale, eyeScale, eyeScale));
leftEyeSocket.add(leftEye);

scene.add(leftEyeSocket);

// TODO: Create the right eye similarly and add it to the scene.
// --------------------------------------------------------------------------------------------


// PART D -------------------------------------------------------------------------------------
// Make the eyes look at the sphere
//
// TODO: Create a function to update eye orientations so they look at the sphere.
// HINT: THREE.Object3D has a lookAt() method.
// --------------------------------------------------------------------------------------------


// PART E -------------------------------------------------------------------------------------
// Create laser beams from eyes to sphere
//
// TODO: Create laser geometry and meshes. Attach them to the eyes.
// HINT: THREE.CylinderGeometry can be used for the laser beam shape.
// --------------------------------------------------------------------------------------------


// Listen to keyboard events.
const keyboard = new THREEx.KeyboardState();
function checkKeyboard() {
  if (keyboard.pressed("W"))
    sphereOffset.value.z -= 0.1;
  else if (keyboard.pressed("S"))
    sphereOffset.value.z += 0.1;

  if (keyboard.pressed("A"))
    sphereOffset.value.x -= 0.1;
  else if (keyboard.pressed("D"))
    sphereOffset.value.x += 0.1;

  if (keyboard.pressed("E"))
    sphereOffset.value.y -= 0.1;
  else if (keyboard.pressed("Q"))
    sphereOffset.value.y += 0.1;

  // TODO: Calculate distance from eyes to sphere for laser activation (Part e).

  // TODO: Update laser visibility and scale based on distance (Part e).

  // TODO: Update sphere size and color when hit by lasers (Part f).
  // HINT: Use THREE.Color.lerp() to interpolate between colors.

  // The following tells three.js that some uniforms might have changed.
  sphereMaterial.needsUpdate = true;
  eyeMaterial.needsUpdate = true;

  // TODO: Call your eye update function here to make eyes track the sphere (Part d).

  // Move the sphere light in the scene. This allows the floor to reflect the light as it moves.
  sphereLight.position.set(sphereOffset.value.x, sphereOffset.value.y, sphereOffset.value.z);
  sphere.position.set(sphereOffset.value.x, sphereOffset.value.y, sphereOffset.value.z);
}


// Setup update callback
function update() {
  checkKeyboard();

  // TODO: Implement armadillo hand waving animation (Part b).
  // HINT: Modify the rotation of the forearm bones using a periodic function.

  // Requests the next update call, this creates a loop
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

// Start the animation loop.
update();
