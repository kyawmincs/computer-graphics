/*
 * UBC CPSC 314 2025W2
 * Assignment 2 Template
 */

import {setup, loadGLTFAsync} from './js/setup.js';
import * as THREE from './js/three.module.js';
import {SourceLoader} from './js/SourceLoader.js';
import {THREEx} from './js/KeyboardState.js';

// Setup and return the scene and related objects.
const {renderer, scene, camera} = setup();

// Used THREE.Clock for animation
const clock = new THREE.Clock();

// Initialize uniforms
const sphereOffset = {type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0)};

// Reference constants
const waveDistance = 10.0;
const waveFreqBase = 1.0;


const eyeMaterial = new THREE.ShaderMaterial();


// Load shaders
const shaderFiles = ['glsl/eye.vs.glsl', 'glsl/eye.fs.glsl'];
new SourceLoader().load(shaderFiles, function (shaders) {
  eyeMaterial.vertexShader = shaders['glsl/eye.vs.glsl'];
  eyeMaterial.fragmentShader = shaders['glsl/eye.fs.glsl'];
  eyeMaterial.needsUpdate = true; // trigger compile once after load
});


// Armadillo loading
let wristL, wristR, forearmL, forearmR, upperArmL, upperArmR;
let shoulderL, shoulderR, torsoBone, hipBone, headBone;
let armadilloPos;
let armadilloMesh;
const armadilloBaseY = 3.6;

loadGLTFAsync(['glb/armadillo.glb'], models => {
  const armadillo = models[0].scene;
  armadillo.scale.setScalar(0.07);
  armadillo.position.set(0.4, armadilloBaseY, -6);
  armadillo.rotation.y = Math.PI;
  armadilloPos = armadillo.position;
  armadilloMesh = armadillo;

  const boneMap = {
    'Wrist L': null, 'Wrist R': null,
    'Forearm L': null, 'Forearm R': null,
    'Arm L': null, 'Arm R': null,
    'Shoulder L': null, 'Shoulder R': null,
    'Torso': null, 'Hip': null, 'Neck': null,
  };
  armadillo.traverse(child => {
    if (child.name in boneMap) {
      boneMap[child.name] = child;
    }
  });
  wristL    = boneMap['Wrist L'];
  wristR    = boneMap['Wrist R'];
  forearmL  = boneMap['Forearm L'];
  forearmR  = boneMap['Forearm R'];
  upperArmL = boneMap['Arm L'];
  upperArmR = boneMap['Arm R'];
  shoulderL = boneMap['Shoulder L'];
  shoulderR = boneMap['Shoulder R'];
  torsoBone = boneMap['Torso'];
  hipBone   = boneMap['Hip'];
  headBone  = boneMap['Neck'];

  console.log('[bones]', {wristL, wristR, forearmL, forearmR, upperArmL, upperArmR, shoulderL, shoulderR, torsoBone, hipBone, headBone});
  console.log('[all bone names]', [...new Set([].concat(...[armadillo].map(r => { const ns=[]; r.traverse(c => { if(c.isBone) ns.push(c.name); }); return ns; })))]);

  scene.add(armadillo);
});

// Making eyeballs
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

// Eye tracking
function updateEyes() {
  leftEyeSocket.lookAt(camera.position);
  rightEyeSocket.lookAt(camera.position);
}


// ── Disco lights ──────────────────────────────────────────────────────────────
const discoRig = new THREE.Object3D();
discoRig.position.set(0, 15, -6);
scene.add(discoRig);

const discoLights = [];
const numDiscoLights = 6;
for (let i = 0; i < numDiscoLights; i++) {
  const light = new THREE.PointLight(0xffffff, 25, 30);
  const angle = (i / numDiscoLights) * Math.PI * 2;
  light.position.set(Math.cos(angle) * 7, 0, Math.sin(angle) * 7);
  discoRig.add(light);
  discoLights.push(light);
}

function updateDisco(elapsed) {
  discoRig.rotation.y = elapsed * 1.2;
  const pulse = audioReady ? 0.5 + bandEnergy(0, 4) * 2.5 : 1.0;
  for (let i = 0; i < discoLights.length; i++) {
    const hue = (elapsed * 0.25 + i / discoLights.length) % 1.0;
    discoLights[i].color.setHSL(hue, 1.0, 0.5);
    discoLights[i].intensity = 25 * pulse;
  }
}

// ── Web Audio / Dance ─────────────────────────────────────────────────────────
let audioAnalyser = null;
let freqData = null;
let audioReady = false;

async function setupAudio(url) {
  const ctx = new AudioContext();
  audioAnalyser = ctx.createAnalyser();
  audioAnalyser.fftSize = 512;
  audioAnalyser.smoothingTimeConstant = 0.82;

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = true;
  source.connect(audioAnalyser);
  audioAnalyser.connect(ctx.destination);
  source.start(0);

  freqData = new Uint8Array(audioAnalyser.frequencyBinCount);
  audioReady = true;
}

function bandEnergy(lo, hi) {
  let sum = 0;
  for (let i = lo; i < hi; i++) sum += freqData[i];
  return sum / ((hi - lo) * 255); // normalised 0–1
}

