import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ============================================================
// NEMPAT AR
// Markerless WebXR + Three.js + GLTF
// ============================================================

// -----------------------------
// DOM
// -----------------------------

const loadingScreen = document.getElementById("loading");
const readyScreen = document.getElementById("ready");
const errorScreen = document.getElementById("error");

const loadingTitle = document.getElementById("loadingTitle");
const loadingText = document.getElementById("loadingText");

const errorText = document.getElementById("errorText");

const startButton = document.getElementById("startAR");
const backButton = document.getElementById("backButton");

const canvas = document.getElementById("arCanvas");

const topbar = document.getElementById("topbar");
const exitButton = document.getElementById("exitButton");

const foodTitle = document.getElementById("foodTitle");

const instructions = document.getElementById("instructions");

const placeButton = document.getElementById("placeButton");

const placedControls = document.getElementById("placedControls");

const removeButton = document.getElementById("removeButton");
const doneButton = document.getElementById("doneButton");

const info = document.getElementById("info");

const foodName = document.getElementById("foodName");
const foodPrice = document.getElementById("foodPrice");

// -----------------------------
// State
// -----------------------------

let renderer = null;
let scene = null;
let camera = null;

let xrSession = null;

let referenceSpace = null;
let viewerSpace = null;
let hitTestSource = null;

let reticle = null;

let pizzaModel = null;
let placedPizza = null;

let hitFound = false;
let pizzaPlaced = false;

let animationFrameHandle = null;

// -----------------------------
// Product data
// -----------------------------

const params = new URLSearchParams(window.location.search);

const item = params.get("item") || "pizza";

const products = {
pizza: {
name: "Classic Pizza",
price: "₹299",
model: "assets/models/pizza.glb"
}
};

const product = products[item] || products.pizza;

foodName.textContent = product.name;
foodPrice.textContent = product.price;
foodTitle.textContent = "NEMPAT AR";

// ============================================================
// Utility
// ============================================================

function showOnly(element) {

loadingScreen.classList.add("hidden");
readyScreen.classList.add("hidden");
errorScreen.classList.add("hidden");

element.classList.remove("hidden");
}

function showError(message) {

console.error("NEMPAT AR ERROR:", message);

errorText.textContent = message;

showOnly(errorScreen);
}

function setLoading(title, message) {

loadingTitle.textContent = title;
loadingText.textContent = message;
}

// ============================================================
// Start-up
// ============================================================

async function init() {

try {

```
setLoading(
  "Preparing AR...",
  "Loading 3D engine"
);

// Give the module system a moment to finish initialization.
await new Promise(resolve => setTimeout(resolve, 100));


// ----------------------------------------
// Check WebXR
// ----------------------------------------

if (!navigator.xr) {

  throw new Error(
    "WebXR is not available in this browser. Try a supported Android Chrome device."
  );

}


// ----------------------------------------
// Check immersive AR
// ----------------------------------------

let supported = false;

try {

  supported = await navigator.xr.isSessionSupported(
    "immersive-ar"
  );

} catch (error) {

  console.error(
    "WebXR support check failed:",
    error
  );

  throw new Error(
    "This browser could not check WebXR AR support."
  );

}


if (!supported) {

  throw new Error(
    "Markerless AR is not supported on this device/browser."
  );

}


// ----------------------------------------
// Load pizza
// ----------------------------------------

setLoading(
  "Preparing AR...",
  "Loading your food model"
);


const loader = new GLTFLoader();


pizzaModel = await new Promise(
  (resolve, reject) => {

    loader.load(
      product.model,

      gltf => {

        console.log(
          "Pizza GLB loaded successfully."
        );

        resolve(gltf.scene);

      },

      progress => {

        if (
          progress.total &&
          progress.total > 0
        ) {

          const percent =
            Math.round(
              (progress.loaded / progress.total) * 100
            );

          loadingText.textContent =
            `Loading pizza model ${percent}%`;

        }

      },

      error => {

        console.error(
          "GLB loading error:",
          error
        );

        reject(
          new Error(
            "Could not load pizza.glb. Check assets/models/pizza.glb."
          )
        );

      }
    );

  }
);


// ----------------------------------------
// Prepare model
// ----------------------------------------

pizzaModel.visible = false;


// ----------------------------------------
// Three.js scene
// ----------------------------------------

scene = new THREE.Scene();


// ----------------------------------------
// Camera
// ----------------------------------------

camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  20
);


// ----------------------------------------
// Renderer
// ----------------------------------------

renderer = new THREE.WebGLRenderer({

  canvas: canvas,

  alpha: true,

  antialias: true,

  powerPreference: "high-performance"

});


renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);


renderer.xr.enabled = true;


// Transparent AR background.
renderer.setClearColor(
  0x000000,
  0
);


// ----------------------------------------
// Lighting
// ----------------------------------------

const ambientLight =
  new THREE.HemisphereLight(
    0xffffff,
    0x444444,
    2.5
  );

scene.add(ambientLight);


const directionalLight =
  new THREE.DirectionalLight(
    0xffffff,
    2
  );

directionalLight.position.set(
  2,
  4,
  2
);

scene.add(directionalLight);


// ----------------------------------------
// Reticle
// ----------------------------------------

reticle = createReticle();

reticle.visible = false;

scene.add(reticle);


// ----------------------------------------
// Resize
// ----------------------------------------

window.addEventListener(
  "resize",
  onResize
);


// ----------------------------------------
// Ready
// ----------------------------------------

setLoading(
  "Ready",
  "Your AR experience is ready."
);

showOnly(readyScreen);

console.log(
  "NEMPAT AR initialized successfully."
);
```

} catch (error) {

```
console.error(
  "NEMPAT AR initialization failed:",
  error
);

showError(
  error.message ||
  "Unable to initialize AR."
);
```

}

}

