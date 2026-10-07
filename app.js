const restaurant = {
  name: "NEMPAT",
  tagline: "Experience your food in 3D",
  currency: "₹"
};

const items = [
  {
    id: "pizza",
    name: "Classic Pizza",
    description:
      "Golden crust, mozzarella, fresh vegetables and our signature sauce.",
    price: 299,
    image: "assets/images/pizza.jpg",
    ar: true
  }
];

function showMenu() {
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const categories = document.getElementById("categories");

  document.getElementById("restaurantName").textContent =
    restaurant.name;

  document.getElementById("restaurantTagline").textContent =
    restaurant.tagline;

  categories.innerHTML = "";

  const section = document.createElement("section");
  section.className = "category";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = "Popular";

  section.appendChild(title);

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "food-card";

    card.innerHTML = `
      <img
        class="food-image"
        src="${item.image}"
        alt="${item.name}"
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
            ${restaurant.currency}${item.price}
          </div>

          ${
            item.ar
              ? `
                <button
                  class="ar-button"
                  type="button"
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

    section.appendChild(card);
  });

  categories.appendChild(section);

  loading.classList.add("hidden");
  error.classList.add("hidden");
}

function openAR(itemId) {
  window.location.href =
    `ar.html?item=${encodeURIComponent(itemId)}&v=11`;
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    showMenu();
  } catch (error) {
    console.error(error);

    document
      .getElementById("loading")
      .classList.add("hidden");

    const errorBox =
      document.getElementById("error");

    errorBox.classList.remove("hidden");
    errorBox.textContent =
      "Menu error: " + error.message;
  }
});
