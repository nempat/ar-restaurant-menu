console.log("NEMPAT AR.JS v40 STARTED");


const loading =
  document.getElementById("loading");

const loadingTitle =
  document.getElementById("loadingTitle");

const loadingText =
  document.getElementById("loadingText");

const ready =
  document.getElementById("ready");

const errorScreen =
  document.getElementById("error");

const errorText =
  document.getElementById("errorText");

const startAR =
  document.getElementById("startAR");

const backButton =
  document.getElementById("backButton");

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


let scene = null;
let camera = null;
let renderer = null;

let model = null;
let reticle = null;

let xrSession = null;
let hitTestSource = null;

let modelPlaced = false;

let item = {
  name: "Classic Pizza",
  price: 299,
  model: "assets/models/pizza.glb"
};


function setLoading(title, text) {

  loading.classList.remove("hidden");

  ready.classList.add("hidden");

  errorScreen.classList.add("hidden");

  loadingTitle.textContent =
    title;

  loadingText.textContent =
    text || "";

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


function setupThree() {

  if (
    typeof THREE === "undefined"
  ) {

    throw new Error(
      "Three.js failed to load."
    );

  }


  if (
    typeof THREE.GLTFLoader ===
    "undefined"
  ) {

    throw new Error(
      "GLTFLoader failed to load."
    );

  }


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


  renderer.xr.enabled =
    true;


  const hemisphere =
    new THREE.HemisphereLight(
      0xffffff,
      0x555555,
      2.5
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

      side:
        THREE.DoubleSide

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


  renderer.setAnimationLoop(
    render
  );


  window.addEventListener(
    "resize",
    resize
  );

}


function loadModel() {

  return new Promise(
    function(resolve, reject) {

      const loader =
        new THREE.GLTFLoader();


      loader.load(

        item.model,

        function(gltf) {

          console.log(
            "PIZZA GLB LOADED"
          );


          model =
            gltf.scene;


          model.visible =
            false;


          model.traverse(
            function(object) {

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


          if (
            largest > 0
          ) {

            const scale =
              0.35 / largest;

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


        function(progress) {

          if (
            progress.total
          ) {

            const percent =
              Math.round(
                progress.loaded /
                progress.total *
                100
              );

            loadingText.textContent =
              "Loading pizza " +
              percent +
              "%";

          }

        },


        function(error) {

          console.error(
            "GLB ERROR:",
            error
          );


          reject(
            new Error(
              "Could not load pizza.glb. Check the model file path."
            )
          );

        }

      );

    }
  );

}


async function checkARSupport() {

  if (
    !window.isSecureContext
  ) {

    throw new Error(
      "AR requires HTTPS."
    );

  }


  if (
    !navigator.xr
  ) {

    throw new Error(
      "WebXR is not available in this browser."
    );

  }


  let supported =
    false;


  try {

    supported =
      await navigator.xr
        .isSessionSupported(
          "immersive-ar"
        );

  } catch(error) {

    console.error(
      error
    );

    throw new Error(
      "The browser could not check AR support."
    );

  }


  if (!supported) {

    throw new Error(
      "This phone/browser does not support markerless browser AR."
    );

  }

}


async function startARSession() {

  setLoading(
    "Starting AR...",
    "Opening camera AR"
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


  loading.classList.add(
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
    "NEMPAT REAL AR ACTIVE"
  );

}


function render(
  timestamp,
  frame
) {

  if (
    frame &&
    xrSession &&
    hitTestSource
  ) {

    const referenceSpace =
      renderer.xr.getReferenceSpace();


    if (
      referenceSpace
    ) {

      const results =
        frame.getHitTestResults(
          hitTestSource
        );


      if (
        results.length > 0
      ) {

        const pose =
          results[0].getPose(
            referenceSpace
          );


        if (
          pose
        ) {

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

    }

  }


  renderer.render(
    scene,
    camera
  );

}


function placePizza() {

  if (
    !reticle ||
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

}


function removePizza() {

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

}


async function exitAR() {

  if (
    xrSession
  ) {

    try {

      await xrSession.end();

    } catch(error) {

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
  async function() {

    try {

      setLoading(
        "Checking AR...",
        "Checking this phone"
      );


      await checkARSupport();


      setLoading(
        "Loading pizza...",
        "Preparing 3D model"
      );


      await loadModel();


      await startARSession();

    } catch(error) {

      console.error(
        "START ERROR:",
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
  placePizza
);


removeButton.addEventListener(
  "click",
  removePizza
);


doneButton.addEventListener(
  "click",
  exitAR
);


exitButton.addEventListener(
  "click",
  exitAR
);


backButton.addEventListener(
  "click",
  function() {

    history.back();

  }
);


function initialize() {

  try {

    console.log(
      "NEMPAT AR v40 INITIALIZING"
    );


    setLoading(
      "Loading NEMPAT AR...",
      "Starting"
    );


    setupThree();


    foodName.textContent =
      item.name;


    foodPrice.textContent =
      "₹" + item.price;


    foodTitle.textContent =
      "NEMPAT AR";


    setTimeout(
      function() {

        showReady();

      },
      300
    );


  } catch(error) {

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