// ============================================================
// Reticle
// ============================================================

function createReticle() {

const group = new THREE.Group();

const ringGeometry =
new THREE.RingGeometry(
0.08,
0.095,
48
);

const ringMaterial =
new THREE.MeshBasicMaterial({

```
  color: 0xffffff,

  transparent: true,

  opacity: 0.9,

  side: THREE.DoubleSide

});
```

const ring =
new THREE.Mesh(
ringGeometry,
ringMaterial
);

ring.rotation.x =
-Math.PI / 2;

group.add(ring);

const centerGeometry =
new THREE.CircleGeometry(
0.015,
32
);

const centerMaterial =
new THREE.MeshBasicMaterial({

```
  color: 0xffffff,

  transparent: true,

  opacity: 0.7,

  side: THREE.DoubleSide

});
```

const center =
new THREE.Mesh(
centerGeometry,
centerMaterial
);

center.rotation.x =
-Math.PI / 2;

center.position.y =
0.001;

group.add(center);

return group;

}

// ============================================================
// Start AR
// ============================================================

startButton.addEventListener(
"click",
startAR
);

async function startAR() {

try {

```
if (!renderer) {

  throw new Error(
    "AR renderer is not ready."
  );

}


setLoading(
  "Starting AR...",
  "Opening your camera"
);

showOnly(loadingScreen);


// ----------------------------------------
// Request immersive AR
// ----------------------------------------

xrSession =
  await navigator.xr.requestSession(
    "immersive-ar",
    {

      requiredFeatures: [
        "hit-test"
      ],

      optionalFeatures: [
        "local-floor",
        "dom-overlay"
      ],

      domOverlay: {
        root: document.body
      }

    }
  );


// ----------------------------------------
// Connect Three.js to WebXR
// ----------------------------------------

renderer.xr.setReferenceSpaceType(
  "local-floor"
);


await renderer.xr.setSession(
  xrSession
);


// ----------------------------------------
// Reference spaces
// ----------------------------------------

viewerSpace =
  await xrSession.requestReferenceSpace(
    "viewer"
  );


referenceSpace =
  await xrSession.requestReferenceSpace(
    "local-floor"
  );


// ----------------------------------------
// Hit-test source
// ----------------------------------------

hitTestSource =
  await xrSession.requestHitTestSource({

    space: viewerSpace

  });


// ----------------------------------------
// Session ended
// ----------------------------------------

xrSession.addEventListener(
  "end",
  onSessionEnd
);


// ----------------------------------------
// UI
// ----------------------------------------

loadingScreen.classList.add(
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


// ----------------------------------------
// XR render loop
// ----------------------------------------

renderer.setAnimationLoop(
  renderXR
);


console.log(
  "NEMPAT immersive AR session started."
);
```

} catch (error) {

```
console.error(
  "Could not start AR:",
  error
);


if (
  xrSession
) {

  try {

    await xrSession.end();

  } catch (_) {}

}


xrSession = null;


showError(
  error.message ||
  "AR could not start on this device."
);
```

}

}

// ============================================================
// XR render loop
// ============================================================

function renderXR(
timestamp,
frame
) {

if (
!frame ||
!xrSession ||
!referenceSpace
) {

```
return;
```

}

// ----------------------------------------
// Hit testing
// ----------------------------------------

if (hitTestSource) {

```
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

    reticle.visible = true;

    reticle.matrix.fromArray(
      pose.transform.matrix
    );

    reticle.matrix.decompose(
      reticle.position,
      reticle.quaternion,
      reticle.scale
    );


    hitFound = true;


    if (!pizzaPlaced) {

      placeButton.classList.remove(
        "hidden"
      );

      instructions.classList.add(
        "hidden"
      );

    }

  }

} else {

  reticle.visible = false;

  hitFound = false;


  if (!pizzaPlaced) {

    placeButton.classList.add(
      "hidden"
    );

  }

}
```

}

// ----------------------------------------
// Render
// ----------------------------------------

renderer.render(
scene,
camera
);

}

// ============================================================
// Place pizza
// ============================================================

placeButton.addEventListener(
"click",
placePizza
);

function placePizza() {

if (
!hitFound ||
!reticle.visible ||
!pizzaModel
) {

```
return;
```

}

// Remove previous placement.
if (placedPizza) {

```
scene.remove(
  placedPizza
);
```

}

// Clone the loaded model.
placedPizza =
pizzaModel.clone(
true
);

// ----------------------------------------
// Scale
// ----------------------------------------

placedPizza.scale.set(
0.35,
0.35,
0.35
);

// ----------------------------------------
// Place exactly at reticle
// ----------------------------------------

placedPizza.position.copy(
reticle.position
);

placedPizza.quaternion.copy(
reticle.quaternion
);

// ----------------------------------------
// Make visible
// ----------------------------------------

placedPizza.visible = true;

scene.add(
placedPizza
);

pizzaPlaced = true;

// ----------------------------------------
// UI
// ----------------------------------------

reticle.visible = false;

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

// ============================================================
// Remove pizza
// ============================================================

removeButton.addEventListener(
"click",
removePizza
);

function removePizza() {

if (placedPizza) {

```
scene.remove(
  placedPizza
);

placedPizza = null;
```

}

pizzaPlaced = false;

placedControls.classList.add(
"hidden"
);

info.classList.add(
"hidden"
);

instructions.classList.remove(
"hidden"
);

if (hitFound) {

```
placeButton.classList.remove(
  "hidden"
);
```

}

}

// ============================================================
// Done
// ============================================================

doneButton.addEventListener(
"click",
() => {

```
placedControls.classList.add(
  "hidden"
);

info.classList.remove(
  "hidden"
);
```

}
);

// ============================================================
// Exit
// ============================================================

exitButton.addEventListener(
"click",
exitAR
);

backButton.addEventListener(
"click",
() => {

```
window.history.back();
```

}
);

async function exitAR() {

if (xrSession) {

```
try {

  await xrSession.end();

} catch (error) {

  console.error(
    "AR session end error:",
    error
  );

}
```

} else {

```
window.history.back();
```

}

}

// ============================================================
// Session ended
// ============================================================

function onSessionEnd() {

console.log(
"NEMPAT AR session ended."
);

xrSession = null;

hitTestSource = null;

hitFound = false;

pizzaPlaced = false;

renderer.setAnimationLoop(
null
);

topbar.classList.add(
"hidden"
);

instructions.classList.add(
"hidden"
);

placeButton.classList.add(
"hidden"
);

placedControls.classList.add(
"hidden"
);

info.classList.add(
"hidden"
);

if (placedPizza) {

```
scene.remove(
  placedPizza
);

placedPizza = null;
```

}

showOnly(readyScreen);

}

// ============================================================
// Resize
// ============================================================

function onResize() {

if (!camera || !renderer) {

```
return;
```

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

// ============================================================
// Start
// ============================================================

init();
