const list = document.getElementById("list");
const tabs = document.getElementById("tabs");
let menu, active = "All";

fetch("menu.json")
  .then(r => r.json())
  .then(m => {
    menu = m;
    document.getElementById("name").textContent = m.restaurant;
    document.title = m.restaurant + " menu";
    drawTabs();
    drawList();
  })
  .catch(() => { list.textContent = "Could not load the menu. Check that menu.json is valid."; });

function drawTabs() {
  tabs.innerHTML = "";
  ["All", ...menu.categories].forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    if (c === active) b.className = "on";
    b.onclick = () => { active = c; drawTabs(); drawList(); };
    tabs.appendChild(b);
  });
}

function drawList() {
  list.innerHTML = "";
  menu.items
    .filter(i => active === "All" || i.category === active)
    .forEach(i => {
      const row = document.createElement("article");
      row.innerHTML = '<div><h2></h2><p></p><span class="price"></span></div><a class="ar">See in AR</a>';
      row.querySelector("h2").textContent = i.name;
      row.querySelector("p").textContent = i.desc;
      row.querySelector(".price").textContent = menu.currency + i.price;
      row.querySelector(".ar").href = "ar.html?id=" + encodeURIComponent(i.id);
      list.appendChild(row);
    });
}
