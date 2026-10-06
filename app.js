async function loadMenu() {

  const loading =
    document.getElementById("loading");

  const error =
    document.getElementById("error");

  const categoriesContainer =
    document.getElementById("categories");

  try {

    const response =
      await fetch("menu.json");

    if (!response.ok) {
      throw new Error(
        "menu.json could not be loaded"
      );
    }

    const data =
      await response.json();


    /* RESTAURANT */

    document.getElementById(
      "restaurantName"
    ).textContent =
      data.restaurant.name;

    document.getElementById(
      "restaurantTagline"
    ).textContent =
      data.restaurant.tagline;


    /* CATEGORIES */

    categoriesContainer.innerHTML = "";


    data.categories.forEach(category => {

      const categoryElement =
        document.createElement("section");

      categoryElement.className =
        "category";


      const title =
        document.createElement("h2");

      title.className =
        "category-title";

      title.textContent =
        category.name;


      categoryElement.appendChild(title);


      category.items.forEach(item => {

        const card =
          document.createElement("article");

        card.className =
          "food-card";


        card.innerHTML = `

          <img
            class="food-image"
            src="${item.image}"
            alt="${item.name}"
            loading="lazy"
          >

          <div class="food-info">

            <h3 class="food-name">
              ${item.name}
            </h3>

            <p class="food-description">
              ${item.description}
            </p>

            <div class="food-bottom">

              <div class="food-price">
                ${data.restaurant.currency}${item.price}
              </div>

              ${
                item.ar
                ? `
                  <button
                    class="ar-button"
                    onclick="openAR('${item.id}')"
                  >
                    ✨ View in AR
                  </button>
                `
                : ""
              }

            </div>

          </div>
        `;


        categoryElement.appendChild(card);

      });


      categoriesContainer.appendChild(
        categoryElement
      );

    });


    loading.classList.add("hidden");


  } catch (err) {

    console.error(err);

    loading.classList.add("hidden");

    error.classList.remove("hidden");

  }

}


/* =========================
   OPEN AR
========================= */

function openAR(itemId) {

  window.location.href =
    `ar.html?item=${encodeURIComponent(itemId)}`;

}


loadMenu();
