import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { MindARThree } from "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

const container = document.querySelector("#ar-container");

const mindarThree = new MindARThree({
    container: container,
    imageTargetSrc: "./assets/targets/targets.mind"
});

const { renderer, scene, camera } = mindarThree;

const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
scene.add(light);

const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);

const material = new THREE.MeshStandardMaterial({
    color: 0xff5533
});

const cube = new THREE.Mesh(geometry, material);

const anchor = mindarThree.addAnchor(0);
anchor.group.add(cube);

mindarThree.start();

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});
