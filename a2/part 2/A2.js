/*
 * UBC CPSC 314 2025W2
 * Assignment 2 Template
 */

import {setup, loadGLTFAsync} from './js/setup.js';
import * as THREE from './js/three.module.js';

// Setup and return the scene and related objects.
const {renderer, scene, camera} = setup();

// Global clock for animation timing.
const clock = new THREE.Clock();

// ── Armadillo loading ─────────────────────────────────────────────────────────
let wristL, wristR, forearmL, forearmR, upperArmL, upperArmR;
let shoulderL, shoulderR, torsoBone, hipBone, hip2Bone, headBone;
let armadilloMesh;
const armadilloBaseY = 3.6;

loadGLTFAsync(['glb/armadillo.glb'], models => {
  const armadillo = models[0].scene;
  armadillo.scale.setScalar(0.07);
  armadillo.position.set(0.4, armadilloBaseY, -6);
  armadillo.rotation.y = Math.PI;
  armadilloMesh = armadillo;

  // Robustly map bones even if exact names differ between rigs
  const allBoneNames = [];
  armadillo.traverse(child => {
    if (!child.isBone) return;
    allBoneNames.push(child.name);

    // Cache each bone's rest/local rotation so we can
    // always return to the original pose without stretching.
    if (!child.userData.baseRotation) {
      child.userData.baseRotation = child.rotation.clone();
    }

    const name = child.name;
    const lower = name.toLowerCase();

    const isLeft =
      /\bleft\b/.test(lower) || /\bl\b/.test(lower) || /_l\b/.test(lower);
    const isRight =
      /\bright\b/.test(lower) || /\br\b/.test(lower) || /_r\b/.test(lower);

    if (!hip2Bone && (lower === 'hip2' || lower.includes('hip2'))) {
      hip2Bone = child;
    } else if (
      !hipBone &&
      (lower.includes('hip') || lower.includes('pelvis'))
    ) {
      hipBone = child;
    }
    if (
      !torsoBone &&
      (lower.includes('torso') ||
        lower.includes('spine') ||
        lower.includes('chest'))
    ) {
      torsoBone = child;
    }
    if (!headBone && (lower.includes('head') || lower.includes('neck'))) {
      headBone = child;
    }

    if (isLeft) {
      if (!wristL && (lower.includes('wrist') || lower.includes('hand'))) {
        wristL = child;
      } else if (
        !forearmL &&
        (lower.includes('forearm') ||
          lower.includes('lowerarm') ||
          lower.includes('lower arm'))
      ) {
        forearmL = child;
      } else if (!upperArmL && lower.includes('arm')) {
        upperArmL = child;
      } else if (!shoulderL && lower.includes('shoulder')) {
        shoulderL = child;
      }
    }

    if (isRight) {
      if (!wristR && (lower.includes('wrist') || lower.includes('hand'))) {
        wristR = child;
      } else if (
        !forearmR &&
        (lower.includes('forearm') ||
          lower.includes('lowerarm') ||
          lower.includes('lower arm'))
      ) {
        forearmR = child;
      } else if (!upperArmR && lower.includes('arm')) {
        upperArmR = child;
      } else if (!shoulderR && lower.includes('shoulder')) {
        shoulderR = child;
      }
    }
  });

  scene.add(armadillo);
});

// ── Disco lights / balls ─────────────────────────────────────────────────────
const discoRig = new THREE.Object3D();
discoRig.position.set(0, 15, -6);
scene.add(discoRig);

const discoLights = [];
const discoLightBasePositions = [];
const numDiscoLights = 6;
for (let i = 0; i < numDiscoLights; i++) {
  const light = new THREE.PointLight(0xffffff, 25, 30);
  // Scatter lights randomly in a loose sphere around the armadillo
  // so they aren't all directly overhead.
  const angle = Math.random() * Math.PI * 2;
  const radius = 4 + Math.random() * 5; // between 4 and 9 units from center
  const height = -3 + Math.random() * 6; // small vertical variation
  const x = Math.cos(angle) * radius;
  const y = height;
  const z = Math.sin(angle) * radius;
  light.position.set(x, y, z);
  discoRig.add(light);
  discoLights.push(light);
  discoLightBasePositions.push(new THREE.Vector3(x, y, z));
}

