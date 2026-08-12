const $ = (id) => document.getElementById(id);

const STORE_KEY = "calcvault.photos.v2";
const PIN_KEY = "calcvault.pin.v2";

const screens = {
  calc: $("screen-calculator"),
  history: $("screen-history"),
  login: $("screen-login"),
  vault: $("screen-vault"),
  changepin: $("screen-changepin"),
  photo: $("screen-photo")
};

let pin = localStorage.getItem(PIN_KEY) || "";
let photos = [];
let history = [];
let calcExpr = "";

try {
  photos = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  if (!Array.isArray(photos)) photos = [];
} catch {
  photos = [];
}

function show(name) {
  Object.keys(screens).forEach((key) => {
    screens[key].classList.toggle("hidden", key !== name);
  });
}

/* =========================
   CALCULATOR
========================= */

function renderDisplay() {
  $("display").textContent = calcExpr || "0";
}

function addKey(value) {
  if (calcExpr === "ERROR") calcExpr = "";
  calcExpr += value;
  renderDisplay();
}

function calculate() {
  if (!calcExpr || calcExpr === "ERROR") return;

  let expression = calcExpr
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-");

  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    calcExpr = "ERROR";
    renderDisplay();
    return;
  }

  try {
    const result = Function(
      '"use strict"; return (' + expression + ')'
    )();

    if (!Number.isFinite(result)) throw new Error();

    history.push(calcExpr + " = " + result);
    calcExpr = String(result);

  } catch {
    calcExpr = "ERROR";
  }

  renderDisplay();
}

document.querySelectorAll(".key").forEach((button) => {
  button.addEventListener("click", () => {

    const key = button.dataset.k;

    if (key === "C") {
      calcExpr = "";
      renderDisplay();

    } else if (key === "⌫") {
      if (calcExpr === "ERROR") {
        calcExpr = "";
      } else {
        calcExpr = calcExpr.slice(0, -1);
      }
      renderDisplay();

    } else if (key === "=") {
      calculate();

    } else {
      addKey(key);
    }
  });
});

/* =========================
   HISTORY
========================= */

$("btn-history").addEventListener("click", () => {

  const list = $("history-list");
  list.replaceChildren();

  if (history.length === 0) {

    const empty = document.createElement("div");
    empty.className = "history-item";
    empty.textContent = "No calculations yet.";

    list.appendChild(empty);

  } else {

    history.slice().reverse().forEach((item) => {

      const row = document.createElement("div");
      row.className = "history-item";
      row.textContent = item;

      list.appendChild(row);
    });
  }

  show("history");
});

$("btn-clear-history").addEventListener("click", () => {
  history = [];

  $("btn-history").click();
});

$("btn-back-calc").addEventListener("click", () => {
  show("calc");
});

/* =========================
   VAULT LOGIN
========================= */

$("btn-vault").addEventListener("click", () => {

  const savedPin = localStorage.getItem(PIN_KEY);

  $("pin-input").value = "";

  if (!savedPin) {

    $("pin-input").placeholder = "Create PIN";
    $("btn-open").textContent = "🔐 CREATE PIN";
    $("login-msg").textContent =
      "First time? Create a PIN of at least 4 digits.";

  } else {

    $("pin-input").placeholder = "Enter PIN";
    $("btn-open").textContent = "🔓 OPEN VAULT";
    $("login-msg").textContent = "";
  }

  show("login");
});

$("btn-back-login").addEventListener("click", () => {

  $("pin-input").value = "";
  $("login-msg").textContent = "";

  show("calc");
});

function handlePin() {

  const entered = $("pin-input").value.trim();
  const savedPin = localStorage.getItem(PIN_KEY);

  /* CREATE PIN */

  if (!savedPin) {

    if (!/^\d{4,}$/.test(entered)) {

      $("login-msg").textContent =
        "❌ PIN must contain at least 4 digits.";

      return;
    }

    localStorage.setItem(PIN_KEY, entered);
    pin = entered;

    $("pin-input").value = "";
    $("login-msg").textContent = "✅ PIN CREATED";

    setTimeout(() => {
      renderVault();
      show("vault");
    }, 300);

    return;
  }

  /* ENTER PIN */

  if (entered === savedPin) {

    pin = savedPin;

    $("pin-input").value = "";
    $("login-msg").textContent = "";

    renderVault();
    show("vault");

  } else {

    $("login-msg").textContent = "❌ WRONG PIN";
    $("pin-input").value = "";
  }
}

$("btn-open").addEventListener("click", handlePin);

$("pin-input").addEventListener("keydown", (event) => {

  if (event.key === "Enter") {
    handlePin();
  }
});

/* =========================
   LOCK
========================= */

$("btn-lock").addEventListener("click", () => {
  show("calc");
});

/* =========================
   VAULT
========================= */

function savePhotos() {
  localStorage.setItem(STORE_KEY, JSON.stringify(photos));
}

function renderVault() {

  const grid = $("vault-grid");
  grid.replaceChildren();

  if (photos.length === 0) {

    const empty = document.createElement("div");
    empty.className = "photo-empty";
    empty.textContent = "No photos yet. Tap ADD PHOTO.";

    grid.appendChild(empty);
    return;
  }

  photos.forEach((photo, index) => {

    const card = document.createElement("div");
    card.className = "photo-card";

    const image = document.createElement("img");

    image.src = photo;
    image.alt = "Private photo";
    image.loading = "lazy";

    image.addEventListener("click", () => {
      $("photo-full").src = photo;
      show("photo");
    });

    card.appendChild(image);

    grid.appendChild(card);
  });
}

/* =========================
   ADD PHOTO
========================= */

$("btn-add").addEventListener("click", () => {

  const picker = $("file-input");

  picker.value = "";

  picker.click();
});

$("file-input").addEventListener("change", (event) => {

  const files = Array.from(event.target.files || []);

  if (files.length === 0) return;

  let remaining = files.length;

  files.forEach((file) => {

    if (!file.type.startsWith("image/")) {

      remaining--;

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {

      photos.push(reader.result);

      remaining--;

      if (remaining <= 0) {

        savePhotos();
        render
