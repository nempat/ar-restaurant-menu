import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const $ = id => document.getElementById(id);
const canvas = $("gl"), video = $("cam"), startBox = $("start");

// --- three.js scene (transparent canvas on top of the camera video)
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(2, 4, 3);
scene.add(sun);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
camera.position.set(0, 0.6, 3.2);
camera.lookAt(0, 0, 0);
const pivot = new THREE.Group();
pivot.position.y = -0.2;
scene.add(pivot);

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

// --- load the dish chosen in the URL (ar.html?id=avocado-bowl)
const id = new URLSearchParams(location.search).get("id");
fetch("menu.json")
  .then(r => r.json())
  .then(menu => {
    const item = menu.items.find(i => i.id === id) || menu.items[0];
    $("dish").textContent = item.name;
    new GLTFLoader().load(
      item.model,
      gltf => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const s = 1.6 / Math.max(size.x, size.y, size.z); // fit any model to the same size
        model.scale.setScalar(s);
        model.position.sub(center.multiplyScalar(s));
        pivot.add(model);
      },
      undefined,
      () => { $("dish").textContent = "Could not load the 3D model"; }
    );
  })
  .catch(() => { $("dish").textContent = "Could not load menu.json"; });

// --- camera
$("go").onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
  } catch (e) {
    alert("Camera is blocked, so you will see the 3D dish without the camera. Allow camera access in your browser settings to use AR.");
  }
  startBox.style.display = "none";
};
addEventListener("pagehide", () => {
  if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
});

// --- touch: one finger turns, two fingers resize
const pts = new Map();
let lastDist = 0, auto = true;
const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
canvas.addEventListener("pointerdown", e => {
  canvas.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  auto = false;
  if (pts.size === 2) lastDist = dist();
});
canvas.addEventListener("pointermove", e => {
  const p = pts.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (pts.size === 1) {
    pivot.rotation.y += dx * 0.01;
    pivot.rotation.x = THREE.MathUtils.clamp(pivot.rotation.x + dy * 0.01, -1, 1);
  } else if (pts.size === 2) {
    const d = dist();
    pivot.scale.setScalar(THREE.MathUtils.clamp(pivot.scale.x * d / lastDist, 0.4, 3));
    lastDist = d;
  }
});
["pointerup", "pointercancel"].forEach(t => canvas.addEventListener(t, e => pts.delete(e.pointerId)));

renderer.setAnimationLoop(() => {
  if (auto) pivot.rotation.y += 0.006;
  renderer.render(scene, camera);
});
