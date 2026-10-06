
const params =
  new URLSearchParams(
    window.location.search
  );

const itemId =
  params.get("item");


async function loadAR() {

  const loading =
    document.getElementById("loading");

  const viewer =
    document.getElementById("viewer");

  try {

    if (!itemId) {
      throw new Error(
        "No food item selected"
      );
    }


    const response =
      await fetch("menu.json");


    if (!response.ok) {
      throw new Error(
        "menu.json could not be loaded"
      );
    }


    const data =
      await response.json();


    let selectedItem = null;


    for (
      const category
      of data.categories
    ) {

      const found =
        category.items.find(
          item =>
            item.id === itemId
        );


      if (found) {

        selectedItem = found;

        break;

      }

    }


    if (!selectedItem) {

      throw new Error(
        "Food item not found"
      );

    }


    /* PAGE INFO */

    document.title =
      `${selectedItem.name} AR`;


    document.getElementById(
      "restaurantTitle"
    ).textContent =
      `${data.restaurant.name} AR`;


    document.getElementById(
      "foodName"
    ).textContent =
      selectedItem.name;


    document.getElementById(
      "foodPrice"
    ).textContent =
      `${data.restaurant.currency}${selectedItem.price}`;


    /* LOAD MODEL */

    viewer.src =
      selectedItem.model;


    viewer.alt =
      `3D model of ${selectedItem.name}`;


    /* WAIT FOR MODEL */

    viewer.addEventListener(
      "load",
      () => {

        loading.style.display =
          "none";

      },
      { once: true }
    );


    viewer.addEventListener(
      "error",
      () => {

        loading.innerHTML = `
          <div style="
            text-align:center;
            padding:30px;
          ">
            <h2>
              3D model unavailable
            </h2>

            <p style="
              color:#888;
            ">
              Please try again later.
            </p>
          </div>
        `;

      },
      { once: true }
    );


  } catch (error) {

    console.error(error);


    loading.innerHTML = `

      <div style="
        text-align:center;
        padding:30px;
      ">

        <h2>
          AR unavailable
        </h2>

        <p style="
          color:#888;
        ">
          This food item could not be loaded.
        </p>

        <button
          onclick="history.back()"
          style="
            margin-top:15px;
            padding:12px 18px;
            border:0;
            border-radius:12px;
            font-weight:bold;
          ">

          Go Back

        </button>

      </div>

    `;

  }

}


loadAR();
