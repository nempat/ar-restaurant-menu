```javascript
async function loadMenu() {
  const loading =
    document.getElementById("loading");

  const error =
    document.getElementById("error");

  const container =
    document.getElementById("categories");

  try {
    const response =
      await fetch(`menu.json?v=10`);

    if (!response.ok) {
      throw new Error(
        "menu.json failed"
      );
    }

    const data =
      await response.json();

    /*
     * Restaurant information
     */
    document.getElementById(
      "restaurantName"
    ).textContent =
      data.restaurant.name;

    document.getElementById(
      "restaurantTagline"
    ).textContent =
      data.restaurant.tagline;

    /*
     * Clear existing menu
     */
    container.innerHTML = "";

    /*
     * Build categories
     */
    data.categories.forEach(
      category => {

        const section =
          document.createElement(
            "section"
          );

        section.className =
          "category";

        /*
         * Category title
         */
        const title =
          document.createElement(
            "h2"
          );

        title.className =
          "category-title";

        title.textContent =
          category.name;

        section.appendChild(
          title
        );

        /*
         * Food items
         */
        category.items.forEach(
          item => {

            const card =
              document.createElement(
                "article"
              );

            card.className =
              "food-card";

            /*
             * Create image
             */
            const image =
              document.createElement(
                "img"
              );

            image.className =
              "food-image";

            image.src =
              `${item.image}?v=10`;

            image.alt =
              item.name;

            image.loading =
              "lazy";

            /*
             * Food information
             */
            const info =
              document.createElement(
                "div"
              );

            info.className =
              "food-info";

            const name =
              document.createElement(
                "h3"
              );

            name.className =
              "food-name";

            name.textContent =
              item.name;

            const description =
              document.createElement(
                "p"
              );

            description.className =
              "food-description";

            description.textContent =
              item.description;

            /*
             * Bottom section
             */
            const bottom =
              document.createElement(
                "div"
              );

            bottom.className =
              "food-bottom";

            /*
             * Price
             */
            const price =
              document.createElement(
                "div"
              );

            price.className =
              "food-price";

            price.textContent =
              `${data.restaurant.currency}${item.price}`;

            bottom.appendChild(
              price
            );

            /*
             * AR button
             */
            if (item.ar) {

              const arButton =
                document.createElement(
                  "button"
                );

              arButton.className =
                "ar-button";

              arButton.textContent =
                "✨ View in AR";

              arButton.addEventListener(
                "click",
                () => {
                  openAR(item.id);
                }
              );

              bottom.appendChild(
                arButton
              );
            }

            /*
             * Assemble card
             */
            info.appendChild(
              name
            );

            info.appendChild(
              description
            );

            info.appendChild(
              bottom
            );

            card.appendChild(
              image
            );

            card.appendChild(
              info
            );

            section.appendChild(
              card
            );
          }
        );

        container.appendChild(
          section
        );
      }
    );

    /*
     * Hide loading
     */
    loading.classList.add(
      "hidden"
    );

  } catch (errorObject) {

    console.error(
      "Menu loading error:",
      errorObject
    );

    loading.classList.add(
      "hidden"
    );

    error.classList.remove(
      "hidden"
    );
  }
}


/*
 * Open AR page
 */
function openAR(itemId) {

  const url =
    `ar.html?item=${encodeURIComponent(
      itemId
    )}&v=10`;

  window.location.href =
    url;
}


/*
 * Start menu
 */
loadMenu();
```
