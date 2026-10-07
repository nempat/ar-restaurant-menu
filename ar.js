```javascript
/*
=========================================================
 NEMPAT AR MENU
 Android Chrome + WebXR
 Markerless surface detection
=========================================================
*/

import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

import { GLTFLoader } from
  "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";


// =======================================================
// BASIC ELEMENTS
// =======================================================

const loading =
  document.getElementById("loading");

const unsupported =
  document.getElementById("unsupported");

const permission =
  document.getElementById("permission");

const startARButton =
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

const info =
  document.getElementById("info");

const foodName =
  document.getElementById("foodName");

const foodPrice =
  document.getElementById("foodPrice");

const exitButton =
  document.getElementById("exitButton");

const backUnsupported =
  document.getElementById(
    "backUnsupported"
  );


// =======================================================
// URL
// =======================================================

const params =
  new URLSearchParams(
    window.location.search
  );

const itemId =
  params.get("item") || "pizza";


// =======================================================
// STATE
// =======================================================

let item = null;

let restaurant = null;

let scene = null;

let renderer = null;

let camera = null;

let model = null;

let reticle = null;

let xrSession = null;

let hitTestSource = null;

let hitTestSourceRequested = false;

let placed = false;

let clock =
  new THREE.Clock();


// =======================================================
// ERROR SCREEN
// =======================================================

function showError(message) {

  console.error(
    "NEMPAT AR ERROR:",
    message
  );

  loading.classList.add(
    "hidden"
  );

  permission.classList.add(
    "hidden"
  );

  unsupported.classList.remove(
    "hidden"
  );

  const paragraph =
    unsupported.querySelector("p");

  if (paragraph) {
    paragraph.textContent =
      message;
  }
}


// =======================================================
// TIMEOUT HELPER
// =======================================================

function withTimeout(
  promise,
  milliseconds,
  message
) {

  return Promise.race([

    promise,

    new Promise(
      (_, reject) => {

        setTimeout(
          () => {

            reject(
              new Error(message)
            );

          },
          milliseconds
        );

      }
    )

  ]);

}


// =======================================================
// LOAD FOOD DATA
// =======================================================

async function loadFood() {

  /*
   * We use menu.json here only to obtain
   * the selected item's model path/name/price.
   */

  const response =
    await fetch(
      `./menu.json?v=20`,
      {
        cache: "no-store"
      }
    );

  if (!response.ok) {

    throw new Error(
      `Unable to load menu.json (${response.status})`
    );

  }

  const data =
    await response.json();

  restaurant =
    data.restaurant;

  let found = null;

  for (
    const category
    of data.categories || []
  ) {

    const result =
      (category.items || [])
        .find(
          food =>
            food.id === itemId
        );

    if (result) {

      found = result;

      break;

    }

  }

  if (!found) {

    throw new Error(
      "Food item was not found."
    );

  }

  item = found;

  foodName.textContent =
    item.name;

  foodPrice.textContent =
    `${restaurant.currency || "₹"}${item.price}`;

  foodTitle.textContent =
    `${restaurant.name || "AR"} AR`;
}


// =======================================================
// THREE.JS SETUP
// =======================================================

function setupThree() {

  scene =
    new THREE.Scene();


  /*
   * Camera used by Three.js.
   *
   * WebXR supplies the real-world camera
   * background when immersive AR starts.
   */

  camera =
    new THREE.PerspectiveCamera(
      70,
      window.innerWidth /
        window.innerHeight,
      0.01,
      20
    );


  /*
   * Renderer
   */

  renderer =
    new THREE.WebGLRenderer({

      canvas: canvas,

      alpha: true,

      antialias: true,

      powerPreference: "high-performance"

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


  /*
   * Lighting
   */

  const hemisphere =
    new THREE.HemisphereLight(
      0xffffff,
      0x444444,
      2
    );

  scene.add(
    hemisphere
  );


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


  /*
   * Surface detection reticle
   */

  const ringGeometry =
    new THREE.RingGeometry(
      0.08,
      0.10,
      32
    );


  const ringMaterial =
    new THREE.MeshBasicMaterial({

      color: 0xffffff,

      transparent: true,

      opacity: 0.9,

      side: THREE.DoubleSide

    });


  reticle =
    new THREE.Mesh(
      ringGeometry,
      ringMaterial
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


  /*
   * Render loop
   */

  renderer.setAnimationLoop(
    render
  );


  window.addEventListener(
    "resize",
    resize
  );

}


// =======================================================
// LOAD GLB MODEL
// =======================================================

async function loadModel() {

  const loader =
    new GLTFLoader();


  await new Promise(
    (resolve, reject) => {

      loader.load(

        item.model,

        gltf => {

          model =
            gltf.scene;


          /*
           * Start hidden.
           */

          model.visible =
            false;


          /*
           * Enable shadows.
           */

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


          /*
           * Find model size.
           */

          const originalBox =
            new THREE.Box3()
              .setFromObject(
                model
              );


          const originalSize =
            originalBox.getSize(
              new THREE.Vector3()
            );


          const largestDimension =
            Math.max(
              originalSize.x,
              originalSize.y,
              originalSize.z
            );


          /*
           * Desired pizza size:
           *
           * approximately 35 cm
           */

          const desiredSize =
            0.35;


          if (
            largestDimension > 0
          ) {

            const scale =
              desiredSize /
              largestDimension;

            model.scale.setScalar(
              scale
            );

          }


          /*
           * Put model's bottom
           * approximately at Y = 0.
           */

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

        error => {

          console.error(
            "GLB LOAD ERROR:",
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


// =======================================================
// CHECK WEBXR
// =======================================================

async function checkWebXR() {

  /*
   * Secure context is mandatory.
   */

  if (
    !window.isSecureContext
  ) {

    throw new Error(
      "AR requires HTTPS."
    );

  }


  /*
   * Android Chrome should expose
   * navigator.xr.
   */

  if (
    !("xr" in navigator)
  ) {

    throw new Error(
      "WebXR is not available in this browser. Use the latest Android Chrome."
    );

  }


  /*
   * Give isSessionSupported a timeout.
   *
   * This prevents the screen from
   * staying on Preparing AR forever.
   */

  let supported;

  try {

    supported =
      await withTimeout(

        navigator.xr
          .isSessionSupported(
            "immersive-ar"
          ),

        6000,

        "The browser did not respond to the AR capability check."

      );

  }

  catch (error) {

    throw new Error(
      error.message
    );

  }


  if (!supported) {

    throw new Error(
      "This Android device/browser does not support immersive AR."
    );

  }


  return true;

}


// =======================================================
// START WEBXR
// =======================================================

async function startWebXR() {

  console.log(
    "Requesting immersive AR..."
  );


  /*
   * Request actual AR session.
   */

  xrSession =
    await withTimeout(

      navigator.xr.requestSession(
        "immersive-ar",
        {

          requiredFeatures: [
            "hit-test"
          ],

          optionalFeatures: [
            "dom-overlay",
            "local-floor"
          ],

          domOverlay: {
            root: document.body
          }

        }
      ),

      10000,

      "The AR session could not be started."
    );


  console.log(
    "AR session started."
  );


  /*
   * Tell Three.js that
   * this is an AR session.
   */

  renderer.xr.setReferenceSpaceType(
    "local-floor"
  );


  await renderer.xr.setSession(
    xrSession
  );


  /*
   * Session ended.
   */

  xrSession.addEventListener(
    "end",
    onSessionEnded
  );


  /*
   * Get viewer reference space.
   */

  const viewerSpace =
    await xrSession
      .requestReferenceSpace(
        "viewer"
      );


  /*
   * Request hit testing.
   */

  hitTestSource =
    await xrSession
      .requestHitTestSource({
        space: viewerSpace
      });


  hitTestSourceRequested =
    true;


  /*
   * Show AR interface.
   */

  loading.classList.add(
    "hidden"
  );

  permission.classList.add(
    "hidden"
  );

  unsupported.classList.add(
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


  console.log(
    "NEMPAT AR READY"
  );

}


// =======================================================
// SESSION END
// =======================================================

function onSessionEnded() {

  console.log(
    "AR session ended."
  );


  xrSession = null;

  hitTestSource = null;

  hitTestSourceRequested =
    false;

  placed =
    false;


  if (model) {

    model.visible =
      false;

  }


  reticle.visible =
    false;


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

}


// =======================================================
// AR RENDER LOOP
// =======================================================

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


  /*
   * Get the XR reference space.
   */

  const referenceSpace =
    renderer.xr.getReferenceSpace();


  if (!referenceSpace) {

    return;

  }


  /*
   * Hit-test the real world.
   */

  if (
    hitTestSource
  ) {

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


        /*
         * Show placement button
         * when surface is detected.
         */

        if (!placed) {

          placeButton.classList.remove(
            "hidden"
          );

        }

      }

    }

    else {

      reticle.visible =
        false;


      if (!placed) {

        placeButton.classList.add(
          "hidden"
        );

      }

    }

  }


  /*
   * Render.
   */

  renderer.render(
    scene,
    camera
  );

}


// =======================================================
// PLACE MODEL
// =======================================================

function placeModel() {

  if (
    !reticle ||
    !reticle.visible ||
    !model
  ) {

    return;

  }


  /*
   * Copy detected surface position.
   */

  model.position.setFromMatrixPosition(
    reticle.matrix
  );


  /*
   * Keep pizza upright.
   *
   * We do NOT copy the reticle
   * rotation because the pizza
   * should remain level with the table.
   */

  model.rotation.set(
    0,
    0,
    0
  );


  /*
   * Make visible.
   */

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


  console.log(
    "Pizza placed."
  );

}


// =======================================================
// REMOVE MODEL
// =======================================================

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


  /*
   * Allow another placement.
   */

  if (
    reticle.visible
  ) {

    placeButton.classList.remove(
      "hidden"
    );

  }

}


// =======================================================
// EXIT AR
// =======================================================

async function exitAR() {

  if (
    xrSession
  ) {

    try {

      await xrSession.end();

    }

    catch (error) {

      console.error(
        error
      );

    }

    return;

  }


  history.back();

}


// =======================================================
// RESIZE
// =======================================================

function resize() {

  if (!renderer || !camera) {

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


// =======================================================
// BUTTONS
// =======================================================

startARButton.addEventListener(
  "click",
  async () => {

    try {

      /*
       * Hide ready screen.
       */

      permission.classList.add(
        "hidden"
      );


      loading.classList.remove(
        "hidden"
      );


      loading.querySelector(
        "p"
      ).textContent =
        "Checking AR support...";


      /*
       * Check WebXR.
       */

      await checkWebXR();


      loading.querySelector(
        "p"
      ).textContent =
        "Loading pizza...";


      /*
       * Load model.
       */

      await loadModel();


      loading.querySelector(
        "p"
      ).textContent =
        "Starting camera AR...";


      /*
       * Start actual AR.
       */

      await startWebXR();

    }

    catch (error) {

      console.error(
        "START AR ERROR:",
        error
      );


      showError(
        error.message ||
        "Unable to start AR."
      );

    }

  }
);


// Remove

removeButton.addEventListener(
  "click",
  removeModel
);


// Done

doneButton.addEventListener(
  "click",
  exitAR
);


// Exit

exitButton.addEventListener(
  "click",
  exitAR
);


// Unsupported back

backUnsupported.addEventListener(
  "click",
  () => {
    history.back();
  }
);


// Place

placeButton.addEventListener(
  "click",
  placeModel
);


// =======================================================
// INITIALIZATION
// =======================================================

async function initialize() {

  try {

    console.log(
      "NEMPAT AR initializing..."
    );


    /*
     * Load menu item first.
     */

    await loadFood();


    /*
     * Set up Three.js.
     */

    setupThree();


    /*
     * Check WebXR WITHOUT
     * starting an AR session yet.
     */

    await checkWebXR();


    /*
     * Everything is ready.
     */

    loading.classList.add(
      "hidden"
    );

    permission.classList.remove(
      "hidden"
    );


    console.log(
      "NEMPAT AR READY TO START"
    );

  }

  catch (error) {

    console.error(
      "INITIALIZATION ERROR:",
      error
    );


    showError(
      error.message ||
      "AR could not be initialized."
    );

  }

}


// =======================================================
// START
// =======================================================

initialize();
```
