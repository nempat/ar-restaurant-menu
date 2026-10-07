```javascript
async function loadMenu() {
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const container = document.getElementById("categories");

  try {
    console.log("Starting menu load...");

    // Load menu.json with cache-busting
    const response = await fetch(
      `./menu.json?v=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    console.log("menu.json response:", response.status);

    if (!response.ok) {
      throw new Error(
        `menu.json returned HTTP ${response.status}`
      );
    }

    const data = await response.json();

    console.log("Menu loaded:", data);

    // Validate menu structure
    if (!data.restaurant) {
      throw new Error(
        "menu.json is missing restaurant data"
      );
    }

    if (!Array.isArray(data.categories)) {
      throw new Error(
        "menu.json is missing categories"
      );
    }

    // Restaurant information
    const restaurantName =
      document.getElementById("restaurantName");

    const restaurantTagline =
      document.getElementById("restaurantTagline");

    if (restaurantName) {
      restaurantName.textContent =
        data.restaurant.name || "Restaurant";
    }

    if (restaurantTagline) {
      restaurantTagline.textContent =
        data.restaurant.tagline || "";
    }

    // Clear old content
    container.innerHTML = "";

    // Build menu categories
    data.categories.forEach(category => {

      const section =
        document.createElement("section");

      section.className = "category";

      // Category title
      const title =
        document.createElement("h2");

      title.className = "category-title";

      title.textContent =
        category.name || "Menu";

      section.appendChild(title);

      // Make sure items exists
      if (!Array.isArray(category.items)) {
        return;
      }

      // Build food cards
      category.items.forEach(item => {

        const card =
          document.createElement("article");

        card.className = "food-card";

        // -------------------------
        // Food image
        // -------------------------

        const image =
          document.createElement("img");

        image.className = "food-image";

        image.src =
          item.image || "";

        image.alt =
          item.name || "Food";

        image.loading = "lazy";

        // -------------------------
        // Food information
        // -------------------------

        const info =
          document.createElement("div");

        info.className = "food-info";

        const name =
          document.createElement("h3");

        name.className = "food-name";

        name.textContent =
          item.name || "Food Item";

        const description =
          document.createElement("p");

        description.className =
          "food-description";

        description.textContent =
          item.description || "";

        // -------------------------
        // Bottom section
        // -------------------------

        const bottom =
          document.createElement("div");

        bottom.className =
          "food-bottom";

        // Price
        const price =
          document.createElement("div");

        price.className =
          "food-price";

        price.textContent =
          `${data.restaurant.currency || "₹"}${item.price}`;

        bottom.appendChild(price);

        // -------------------------
        // AR button
        // -------------------------

        if (item.ar === true) {

          const arButton =
            document.createElement("button");

          arButton.className =
            "ar-button";

          arButton.type = "button";

          arButton.textContent =
            "✨ View in AR";

          arButton.addEventListener(
            "click",
            () => {
              openAR(item.id);
            }
          );

          bottom.appendChild(arButton);
        }

        // -------------------------
        // Assemble card
        // -------------------------

        info.appendChild(name);
        info.appendChild(description);
        info.appendChild(bottom);

        card.appendChild(image);
        card.appendChild(info);

        section.appendChild(card);
      });

      container.appendChild(section);
    });

    // Check if anything was actually rendered
    if (container.children.length === 0) {
      throw new Error(
        "No menu categories were found"
      );
    }

    // Hide loading screen
    loading.classList.add("hidden");

    console.log("Menu displayed successfully.");

  } catch (errorObject) {

    console.error(
      "MENU ERROR:",
      errorObject
    );

    // Hide loading
    loading.classList.add("hidden");

    // Show error
    error.classList.remove("hidden");

    error.innerHTML = `
      <div style="
        max-width: 90%;
        text-align: center;
        padding: 20px;
      ">
        <h2 style="
          color: white;
          margin-bottom: 12px;
        ">
          Menu couldn't load
        </h2>

        <p style="
          color: #aaa;
          line-height: 1.6;
        ">
          ${escapeHTML(errorObject.message)}
        </p>

        <button
          onclick="location.reload()"
          style="
            margin-top: 20px;
            padding: 13px 22px;
            border: 0;
            border-radius: 12px;
            background: white;
            color: black;
            font-weight: 800;
          "
        >
          Try Again
        </button>
      </div>
    `;
  }
}


// ========================================
// OPEN AR
// ========================================

function openAR(itemId) {

  if (!itemId) {
    console.error("No item ID provided.");
    return;
  }

  console.log(
    "Opening AR for:",
    itemId
  );

  /*
   * Version number prevents GitHub Pages
   * from keeping the old AR page.
   */

  const url =
    `./ar.html?item=${encodeURIComponent(itemId)}&v=10`;

  window.location.href = url;
}


// ========================================
// SAFE HTML ESCAPE
// ========================================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ========================================
// START
// ========================================

console.log(
  "NEMPAT AR Menu starting..."
);

loadMenu();
```