// Simple reflective disco balls that orbit above the armadillo.
const discoBallGeometry = new THREE.SphereGeometry(1.2, 32, 32);
const discoBallMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.9,
  roughness: 0.25,
});
const discoBalls = [];
const numDiscoBalls = 1;
const discoBallBasePos = new THREE.Vector3(0, -2, 0);
for (let i = 0; i < numDiscoBalls; i++) {
  const ball = new THREE.Mesh(discoBallGeometry, discoBallMaterial.clone());
  ball.position.copy(discoBallBasePos);
  discoRig.add(ball);
  discoBalls.push(ball);
}

// Simple keyboard handler for moving the main disco ball with WASD/QE.
const keyState = {};
window.addEventListener('keydown', event => {
  keyState[event.key.toLowerCase()] = true;
});
window.addEventListener('keyup', event => {
  keyState[event.key.toLowerCase()] = false;
});

function updateDiscoBallKeyboard(delta) {
  if (!discoBalls.length) return;
  const speed = 4.0;
  const step = speed * delta;

  // WASD: move in XZ plane
  if (keyState['w']) discoBallBasePos.z -= step;
  if (keyState['s']) discoBallBasePos.z += step;
  if (keyState['a']) discoBallBasePos.x -= step;
  if (keyState['d']) discoBallBasePos.x += step;

  // Q/E: vertical (Q up, E down)
  if (keyState['q']) discoBallBasePos.y += step;
  if (keyState['e']) discoBallBasePos.y -= step;
}

