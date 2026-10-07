import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

import { GLTFLoader } from
  "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";


const loading =
  document.getElementById("loading");

const ready =
  document.getElementById("ready");

const errorScreen =
  document.getElementById("error");

const errorText =
  document.getElementById("errorText");

const startAR =
  document.getElementById("startAR");

const canvas =
  document.getElementById("arCanvas");

const topbar =
  document.getElementById("topbar");

const foodTitle =
  document.getElementById("foodTitle");

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

const exitButton =
  document.getElementById("exitButton");

const info =
  document.getElementById("info");

const foodName =
  document.getElementById("foodName");

const foodPrice =
  document.getElementById("foodPrice");


let scene;
let camera;
let renderer;

let model = null;
let reticle = null;

let xrSession = null;
let hitTestSource = null;

let hitTestSourceRequested = false;

let modelPlaced = false;

let item = {
  id: "pizza",
  name: "Classic Pizza",
  price: 299,
  model: "assets/models/pizza.glb"
};


function showLoading(text) {

  loading.classList.remove("hidden");

  ready.classList.add("hidden");

  errorScreen.classList.add("hidden");

  loading.querySelector("h2").textContent =
    text;

}


function showReady() {

  loading.classList.add("hidden");

  errorScreen.classList.add("hidden");

  ready.classList.remove("hidden");

}


function showError(message) {

  console.error(
    "NEMPAT AR ERROR:",
    message
  );

  loading.classList.add("hidden");

  ready.classList.add("hidden");

  errorScreen.classList.remove("hidden");

  errorText.textContent =
    message;
}


function setupScene() {

  scene =
    new THREE.Scene();


  camera =
    new THREE.PerspectiveCamera(
      70,
      window.innerWidth /
        window.innerHeight,
      0.01,
      100
    );


  renderer =
    new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference:
        "high-performance"
    });


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      2
    )
  );


  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );


  renderer.xr.enabled = true;


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  const light =
    new THREE.HemisphereLight(
      0xffffff,
      0x555555,
      2.5
    );


  scene.add(light);


  const directional =
    new THREE.DirectionalLight(
      0xffffff,
      2
    );


  directional.position.set(
    2,
    4,
    2
  );


  scene.add(
    directional
  );


  createReticle();


  renderer.setAnimationLoop(
    render
  );


  window.addEventListener(
    "resize",
    resize
  );

}


function createReticle() {

  const geometry =
    new THREE.RingGeometry(
      0.07,
      0.085,
      32
    );


  const material =
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });


  reticle =
    new THREE.Mesh(
      geometry,
      material
    );


  reticle.rotation.x =
    -Math.PI / 2;


  reticle.matrixAutoUpdate =
    false;


  reticle.visible =
    false;


  scene.add(
    reticle
  );

}


