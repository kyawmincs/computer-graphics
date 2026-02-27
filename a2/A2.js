/*
 * UBC CPSC 314 2025W2
 * Assignment 2 Template
 */

import {setup, loadGLTFAsync, loadOBJAsync} from './js/setup.js';
import * as THREE from './js/three.module.js';
import {SourceLoader} from './js/SourceLoader.js';
import {THREEx} from './js/KeyboardState.js';

// Setup and return the scene and related objects.
// You should look into js/setup.js to see what exactly is done here.
const {renderer, scene, camera, worldFrame} = setup();

// Used THREE.Clock for animation
var clock = new THREE.Clock();

/////////////////////////////////
//   YOUR WORK STARTS BELOW    //
/////////////////////////////////

// Initialize uniforms

// As in A1 we position the sphere in the world solely using this uniform
// So the initial y-offset being 1.0 here is intended.
const sphereOffset = {type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0)};

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
const gloveColorMap = new THREE.TextureLoader().load(
  'images/boxing_gloves_texture.png',
);

const boxingGloveMaterial = new THREE.MeshStandardMaterial({
  map: gloveColorMap,
});

const eyeMaterial = new THREE.ShaderMaterial();

// TODO: Create a material for the laser (needed for Part e).
// You can use MeshStandardMaterial like the sphere, or a ShaderMaterial like the eyes.

// Load shaders.
const shaderFiles = ['glsl/eye.vs.glsl', 'glsl/eye.fs.glsl'];

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
  emissive: new THREE.Color(0xffff00), // add self-emission (yellow)
  emissiveIntensity: 1.0,
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const sphereLight = new THREE.PointLight(0xffffff, 50.0, 100);
scene.add(sphereLight);

let wristL, wristR, forearmL, forearmR;

loadGLTFAsync(['glb/armadillo.glb'], models => {
  const armadillo = models[0].scene;
  armadillo.scale.setScalar(0.07);
  armadillo.position.set(0.4, 3.6, -6);
  armadillo.rotation.y = Math.PI;

  const boneMap = {
    Wrist_L: null,
    Wrist_R: null,
    Forearm_L: null,
    Forearm_R: null,
  };
  armadillo.traverse(child => {
    if (child.isBone && child.name in boneMap) {
      boneMap[child.name] = child;
    }
  });

  wristL = boneMap.Wrist_L;
  wristR = boneMap.Wrist_R;
  forearmL = boneMap.Forearm_L;
  forearmR = boneMap.Forearm_R;

  scene.add(armadillo);

  // Load and attach boxing gloves
  loadOBJAsync(['obj/boxing_glove.obj'], function (gloveModels) {
    const leftGlove = gloveModels[0];
    const rightGlove = leftGlove.clone();

    function setupGlove(glove, bone, rotation) {
      glove.traverse(child => {
        if (child.isMesh) child.material = boxingGloveMaterial;
      });
      glove.scale.setScalar(1.2);
      glove.rotation.set(...rotation);
      bone.add(glove);
    }

    setupGlove(leftGlove, wristL, [2.3, 3, 0.5]);
    setupGlove(rightGlove, wristR, [3.5, 0.5, 0]);
  });
});

const eyeGeometry = new THREE.SphereGeometry(1.0, 32, 32);
const eyeScale = 0.4;

function createEye(position) {
  const socket = new THREE.Object3D();
  socket.position.copy(position);
  const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  eye.scale.setScalar(eyeScale);
  socket.add(eye);
  scene.add(socket);
  return socket;
}

const leftEyeSocket = createEye(new THREE.Vector3(-0.2, 8.6, -3.8));
const rightEyeSocket = createEye(new THREE.Vector3(1, 8.6, -3.8));
function updateEyes() {
  const spherePos = new THREE.Vector3(
    sphereOffset.value.x,
    sphereOffset.value.y,
    sphereOffset.value.z,
  );
  leftEyeSocket.lookAt(spherePos);
  rightEyeSocket.lookAt(spherePos);
}

// PART E -------------------------------------------------------------------------------------
// Create laser beams from eyes to sphere
//
// TODO: Create laser geometry and meshes. Attach them to the eyes.
// HINT: THREE.CylinderGeometry can be used for the laser beam shape.
// --------------------------------------------------------------------------------------------

// Listen to keyboard events.
const keyboard = new THREEx.KeyboardState();
function checkKeyboard() {
  if (keyboard.pressed('W')) sphereOffset.value.z -= 0.1;
  else if (keyboard.pressed('S')) sphereOffset.value.z += 0.1;

  if (keyboard.pressed('A')) sphereOffset.value.x -= 0.1;
  else if (keyboard.pressed('D')) sphereOffset.value.x += 0.1;

  if (keyboard.pressed('E')) sphereOffset.value.y -= 0.1;
  else if (keyboard.pressed('Q')) sphereOffset.value.y += 0.1;

  // TODO: Calculate distance from eyes to sphere for laser activation (Part e).

  // TODO: Update laser visibility and scale based on distance (Part e).

  // TODO: Update sphere size and color when hit by lasers (Part f).
  // HINT: Use THREE.Color.lerp() to interpolate between colors.

  // The following tells three.js that some uniforms might have changed.
  sphereMaterial.needsUpdate = true;
  eyeMaterial.needsUpdate = true;

  updateEyes();

  // Move the sphere light in the scene. This allows the floor to reflect the light as it moves.
  sphereLight.position.set(
    sphereOffset.value.x,
    sphereOffset.value.y,
    sphereOffset.value.z,
  );
  sphere.position.set(
    sphereOffset.value.x,
    sphereOffset.value.y,
    sphereOffset.value.z,
  );
}

function waveHands() {
  if (!forearmL || !forearmR) return;

  const t = clock.getElapsedTime();
  const armPos = new THREE.Vector3(0.4, 0, -6);
  const spherePos = new THREE.Vector3(
    sphereOffset.value.x,
    0, // ignore Y like the demo
    sphereOffset.value.z,
  );

  const dist = armPos.distanceTo(spherePos);

  const closeness = Math.max(0, (waveDistance - dist) / waveDistance);
  const freq = waveFreqBase + closeness * 15.0;

  const angle = Math.sin(t * freq) * 0.8;
  forearmL.rotation.y = angle;
  forearmR.rotation.y = -angle;
}

// Setup update callback
function update() {
  checkKeyboard();

  waveHands();

  // Requests the next update call, this creates a loop
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

// Start the animation loop.
update();
