/*
 * UBC CPSC 314, Vjan2026
 * Assignment 1 Template
 */

const {renderer, scene, camera, worldFrame} = setup();

// Initialize uniform
const orbPosition = {type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0)};
const orbBasePosition = new THREE.Vector3(0.0, 1.0, 0.0);
const orbRadius = {value: 1.5};
const gui = new lil.GUI({width: 700});

// Materials: specifying uniforms and shaders
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

loadAndPlaceOBJ('obj/armadillo.obj', armadilloMaterial, function (armadillo) {
  armadillo.position.set(0.0, 5.0, -8.0);
  armadillo.rotation.y = Math.PI;
  armadillo.scale.set(0.1, 0.1, 0.1);
  armadillo.parent = worldFrame;
  scene.add(armadillo);
});

// Create the sphere geometry
// https://threejs.org/docs/#api/en/geometries/SphereGeometry
// TODO: Make the radius of the orb a variable
const sphereGeometry = new THREE.SphereGeometry(1.0, 32.0, 32.0);
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0.0, 1.0, 0.0);
sphere.parent = worldFrame;
scene.add(sphere);

// Also add settings to change light settings
const sphereLight = new THREE.PointLight(0xffffff, 0.5, 100);
gui.add(sphereLight, 'intensity').min(0).max(3).step(0.001);
scene.add(sphereLight);

// Load grave texture and populate them
const graveGeometry = new THREE.BoxGeometry(3.2, 4.6, 1.4);
const textureLoader = new THREE.TextureLoader();
const graveColorTexture = textureLoader.load(
  './plastered_stone_wall_1k/plastered_stone_wall_diff_1k.jpg',
);
const graveARMTexture = textureLoader.load(
  './plastered_stone_wall_1k/plastered_stone_wall_arm_1k.jpg',
);
const graveNormalTexture = textureLoader.load(
  './plastered_stone_wall_1k/plastered_stone_wall_nor_gl_1k.jpg',
);

graveColorTexture.colorSpace = THREE.SRGBColorSpace;
graveColorTexture.repeat.set(0.3, 0.4);
graveARMTexture.repeat.set(0.3, 0.4);
graveNormalTexture.repeat.set(0.3, 0.4);

const graveMaterial = new THREE.MeshStandardMaterial({
  map: graveColorTexture,
  aoMap: graveARMTexture,
  roughnessMap: graveARMTexture,
  metalnessMap: graveARMTexture,
  normalMap: graveNormalTexture,
});

// Making group so I can make changes to all graves in one place
const graves = new THREE.Group();
scene.add(graves);

function digGrave() {
  const angle = Math.random() * Math.PI * 2;
  const radius = 20 + Math.random() * 15;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;

  const grave = new THREE.Mesh(graveGeometry, graveMaterial);

  grave.position.x = x;
  grave.position.y = Math.random() * 0.4 + 2;
  grave.position.z = z;

  grave.rotation.x = (Math.random() - 0.5) * 0.4;
  grave.rotation.y = (Math.random() - 0.5) * 0.4;
  grave.rotation.z = (Math.random() - 0.5) * 0.4;

  graves.add(grave);
}

// Populate the graves randomly
for (let i = 0; i < 40; i++) {
  digGrave();
}

// Definitely need some gloomy lights to make it scary
const ghost1 = new THREE.PointLight('#8800ff', 1);
const ghost2 = new THREE.PointLight('#ff0088', 2, 18, 1.5); // purple
const ghost3 = new THREE.PointLight('#ff0000', 2, 18, 1.5); // magenta
scene.add(ghost1, ghost2, ghost3);

// Listen to keyboard events.
const keyboard = new THREEx.KeyboardState();
const MOVE_UNIT = 0.2;
function checkKeyboard() {
  if (keyboard.pressed('W')) orbBasePosition.z -= MOVE_UNIT;
  else if (keyboard.pressed('S')) orbBasePosition.z += MOVE_UNIT;

  if (keyboard.pressed('A')) orbBasePosition.x -= MOVE_UNIT;
  else if (keyboard.pressed('D')) orbBasePosition.x += MOVE_UNIT;

  if (keyboard.pressed('E')) orbBasePosition.y -= MOVE_UNIT;
  else if (keyboard.pressed('Q')) orbBasePosition.y += MOVE_UNIT;

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

const clock = new THREE.Clock();

// Setup update callback
function update() {
  checkKeyboard();

  // Disco ghost lights
  const elapsedTime = clock.getElapsedTime();
  const ghost1Angle = elapsedTime * 0.5;
  ghost1.position.x = Math.cos(ghost1Angle) * 15;
  ghost1.position.z = Math.sin(ghost1Angle) * 15;
  ghost1.position.y =
    Math.sin(ghost1Angle) *
    Math.sin(ghost1Angle * 2.34) *
    Math.sin(ghost1Angle * 3.45);
  const ghost2Angle = -elapsedTime * 0.2;
  ghost2.position.x = Math.cos(ghost2Angle) * 15;
  ghost2.position.z = Math.sin(ghost2Angle) * 15;
  ghost2.position.y =
    Math.sin(ghost2Angle) *
    Math.sin(ghost2Angle * 2.34) *
    Math.sin(ghost2Angle * 3.45);
  const ghost3Angle = elapsedTime * 0.5;
  ghost3.position.x = Math.cos(ghost3Angle) * 15;
  ghost3.position.z = Math.sin(ghost3Angle) * 15;
  ghost3.position.y =
    Math.sin(ghost3Angle) *
    Math.sin(ghost3Angle * 2.34) *
    Math.sin(ghost3Angle * 3.45);

  // Make demo easier with spinning lighting
  sphere.position.y = Math.cos(elapsedTime);
  sphere.position.x = Math.sin(elapsedTime);

  // Readjust the sphere based on keyboard inputs + add oscillations
  orbPosition.value.x = orbBasePosition.x + Math.sin(elapsedTime);
  orbPosition.value.y = orbBasePosition.y + Math.cos(elapsedTime);
  orbPosition.value.z = orbBasePosition.z + Math.sin(elapsedTime);

  // Requests the next update call, this creates a loop
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

// Start the animation loop.
update();
