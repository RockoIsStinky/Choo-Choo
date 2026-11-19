import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const pxWidth = 280;
const pxHeight = 210;

const editor = new THREE.Scene();
const camPiv = new THREE.Object3D();
const camera = new THREE.PerspectiveCamera(40, pxWidth / pxHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  antialias: false,
});

const composer = new EffectComposer(renderer);
composer.setPixelRatio(2);
composer.setSize(pxWidth, pxHeight);
const renderPass = new RenderPass(editor, camera);
composer.addPass(renderPass);

const bloomity = new UnrealBloomPass(
  new THREE.Vector2(pxWidth, pxHeight),
  0.01,
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

editor.background = new THREE.Color(0x161513);
editor.fog = new THREE.FogExp2(0x161513, 0.025);

const ambientLight = new THREE.AmbientLight(0xd3d4f0, 10);
editor.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xf5eed3, 36.0);
dirLight.position.set(2, 12, 4);
editor.add(dirLight);

const rimLight = new THREE.DirectionalLight(0xc1c3e3, 3.0);
rimLight.position.set(-6, 3, -8);
editor.add(rimLight);

const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0x151517,
  roughness: 0.15,
  metalness: 0.35,
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
    console.error("Failed to load OBJ:", error);
  },
);

camera.position.z = 15;
camera.position.y = 1;

function animate() {
  camPiv.rotation.y += 0.01;
  composer.render();
}

renderer.setAnimationLoop(animate);
