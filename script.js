import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import { ThreeMFLoader } from "three/examples/jsm/Addons.js";

let isMouseDown = false;
let isDragging = false;

let lastX = 0;
let lastY = 0;
let rotY = 0;
let rotX = 0;
let currVelY = 0;
let currMouseX = 0;
let currMouseY = 0;
let deltaX = 0;
let deltaY = 0;
let targetRotY = 0;

let lastMoveTime = 0;

const mouse = new THREE.Vector2();

const pxWidth = 280;
const pxHeight = 210;
const aspect = pxWidth / pxHeight;

let size = 5;

const editor = new THREE.Scene();
const camPiv = new THREE.Object3D();
const camera = new THREE.OrthographicCamera(
  -size * aspect,
  size * aspect,
  size,
  -size,
  10,
  35,
);
const renderer = new THREE.WebGLRenderer({
  antialias: false,
});

editor.background = new THREE.Color(0x336021);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(2);
composer.setSize(pxWidth, pxHeight);
const renderPass = new RenderPass(editor, camera);
composer.addPass(renderPass);
const gtaoPass = new GTAOPass(editor, camera, pxWidth, pxHeight);
gtaoPass.blendIntensity = 0.45;

gtaoPass.updateGtaoMaterial({
  radius: 2.5,
  distanceExponent: 1.2,
  thickness: 2,
  scale: 0.5,
  samples: 32,
});

gtaoPass.updatePdMaterial({
  radius: 2,
  rings: 2,
  samples: 8,
});

composer.addPass(gtaoPass);

const bloomity = new UnrealBloomPass(
  new THREE.Vector2(pxWidth, pxHeight),
  0.005,
  0.1,
  0.2,
);

composer.addPass(bloomity);

const outputPass = new OutputPass();
composer.addPass(outputPass);

camPiv.add(camera);

editor.add(camPiv);

renderer.setSize(pxWidth, pxHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x9a9e85, 1.4);
editor.add(ambientLight);

const rectLight = new THREE.RectAreaLight(0xb2c797, 6.5, 5, 5);
rectLight.position.set(5, 10, -5);
rectLight.lookAt(0, 0, 0);
editor.add(rectLight);

const rimLight = new THREE.DirectionalLight(0xdf7717, 3.0);
rimLight.position.set(-6, 3, -8);
editor.add(rimLight);

const backLight = new THREE.RectAreaLight(0xbabfb4, 15, 10, 2);
backLight.position.set(-5, 6, 3);
backLight.lookAt(0, 0, 0);
editor.add(backLight);

const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.12,
  metalness: 0.6,
});

const loader = new OBJLoader();
loader.load(
  "AssetsNFonts/Body/Cylindrical.obj",
  (object) => {
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = bodyMaterial;
      }
    });
    object.scale.set(1, 1, 1);
    object.position.set(0, 0, 0);
    editor.add(object);
  },
  undefined,
  (error) => {
    console.error("objfailed lol:", error);
  },
);

camera.position.z = 20;
camera.position.y = 5;
camera.lookAt(0, 2, 0);
targetRotY = Math.PI / 5.4;

function animate() {
  if (isMouseDown) {
    currVelY += (rotY - currVelY) * 0.21;
  } else {
    currVelY *= 0.95;
  }

  targetRotY += currVelY * (1 / 60);

  const diffX = Math.atan2(
    Math.sin(targetRotY - camPiv.rotation.y),
    Math.cos(targetRotY - camPiv.rotation.y),
  );

  camPiv.rotation.y += diffX * 0.3;

  composer.render();
}

renderer.setAnimationLoop(animate);

function updateMouseVector(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

function getCoordinates(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

const editorRender = document.querySelector("canvas");

editorRender.addEventListener("mousedown", (e) => {
  editorRender.style.cursor = "grabbing";
  isMouseDown = true;
  lastX = e.clientX;
  lastMoveTime = performance.now();
});
editorRender.addEventListener("mousemove", (e) => {
  if (!isMouseDown) return;

  const now = performance.now();
  const coords = getCoordinates(e);

  currMouseX = coords.x;
  currMouseY = coords.y;

  deltaX = currMouseX - lastX;
  deltaY = currMouseY - lastY;

  const moveDt = Math.max((now - lastMoveTime) / 1000, 0.001);

  rotY = -(deltaX * 0.01) / moveDt;

  if (Math.abs(deltaX) > 0) {
    isDragging = true;
  }

  lastX = currMouseX;
  lastY = currMouseY;
  lastMoveTime = now;
});
window.addEventListener("mouseup", () => {
  editorRender.style.cursor = "grab";
  isMouseDown = false;
  isDragging = false;
  rotY = 0;
  rotX = 0;
});
window.addEventListener("mouseout", () => {
  editorRender.style.cursor = "grab";
  isMouseDown = false;
  isDragging = false;
  rotY = 0;
  rotX = 0;
});
