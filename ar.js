import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

import { GLTFLoader } from
  "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";


const params =
  new URLSearchParams(
    window.location.search
  );

const itemId =
  params.get("item");


const loading =
  document.getElementById("loading");

const unsupported =
  document.getElementById("unsupported");

const permission =
  document.getElementById("permission");

const startAR =
  document.getElementById("startAR");

const camera =
  document.getElementById("camera");

const canvas =
  document.getElementById("arCanvas");

const topbar =
  document.getElementById("topbar");

const instructions =
  document.getElementById("instructions");

const placeButton =
  document.getElementById("placeButton");

const placedControls =
  document.getElementById("placedControls");

const removeButton =
  document.getElementById("removeButton");

const doneButton =
  document.getElementById("doneButton");

const info =
  document.getElementById("info");

const foodName =
  document.getElementById("foodName");

const foodPrice =
  document.getElementById("foodPrice");

const foodTitle =
  document.getElementById("foodTitle");

const exitButton =
  document.getElementById("exitButton");


let item = null;

let cameraStream = null;

let scene;

let renderer;

let arCamera;

let model = null;

let reticle = null;

let hitTestSource = null;

let hitTestSourceRequested = false;

let xrSession = null;

let placed = false;

let mixer = null;

let clock = new THREE.Clock();


async function loadItem() {

  const response =
    await fetch("menu.json");

  if (!response.ok) {
    throw new Error(
      "Unable to load menu"
    );
  }

  const data =
    await response.json();

  for (
    const category
    of data.categories
  ) {

    const found =
      category.items.find(
        x => x.id === itemId
      );

    if (found) {

      item = found;

      break;

    }
  }

  if (!item) {

    throw new Error(
      "Food item not found"
    );

  }

  foodName.textContent =
    item.name;

  foodPrice.textContent =
    `${data.restaurant.currency}${item.price}`;

  foodTitle.textContent =
    `${data.restaurant.name} AR`;

}


function setupThree() {

  scene =
    new THREE.Scene();

  scene.background =
    null;


  arCamera =
    new THREE.PerspectiveCamera(
      70,
      window.innerWidth /
      window.innerHeight,
      0.01,
      20
    );


  renderer =
    new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.xr.enabled = true;


  const ambient =
    new THREE.HemisphereLight(
      0xffffff,
      0x444444,
      2.2
    );

  scene.add(ambient);


  const directional =
    new THREE.DirectionalLight(
      0xffffff,
      2.5
    );

  directional.position.set(
    2,
    4,
    2
  );

  scene.add(directional);


  reticle =
    new THREE.Mesh(

      new THREE.RingGeometry(
        0.08,
        0.1,
        32
      ),

      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: .9
      })

    );

  reticle.rotation.x =
    -Math.PI / 2;

  reticle.matrixAutoUpdate =
    false;

  reticle.visible =
    false;

  scene.add(reticle);


  renderer.setAnimationLoop(
    render
  );

}


async function loadModel() {

  const loader =
    new GLTFLoader();

  return new Promise(
    (resolve, reject) => {

      loader.load(

        item.model,

        gltf => {

          model =
            gltf.scene;

          model.visible =
            false;

          model.traverse(
            object => {

              if (
                object.isMesh
              ) {

                object.castShadow =
                  true;

                object.receiveShadow =
                  true;

              }

            }
          );


          const box =
            new THREE.Box3()
              .setFromObject(model);

          const size =
            box.getSize(
              new THREE.Vector3()
            );

          const maxSize =
            Math.max(
              size.x,
              size.y,
              size.z
            );

          if (maxSize > 0) {

            const desiredSize =
              0.35;

            const scale =
              desiredSize /
              maxSize;

            model.scale.setScalar(
              scale
            );

          }


          const scaledBox =
            new THREE.Box3()
              .setFromObject(model);

          model.position.y =
            -scaledBox.min.y;


          scene.add(model);

          if (
            gltf.animations &&
            gltf.animations.length
          ) {

            mixer =
              new THREE.AnimationMixer(
                model
              );

            gltf.animations.forEach(
              animation => {

                mixer
                  .clipAction(animation)
                  .play();

              }
            );

          }

          resolve();

        },

        undefined,

        error => {

          reject(error);

        }

      );

    }
  );

}


async function startCamera() {

  cameraStream =
    await navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: {
            ideal: "environment"
          },

          width: {
            ideal: 1920
          },

          height: {
            ideal: 1080
          }
        },

        audio: false
      });

  camera.srcObject =
    cameraStream;

  camera.style.display =
    "block";

  await camera.play();

}