function updateDisco(elapsed) {
  // Keep the rig fixed in place; lights themselves jitter a bit so they
  // feel lively but don't orbit in a perfect circle.
  discoRig.rotation.y = 0;
  const bass = audioReady ? bandEnergy(0, 4) : 0;
  const mid = audioReady ? bandEnergy(4, 16) : 0;
  const pulse = audioReady ? 0.5 + bass * 2.5 : 1.0;
  for (let i = 0; i < discoLights.length; i++) {
    const light = discoLights[i];
    const hue = (elapsed * 0.25 + i / discoLights.length) % 1.0;
    const sizeFactor = 1.0 + bass * 1.5;
    light.color.setHSL(hue, 1.0, 0.5);
    light.intensity = 25 * pulse * sizeFactor;
    light.distance = 30 * sizeFactor; // perceived "size" grows/shrinks with the beat

    // Slight random-looking wobble around each light's base position.
    const basePos = discoLightBasePositions[i];
    const wobbleRadius = 0.5 + mid * 0.8;
    light.position.x = basePos.x + Math.sin(elapsed * 1.3 + i) * wobbleRadius;
    light.position.y =
      basePos.y + Math.sin(elapsed * 1.7 + i * 0.7) * (0.3 + bass * 0.6);
    light.position.z =
      basePos.z + Math.cos(elapsed * 1.1 + i * 0.4) * wobbleRadius;
  }

  // Make the disco balls softly change color and scale with the music.
  for (let i = 0; i < discoBalls.length; i++) {
    const ball = discoBalls[i];
    const hue = (elapsed * 0.15 + i / discoBalls.length + mid * 0.5) % 1.0;
    const sat = 0.6 + mid * 0.4;
    const lightness = 0.4 + bass * 0.3;
    ball.material.color.setHSL(hue, sat, lightness);

    const scale = 1.0 + bass * 0.3;
    ball.scale.setScalar(scale);

    // Gentle individual spin and vertical bob so they feel alive.
    ball.rotation.y = elapsed * 1.5 + i * 0.8;
    ball.position.copy(discoBallBasePos);
    ball.position.y +=
      Math.sin(elapsed * 2.0 + i * 0.7) * (0.3 + bass * 0.5);
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

let bassSmooth = 0;

function updateDance(elapsed) {
  if (!audioReady) return;

  // fftSize=512 → 256 bins; bin width ≈ 86 Hz @ 44100 Hz sample rate
  const bass = bandEnergy(0, 4); // ~0–344 Hz  – kick drum

  // Smooth bass so motion feels stable, not jittery.
  const smooth = 0.8;
  bassSmooth = bassSmooth * smooth + bass * (1 - smooth);

  // Restore all bones to their original (rest) pose so we
  // don't accumulate weird stretching from previous frames.
  if (hipBone && hipBone.userData.baseRotation) {
    hipBone.rotation.copy(hipBone.userData.baseRotation);
  }
  if (hip2Bone && hip2Bone.userData.baseRotation) {
    hip2Bone.rotation.copy(hip2Bone.userData.baseRotation);
  }
  if (torsoBone && torsoBone.userData.baseRotation) {
    torsoBone.rotation.copy(torsoBone.userData.baseRotation);
  }
  if (shoulderL && shoulderL.userData.baseRotation) {
    shoulderL.rotation.copy(shoulderL.userData.baseRotation);
  }
  if (shoulderR && shoulderR.userData.baseRotation) {
    shoulderR.rotation.copy(shoulderR.userData.baseRotation);
  }
  if (upperArmL && upperArmL.userData.baseRotation) {
    upperArmL.rotation.copy(upperArmL.userData.baseRotation);
  }
  if (upperArmR && upperArmR.userData.baseRotation) {
    upperArmR.rotation.copy(upperArmR.userData.baseRotation);
  }
  if (forearmL && forearmL.userData.baseRotation) {
    forearmL.rotation.copy(forearmL.userData.baseRotation);
  }
  if (forearmR && forearmR.userData.baseRotation) {
    forearmR.rotation.copy(forearmR.userData.baseRotation);
  }
  if (wristL && wristL.userData.baseRotation) {
    wristL.rotation.copy(wristL.userData.baseRotation);
  }
  if (wristR && wristR.userData.baseRotation) {
    wristR.rotation.copy(wristR.userData.baseRotation);
  }

  // Whole-body bounce driven by bass (smooth) — up/down only, gently.
  if (armadilloMesh) {
    const bounceAmp = 0.08 + bassSmooth * 0.25;
    armadilloMesh.position.y =
      armadilloBaseY + Math.sin(elapsed * 2.0) * bounceAmp;
  }

  // Arms: small alternating swing to the beat (left/right opposite for natural gait).
  if (upperArmL && upperArmR) {
    const armFreq = 1.8 + bassSmooth * 1.2;
    const swing = Math.sin(elapsed * armFreq) * (0.08 + bassSmooth * 0.12);
    upperArmL.rotation.y += swing;
    upperArmR.rotation.y -= swing;
  }

  // Forearms: subtle follow-through, opposite to upper arm for fluid chain.
  if (forearmL && forearmR) {
    const forearmFreq = 1.8 + bassSmooth * 1.2;
    const follow =
      Math.sin(elapsed * forearmFreq + 0.3) * (0.04 + bassSmooth * 0.06);
    forearmL.rotation.y += follow;
    forearmR.rotation.y -= follow;
  }

  // Feet tap: subtle alternating hip rotation (armadillo has no foot bones; Hip2 suggests lower body).
  if (hip2Bone) {
    const tapFreq = 1.8 + bassSmooth * 1.2;
    const tap = Math.sin(elapsed * tapFreq) * (0.04 + bassSmooth * 0.06);
    hip2Bone.rotation.z += tap;
  }

  // Head: simple nodding to the beat, on top of rest pose (damped).
  if (headBone && headBone.userData.baseRotation) {
    headBone.rotation.copy(headBone.userData.baseRotation);
    const nod = Math.sin(elapsed * (1.7 + bassSmooth * 1.2));
    headBone.rotation.x += nod * (0.12 + bassSmooth * 0.25);
  }
}

// Button wires into the AudioContext (must start from a user gesture)
document.getElementById('music-btn').addEventListener('click', async () => {
  document.getElementById('music-btn').style.display = 'none';
  await setupAudio('audio/alorDance.mp3');
});

// Frame loop
function update() {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  // Handle keyboard-driven disco ball movement.
  updateDiscoBallKeyboard(delta);

  // Read fresh frequency data once per frame so both disco and dance see it.
  if (audioReady) audioAnalyser.getByteFrequencyData(freqData);

  updateDisco(elapsed);

  // Only dance when music is playing; otherwise the armadillo stays in rest pose.
  if (audioReady) {
    updateDance(elapsed);
  }

  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

update();