async function loadModel() {

  return new Promise(
    (resolve, reject) => {

      const loader =
        new GLTFLoader();


      loader.load(

        item.model,

        (gltf) => {

          model =
            gltf.scene;


          model.visible =
            false;


          model.traverse(
            (object) => {

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
              .setFromObject(
                model
              );


          const size =
            box.getSize(
              new THREE.Vector3()
            );


          const largest =
            Math.max(
              size.x,
              size.y,
              size.z
            );


          const desired =
            0.35;


          if (
            largest > 0
          ) {

            const scale =
              desired /
              largest;

            model.scale.setScalar(
              scale
            );

          }


          const scaledBox =
            new THREE.Box3()
              .setFromObject(
                model
              );


          model.position.y =
            -scaledBox.min.y;


          scene.add(
            model
          );


          resolve();

        },

        undefined,

        (error) => {

          console.error(
            "MODEL ERROR:",
            error
          );

          reject(
            new Error(
              "Pizza 3D model could not be loaded."
            )
          );

        }

      );

    }
  );

}


async function checkAR() {

  if (
    !window.isSecureContext
  ) {

    throw new Error(
      "AR requires a secure HTTPS connection."
    );

  }


  if (
    !navigator.xr
  ) {

    throw new Error(
      "WebXR is not available in this browser. Use a supported Android browser."
    );

  }


  let supported;


  try {

    supported =
      await navigator.xr
        .isSessionSupported(
          "immersive-ar"
        );

  } catch (error) {

    console.error(
      error
    );

    throw new Error(
      "This browser could not check AR support."
    );

  }


  if (!supported) {

    throw new Error(
      "Markerless browser AR is not supported on this device/browser."
    );

  }

}


async function startXR() {

  showLoading(
    "Starting camera AR..."
  );


  xrSession =
    await navigator.xr.requestSession(
      "immersive-ar",
      {
        requiredFeatures: [
          "hit-test"
        ],

        optionalFeatures: [
          "local-floor"
        ]
      }
    );


  xrSession.addEventListener(
    "end",
    sessionEnded
  );


  await renderer.xr.setSession(
    xrSession
  );


  const viewerSpace =
    await xrSession.requestReferenceSpace(
      "viewer"
    );


  hitTestSource =
    await xrSession.requestHitTestSource({
      space: viewerSpace
    });


  hitTestSourceRequested =
    true;


  loading.classList.add(
    "hidden"
  );


  ready.classList.add(
    "hidden"
  );


  errorScreen.classList.add(
    "hidden"
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


  foodName.textContent =
    item.name;


  foodPrice.textContent =
    "₹" + item.price;


  foodTitle.textContent =
    "NEMPAT AR";


  console.log(
    "NEMPAT AR SESSION STARTED"
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

    renderer.render(
      scene,
      camera
    );

    return;

  }


  const referenceSpace =
    renderer.xr.getReferenceSpace();


  if (
    !referenceSpace ||
    !hitTestSource
  ) {

    renderer.render(
      scene,
      camera
    );

    return;

  }


  const results =
    frame.getHitTestResults(
      hitTestSource
    );


  if (
    results.length > 0
  ) {

    const hit =
      results[0];


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


      if (
        !modelPlaced
      ) {

        placeButton.classList.remove(
          "hidden"
        );

      }

    }

  } else {

    reticle.visible =
      false;


    if (
      !modelPlaced
    ) {

      placeButton.classList.add(
        "hidden"
      );

    }

  }


  renderer.render(
    scene,
    camera
  );

}


function placeModel() {

  if (
    !reticle.visible ||
    !model
  ) {

    return;

  }


  const position =
    new THREE.Vector3();


  position.setFromMatrixPosition(
    reticle.matrix
  );


  model.position.copy(
    position
  );


  model.rotation.set(
    0,
    0,
    0
  );


  model.visible =
    true;


  modelPlaced =
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


  console.log(
    "PIZZA PLACED"
  );

}


function removeModel() {

  if (
    !model
  ) {

    return;

  }


  model.visible =
    false;


  modelPlaced =
    false;


  placedControls.classList.add(
    "hidden"
  );


  instructions.classList.remove(
    "hidden"
  );


  if (
    reticle.visible
  ) {

    placeButton.classList.remove(
      "hidden"
    );

  }

}


async function exitAR() {

  if (
    xrSession
  ) {

    try {

      await xrSession.end();

    } catch (error) {

      console.error(
        error
      );

    }

  } else {

    history.back();

  }

}


function sessionEnded() {

  xrSession =
    null;


  hitTestSource =
    null;


  hitTestSourceRequested =
    false;


  modelPlaced =
    false;


  if (
    model
  ) {

    model.visible =
      false;

  }


  if (
    reticle
  ) {

    reticle.visible =
      false;

  }


  placeButton.classList.add(
    "hidden"
  );


  placedControls.classList.add(
    "hidden"
  );


  instructions.classList.add(
    "hidden"
  );


  topbar.classList.add(
    "hidden"
  );


  info.classList.add(
    "hidden"
  );


  showReady();

}


function resize() {

  if (
    !renderer ||
    !camera
  ) {

    return;

  }


  camera.aspect =
    window.innerWidth /
    window.innerHeight;


  camera.updateProjectionMatrix();


  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

}


startAR.addEventListener(
  "click",
  async () => {

    try {

      showLoading(
        "Checking AR support..."
      );


      await checkAR();


      showLoading(
        "Loading pizza..."
      );


      await loadModel();


      await startXR();

    } catch (error) {

      console.error(
        "AR START ERROR:",
        error
      );


      showError(
        error.message ||
        "Unable to start AR."
      );

    }

  }
);


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
  exitAR
);


exitButton.addEventListener(
  "click",
  exitAR
);


async function initialize() {

  try {

    console.log(
      "NEMPAT AR v30 LOADING"
    );


    setupScene();


    showLoading(
      "Loading NEMPAT AR..."
    );


    await loadModel();


    showReady();


    console.log(
      "NEMPAT AR v30 READY"
    );

  } catch (error) {

    console.error(
      "INITIALIZATION ERROR:",
      error
    );


    showError(
      error.message ||
      "AR initialization failed."
    );

  }

}


initialize();