async function startWebXR() {

  if (!navigator.xr) {

    throw new Error(
      "WebXR unavailable"
    );

  }


  const supported =
    await navigator.xr
      .isSessionSupported(
        "immersive-ar"
      );

  if (!supported) {

    throw new Error(
      "Immersive AR unsupported"
    );

  }


  xrSession =
    await navigator.xr.requestSession(
      "immersive-ar",
      {
        requiredFeatures: [
          "hit-test"
        ],

        optionalFeatures: [
          "dom-overlay"
        ],

        domOverlay: {
          root: document.body
        }
      }
    );


  renderer.xr.setReferenceSpaceType(
    "local-floor"
  );

  await renderer.xr.setSession(
    xrSession
  );


  xrSession.addEventListener(
    "end",
    () => {

      xrSession = null;

      resetAR();

    }
  );


  topbar.classList.remove(
    "hidden"
  );

  instructions.classList.remove(
    "hidden"
  );

  info.classList.remove(
    "hidden"
  );


  xrSession.requestReferenceSpace(
    "viewer"
  ).then(
    referenceSpace => {

      xrSession
        .requestHitTestSource({
          space: referenceSpace
        })
        .then(
          source => {

            hitTestSource =
              source;

          }
        );

    }
  );


  xrSession.addEventListener(
    "end",
    () => {

      hitTestSource = null;

      hitTestSourceRequested =
        false;

    }
  );


  loading.classList.add(
    "hidden"
  );

}


function render(
  timestamp,
  frame
) {

  if (
    !frame ||
    !xrSession
  ) {

    return;

  }


  const referenceSpace =
    renderer.xr
      .getReferenceSpace();


  const viewerPose =
    frame.getViewerPose(
      referenceSpace
    );


  if (!viewerPose) {

    return;

  }


  if (!hitTestSource) {

    return;

  }


  const hitTestResults =
    frame.getHitTestResults(
      hitTestSource
    );


  if (
    hitTestResults.length > 0
  ) {

    const hit =
      hitTestResults[0];

    const pose =
      hit.getPose(
        referenceSpace
      );

    if (pose) {

      reticle.visible =
        true;

      reticle.matrix.fromArray(
        pose.transform.matrix
      );

      if (!placed) {

        placeButton.classList.remove(
          "hidden"
        );

      }

    }

  } else {

    reticle.visible =
      false;

    placeButton.classList.add(
      "hidden"
    );

  }


  if (mixer) {

    mixer.update(
      clock.getDelta()
    );

  }


  renderer.render(
    scene,
    arCamera
  );

}


function placeModel() {

  if (
    !reticle.visible ||
    !model
  ) {

    return;

  }


  model.position.setFromMatrixPosition(
    reticle.matrix
  );

  model.quaternion.setFromRotationMatrix(
    reticle.matrix
  );


  model.visible =
    true;

  placed =
    true;


  placeButton.classList.add(
    "hidden"
  );

  instructions.classList.add(
    "hidden"
  );

  placedControls.classList.remove(
    "hidden"
  );

}


function removeModel() {

  if (!model) {
    return;
  }

  model.visible =
    false;

  placed =
    false;

  placedControls.classList.add(
    "hidden"
  );

  instructions.classList.remove(
    "hidden"
  );

}


function resetAR() {

  if (cameraStream) {

    cameraStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

    cameraStream = null;

  }

  camera.style.display =
    "none";

  loading.classList.remove(
    "hidden"
  );

}


async function beginAR() {

  try {

    permission.classList.add(
      "hidden"
    );

    loading.classList.remove(
      "hidden"
    );


    await loadItem();

    setupThree();

    await loadModel();


    /*
      WebXR immersive AR is the
      primary production path.
    */

    await startWebXR();

  } catch (error) {

    console.error(error);

    loading.classList.add(
      "hidden"
    );

    unsupported.classList.remove(
      "hidden"
    );

  }

}


placeButton.addEventListener(
  "click",
  placeModel
);


removeButton.addEventListener(
  "click",
  removeModel
);


doneButton.addEventListener(
  "click",
  () => {

    if (xrSession) {

      xrSession.end();

    } else {

      history.back();

    }

  }
);


exitButton.addEventListener(
  "click",
  () => {

    if (xrSession) {

      xrSession.end();

    } else {

      history.back();

    }

  }
);


startAR.addEventListener(
  "click",
  beginAR
);


async function initialize() {

  try {

    await loadItem();

    if (
      !window.isSecureContext
    ) {

      throw new Error(
        "HTTPS required"
      );

    }


    if (
      !navigator.xr
    ) {

      unsupported.classList.remove(
        "hidden"
      );

      return;

    }


    const supported =
      await navigator.xr
        .isSessionSupported(
          "immersive-ar"
        );

    if (!supported) {

      unsupported.classList.remove(
        "hidden"
      );

      return;

    }


    loading.classList.add(
      "hidden"
    );

    permission.classList.remove(
      "hidden"
    );

  } catch (error) {

    console.error(error);

    loading.classList.add(
      "hidden"
    );

    unsupported.classList.remove(
      "hidden"
    );

  }

}


initialize();
