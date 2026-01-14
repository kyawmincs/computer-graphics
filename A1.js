/*
 * UBC CPSC 314, Vjan2026
 * Assignment 1 Template
 */

// Setup and return the scene and related objects.
// You should look into js/setup.js to see what exactly is done here.
const {renderer, scene, camera, worldFrame} = setup();

// Initialize uniform
const orbPosition = {type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0)};
// TODO: Create uniform variable for the radius of the orb and pass it into the shaders,
// you will need them in the latter part of the assignment
const orbRadius = {value: 1};

// Materials: specifying uniforms and shaders
// Diffuse texture map (this defines the main colors of the boxing glove)
const gloveColorMap = new THREE.TextureLoader().load(
  'images/boxing_gloves_texture.png',
);
const boxingGloveMaterial = new THREE.MeshStandardMaterial({
  map: gloveColorMap,
});
const armadilloMaterial = new THREE.ShaderMaterial({
  uniforms: {
    orbPosition: orbPosition,
    orbRadius: orbRadius,
  },
});
const sphereMaterial = new THREE.ShaderMaterial({
  uniforms: {
    orbPosition: orbPosition,
  },
});

// Load shaders.
const shaderFiles = [
  'glsl/armadillo.vs.glsl',
  'glsl/armadillo.fs.glsl',
  'glsl/sphere.vs.glsl',
  'glsl/sphere.fs.glsl',
];

new THREE.SourceLoader().load(shaderFiles, function (shaders) {
  armadilloMaterial.vertexShader = shaders['glsl/armadillo.vs.glsl'];
  armadilloMaterial.fragmentShader = shaders['glsl/armadillo.fs.glsl'];

  sphereMaterial.vertexShader = shaders['glsl/sphere.vs.glsl'];
  sphereMaterial.fragmentShader = shaders['glsl/sphere.fs.glsl'];
});

// Load and place the Armadillo geometry
// Look at the definition of loadOBJ to familiarize yourself with how each parameter
// affects the loaded object.
loadAndPlaceOBJ('obj/armadillo.obj', armadilloMaterial, function (armadillo) {
  armadillo.position.set(0.0, 5.0, -8.0);
  armadillo.rotation.y = Math.PI;
  armadillo.scale.set(0.1, 0.1, 0.1);
  armadillo.parent = worldFrame;
  scene.add(armadillo);
});

// TODO: Add the boxing glove to the scene on top of the Armadillo similar to how the Armadillo
// is added to the scene
loadAndPlaceOBJ(
  'obj/boxing_glove.obj',
  boxingGloveMaterial,
  function (right_glove) {
    right_glove.position.set(5.5, 11.4, -4.6);
    right_glove.rotation.x = -0.4;
    right_glove.rotation.y = Math.PI - 1.4;
    right_glove.rotation.z = -13 * (Math.PI / 180);
    right_glove.scale.set(1.45, 1.45, 1.45);
    right_glove.parent = worldFrame;
    scene.add(right_glove);
  },
);

loadAndPlaceOBJ(
  'obj/boxing_glove.obj',
  boxingGloveMaterial,
  function (left_glove) {
    left_glove.position.set(-5.5, 12.0, -5.0);
    left_glove.rotation.x = -0.4;
    left_glove.rotation.y = 1.4;
    left_glove.rotation.z = -14 * (Math.PI / 180);
    left_glove.scale.set(1.45, 1.45, 1.45);
    left_glove.parent = worldFrame;
    scene.add(left_glove);
  },
);

// Create the sphere geometry
// https://threejs.org/docs/#api/en/geometries/SphereGeometry
// TODO: Make the radius of the orb a variable
const sphereGeometry = new THREE.SphereGeometry(1.0, 32.0, 32.0);
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0.0, 1.0, 0.0);
sphere.parent = worldFrame;
scene.add(sphere);

const sphereLight = new THREE.PointLight(0xffffff, 1, 100);
scene.add(sphereLight);

// Listen to keyboard events.
const keyboard = new THREEx.KeyboardState();
const MOVE_UNIT = 0.2;
function checkKeyboard() {
  if (keyboard.pressed('W')) orbPosition.value.z -= MOVE_UNIT;
  else if (keyboard.pressed('S')) orbPosition.value.z += MOVE_UNIT;

  if (keyboard.pressed('A')) orbPosition.value.x -= MOVE_UNIT;
  else if (keyboard.pressed('D')) orbPosition.value.x += MOVE_UNIT;

  if (keyboard.pressed('E')) orbPosition.value.y -= MOVE_UNIT;
  else if (keyboard.pressed('Q')) orbPosition.value.y += MOVE_UNITww;

  // The following tells three.js that some uniforms might have changed
  armadilloMaterial.needsUpdate = true;
  sphereMaterial.needsUpdate = true;

  // Move the sphere light in the scene. This allows the floor to reflect the light as it moves.
  sphereLight.position.set(
    orbPosition.value.x,
    orbPosition.value.y,
    orbPosition.value.z,
  );
}

// Setup update callback
function update() {
  checkKeyboard();

  // Requests the next update call, this creates a loop
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

// Start the animation loop.
update();
