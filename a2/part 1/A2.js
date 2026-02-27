/*
 * UBC CPSC 314 2025W2
 * Assignment 2 Template
 */

import {setup, loadGLTFAsync, loadOBJAsync} from './js/setup.js';
import * as THREE from './js/three.module.js';
import {SourceLoader} from './js/SourceLoader.js';
import {THREEx} from './js/KeyboardState.js';

// Setup and return the scene and related objects.
const {renderer, scene, camera, worldFrame} = setup();

// Used THREE.Clock for animation
const clock = new THREE.Clock();

// Initialize uniforms
const sphereOffset = {type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0)};

// Reference constants
const LaserDistance = 10.0;
const waveDistance = 10.0;
const waveFreqBase = 1.0;
const sphereMaxSize = 5.0;
const sphereGrowSpeed = 3.5;
const colorSpeed = 0.8;

const gloveColorMap = new THREE.TextureLoader().load(
  'images/boxing_gloves_texture.png',
);
const boxingGloveMaterial = new THREE.MeshStandardMaterial({
  map: gloveColorMap,
});

const eyeMaterial = new THREE.ShaderMaterial();

// Laser material
const laserMaterial = new THREE.MeshBasicMaterial({
  color: 0xff3300,
  transparent: true,
  opacity: 0.85,
});

// Load shaders
const shaderFiles = ['glsl/eye.vs.glsl', 'glsl/eye.fs.glsl'];
new SourceLoader().load(shaderFiles, function (shaders) {
  eyeMaterial.vertexShader = shaders['glsl/eye.vs.glsl'];
  eyeMaterial.fragmentShader = shaders['glsl/eye.fs.glsl'];
});

const sphereGeometry = new THREE.SphereGeometry(1.0, 32.0, 32.0);
const sphereMaterial = new THREE.MeshStandardMaterial({
  emissive: new THREE.Color(0xffff00),
  emissiveIntensity: 1.0,
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const sphereLight = new THREE.PointLight(0xffffff, 50.0, 100);
scene.add(sphereLight);

let sphereScale = 1.0;
let colorT = 0.0;
const sphereBaseColor = new THREE.Color(0xffff00);
const sphereHitColor = new THREE.Color(0xff2200);

// Armadillo loading
let wristL, wristR, forearmL, forearmR;
let armadilloPos;

loadGLTFAsync(['glb/armadillo.glb'], models => {
  const armadillo = models[0].scene;
  armadillo.scale.setScalar(0.07);
  armadillo.position.set(0.4, 3.6, -6);
  armadillo.rotation.y = Math.PI;
  armadilloPos = armadillo.position;

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

  // Load glove once and clone for the other hand
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
  leftEyeSocket.lookAt(sphereOffset.value);
  rightEyeSocket.lookAt(sphereOffset.value);
}

// Laser beams
const laserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
const leftLaser = new THREE.Mesh(laserGeometry, laserMaterial);
const rightLaser = new THREE.Mesh(laserGeometry, laserMaterial);
leftLaser.visible = false;
rightLaser.visible = false;
scene.add(leftLaser);
scene.add(rightLaser);

const _leftEyePos = new THREE.Vector3();
const _rightEyePos = new THREE.Vector3();
const _laserDir = new THREE.Vector3();
const _laserMid = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

function updateLaser(laserMesh, from, to) {
  _laserDir.subVectors(to, from);
  const dist = _laserDir.length();

  _laserMid.addVectors(from, to).multiplyScalar(0.5);
  laserMesh.position.copy(_laserMid);

  laserMesh.scale.set(1, dist, 1);

  _laserDir.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(_up, _laserDir);
  laserMesh.setRotationFromQuaternion(q);
}

function updateLasers() {
  leftEyeSocket.getWorldPosition(_leftEyePos);
  rightEyeSocket.getWorldPosition(_rightEyePos);

  const leftDist = _leftEyePos.distanceTo(sphereOffset.value);
  const rightDist = _rightEyePos.distanceTo(sphereOffset.value);

  leftLaser.visible = leftDist <= LaserDistance;
  rightLaser.visible = rightDist <= LaserDistance;

  if (leftLaser.visible)
    updateLaser(leftLaser, _leftEyePos, sphereOffset.value);
  if (rightLaser.visible)
    updateLaser(rightLaser, _rightEyePos, sphereOffset.value);
}

// Sphere growth + color
function updateSphere(delta) {
  const lasersActive = leftLaser.visible || rightLaser.visible;

  if (lasersActive) {
    sphereScale = Math.min(
      sphereMaxSize,
      sphereScale + sphereGrowSpeed * delta,
    );
    colorT = Math.min(1.0, colorT + colorSpeed * delta);
  } else {
    sphereScale = Math.max(1.0, sphereScale - sphereGrowSpeed * delta);
    colorT = Math.max(0.0, colorT - colorSpeed * delta);
  }

  sphere.scale.setScalar(sphereScale);
  sphereMaterial.emissive = sphereBaseColor
    .clone()
    .lerp(sphereHitColor, colorT);
}

// Hand waving
function waveHands(elapsed) {
  if (!forearmL || !forearmR) return;

  const dx = sphereOffset.value.x - (armadilloPos ? armadilloPos.x : 0);
  const dz = sphereOffset.value.z - (armadilloPos ? armadilloPos.z : 0);
  const dist = Math.sqrt(dx * dx + dz * dz);

  const closeness = Math.max(0, (waveDistance - dist) / waveDistance);
  const freq = waveFreqBase + closeness * 15.0;

  const angle = Math.sin(elapsed * freq) * 0.8;
  forearmL.rotation.y = angle;
  forearmR.rotation.y = -angle;
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

  // Sync sphere mesh and light with offset
  sphere.position.copy(sphereOffset.value);
  sphereLight.position.copy(sphereOffset.value);
}

// Frame loop
function update() {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  checkKeyboard();
  updateEyes();
  updateLasers();
  updateSphere(delta);
  waveHands(elapsed);

  sphereMaterial.needsUpdate = true;
  eyeMaterial.needsUpdate = true;

  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

update();