function updateDance(elapsed) {
  if (!audioReady) return;

  // fftSize=512 → 256 bins; bin width ≈ 86 Hz @ 44100 Hz sample rate
  const bass = bandEnergy(0, 4);   // ~0–344 Hz  – kick drum
  const mid  = bandEnergy(4, 16);  // ~344–1378 Hz – snare / melody
  const high = bandEnergy(16, 48); // ~1378–4134 Hz – hi-hat / brightness

  // Whole-body bounce driven by bass
  if (armadilloMesh) {
    armadilloMesh.position.y = armadilloBaseY + bass * 0.8;
  }

  // Hip sway: rocks side-to-side on the beat
  if (hipBone) {
    hipBone.rotation.z = Math.sin(bass * Math.PI * 2) * 0.4;
    hipBone.rotation.y = bass * 0.25;
  }

  // Torso counter-sway + twist to mids
  if (torsoBone) {
    torsoBone.rotation.z = -Math.sin(bass * Math.PI * 2) * 0.25;
    torsoBone.rotation.y = Math.sin(mid * Math.PI) * 0.35;
  }

  // Shoulder shimmy: alternating shrug driven by mids
  if (shoulderL && shoulderR) {
    shoulderL.rotation.x = -mid * 0.9;
    shoulderR.rotation.x =  mid * 0.9;
    shoulderL.rotation.z =  Math.sin(mid * Math.PI) * 0.45;
    shoulderR.rotation.z = -Math.sin(mid * Math.PI) * 0.45;
  }

  // Upper arms: alternating swing on Y, hard direction flip every 3 seconds
  if (upperArmL && upperArmR) {
    const armFreq = 2.0 + bass * 6.0 + mid * 3.0;
    const dirSign = Math.floor(elapsed / 3) % 2 === 0 ? 1 : -1;
    const armSwing = Math.sin(elapsed * armFreq) * 0.9 * dirSign;
    upperArmL.rotation.y =  armSwing;
    upperArmR.rotation.y = -armSwing;
  }

  // Forearm pump driven by mids
  if (forearmL && forearmR) {
    forearmL.rotation.x =  mid * 1.4;
    forearmR.rotation.x =  mid * 1.4;
    forearmL.rotation.y =  mid * 0.6;
    forearmR.rotation.y = -mid * 0.6;
  }

  // Wrist flick driven by highs
  if (wristL && wristR) {
    wristL.rotation.z =  high * 1.0;
    wristR.rotation.z = -high * 1.0;
    wristL.rotation.x =  high * 0.5;
    wristR.rotation.x =  high * 0.5;
  }

  // Head: nod (x), side-tilt (z), turn (y) — all driven by independent time waves + beat
  if (headBone) {
    headBone.rotation.x = -bass * 0.5  + Math.sin(elapsed * 1.7) * 0.12;
    headBone.rotation.z =  mid  * 0.25 + Math.sin(elapsed * 2.3) * 0.18;
    headBone.rotation.y =  bass * 0.2  + Math.cos(elapsed * 1.3) * 0.14;
  }
}

// Button wires into the AudioContext (must start from a user gesture)
document.getElementById('music-btn').addEventListener('click', async () => {
  document.getElementById('music-btn').style.display = 'none';
  await setupAudio('audio/alorDance.mp3');
});

// Idle animation baseline (always runs; updateDance overrides when music is active)
function waveHands(elapsed) {
  if (!forearmL || !forearmR) return;

  const dx = sphereOffset.value.x - (armadilloPos ? armadilloPos.x : 0);
  const dz = sphereOffset.value.z - (armadilloPos ? armadilloPos.z : 0);
  const dist = Math.sqrt(dx * dx + dz * dz);

  const closeness = Math.max(0, (waveDistance - dist) / waveDistance);
  const freq = waveFreqBase + closeness * 15.0;

  const wave = Math.sin(elapsed * freq);
  forearmL.rotation.y =  wave * 0.8;
  forearmR.rotation.y = -wave * 0.8;

  if (torsoBone)  torsoBone.rotation.z  = Math.sin(elapsed * 0.7) * 0.06;
  if (hipBone)    hipBone.rotation.z    = Math.sin(elapsed * 0.7 + 0.4) * 0.06;
  if (shoulderL)  shoulderL.rotation.z  =  Math.sin(elapsed * 1.1) * 0.12;
  if (shoulderR)  shoulderR.rotation.z  = -Math.sin(elapsed * 1.1) * 0.12;
  if (headBone)   headBone.rotation.x   = Math.sin(elapsed * 1.2) * 0.12;
}

// Keyboard mapping
const keyboard = new THREEx.KeyboardState();

function checkKeyboard() {
  if (keyboard.pressed('W')) sphereOffset.value.z -= 0.1;
  else if (keyboard.pressed('S')) sphereOffset.value.z += 0.1;

  if (keyboard.pressed('A')) sphereOffset.value.x -= 0.1;
  else if (keyboard.pressed('D')) sphereOffset.value.x += 0.1;

  if (keyboard.pressed('E')) sphereOffset.value.y -= 0.1;
  else if (keyboard.pressed('Q')) sphereOffset.value.y += 0.1;

}

// Frame loop
function update() {
  clock.getDelta();
  const elapsed = clock.elapsedTime;

  // Read fresh frequency data once per frame so both disco and dance see it
  if (audioReady) audioAnalyser.getByteFrequencyData(freqData);

  checkKeyboard();
  updateEyes();
  updateDisco(elapsed);
  waveHands(elapsed);
  updateDance(elapsed);

  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

update();
