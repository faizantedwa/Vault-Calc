const $ = (id) => document.getElementById(id);

const STORE_KEY = "calcvault.photos.v1";
const PIN_KEY = "calcvault.pin.v1";

const screens = {
  calc: $("screen-calculator"),
  history: $("screen-history"),
  login: $("screen-login"),
  vault: $("screen-vault"),
  changepin: $("screen-changepin"),
  photo: $("screen-photo"),
};

let pin = localStorage.getItem(PIN_KEY) || "";
let photos = [];

try {
  photos = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
} catch {
  photos = [];
}

if (!Array.isArray(photos)) {
  photos = [];
}

let history = [];
let calcExpr = "";

function show(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle("hidden", key !== name);
  }
}

function renderDisplay() {
  $("display").textContent = calcExpr || "0";
}

/* =========================
   CALCULATOR
========================= */

function appendKey(value) {
  if (calcExpr === "ERROR") {
    calcExpr = "";
  }

  calcExpr += value;
  renderDisplay();
}

const MAPPING = {
  "×": "*",
  "÷": "/",
  "−": "-"
};

function evaluate() {
  const original = calcExpr;

  if (!original || original === "ERROR") {
    return;
  }

  let expr = original;

  for (const key of Object.keys(MAPPING)) {
    expr = expr.split(key).join(MAPPING[key]);
  }

  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    calcExpr = "ERROR";
    renderDisplay();
    return;
  }

  if (expr.includes("**") || expr.includes("//")) {
    calcExpr = "ERROR";
    renderDisplay();
    return;
  }

  try {
    const result = Function(
      `"use strict"; return (${expr});`
    )();

    if (typeof result !== "number" || !Number.isFinite(result)) {
      throw new Error("Invalid result");
    }

    history.push(`${original} = ${result}`);
    calcExpr = String(result);

  } catch {
    calcExpr = "ERROR";
  }

  renderDisplay();
}

document.querySelectorAll(".key").forEach((key) => {
  key.addEventListener("click", () => {
    const k = key.dataset.k;

    if (k === "C") {
      calcExpr = "";
      renderDisplay();

    } else if (k === "⌫") {
      if (calcExpr === "ERROR") {
        calcExpr = "";
      } else {
        calcExpr = calcExpr.slice(0, -1);
      }

      renderDisplay();

    } else if (k === "=") {
      evaluate();

    } else {
      appendKey(k);
    }
  });
});

/* =========================
   HISTORY
========================= */

$("btn-history").addEventListener("click", () => {
  $("history-list").replaceChildren();

  if (history.length === 0) {
    const p = document.createElement("div");
    p.className = "history-item history-empty";
    p.textContent = "No calculations yet.";
    $("history-list").appendChild(p);

  } else {
    for (let i = history.length - 1; i >= 0; i--) {
      const p = document.createElement("div");
      p.className = "history-item";
      p.textContent = history[i];
      $("history-list").appendChild(p);
    }
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
   PRIVATE VAULT
========================= */

$("btn-vault").addEventListener("click", () => {

  const hasPin = localStorage.getItem(PIN_KEY);

  if (!hasPin) {
    $("pin-input").value = "";
    $("pin-input").placeholder = "Create PIN";
    $("btn-open").textContent = "🔐 CREATE PIN";
    $("login-msg").textContent =
      "First time? Create your private PIN.";

  } else {
    $("pin-input").value = "";
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

/* =========================
   CREATE / ENTER PIN
========================= */

function submitPin() {

  const enteredPin = $("pin-input").value.trim();
  const msg = $("login-msg");

  const savedPin = localStorage.getItem(PIN_KEY);

  /* FIRST TIME */

  if (!savedPin) {

    if (!/^\d+$/.test(enteredPin) || enteredPin.length < 4) {
      msg.textContent = "❌ PIN MUST BE AT LEAST 4 DIGITS";
      return;
    }

    localStorage.setItem(PIN_KEY, enteredPin);
    pin = enteredPin;

    msg.textContent = "✅ PIN CREATED";

    $("pin-input").value = "";

    setTimeout(() => {
      show("vault");
      renderVault();
    }, 300);

    return;
  }

  /* EXISTING USER */

  if (enteredPin === savedPin) {

    pin = savedPin;

    $("pin-input").value = "";
    msg.textContent = "";

    show("vault");
    renderVault();

  } else {

    msg.textContent = "❌ WRONG PIN";
    $("pin-input").value = "";
  }
}

$("btn-open").addEventListener("click", submitPin);

$("pin-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    submitPin();
  }
});

/* =========================
   LOCK
========================= */

$("btn-lock").addEventListener("click", () => {
  show("calc");
});

/* =========================
   VAULT PHOTOS
========================= */

function savePhotos() {
  localStorage.setItem(STORE_KEY, JSON.stringify(photos));
}

function renderVault() {

  $("vault-grid").replaceChildren();

  if (photos.length === 0) {

    const p = document.createElement("div");

    p.className = "photo-empty";
    p.textContent = "No photos yet.";

    $("vault-grid").appendChild(p);

    return;
  }

  for (const src of photos) {

    const card = document.createElement("button");

    card.className = "photo-card";

    const img = document.createElement("img");

    img.src = src;
    img.alt = "vault photo";

    card.appendChild(img);

    card.addEventListener("click", () => {
      openPhoto(src);
    });

    $("vault-grid").appendChild(card);
  }
}

function openPhoto(src) {

  $("photo-full").src = src;

  show("photo");
}

$("btn-photo-back").addEventListener("click", () => {

  $("photo-full").src = "";

  renderVault();

  show("vault");
});

$("btn-add").addEventListener("click", () => {

  $("file-input").click();
});

$("file-input").addEventListener("change", (e) => {

  const file = e.target.files[0];

  e.target.value = "";

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {

    if (!photos.includes(reader.result)) {
      photos.push(reader.result);
    }

    savePhotos();

    renderVault();

    show("vault");
  };

  reader.readAsDataURL(file);
});

/* =========================
   CHANGE PIN
========================= */

$("btn-change-pin").addEventListener("click", () => {

  $("cp-old").value = "";
  $("cp-new").value = "";
  $("cp-confirm").value = "";
  $("cp-msg").textContent = "";

  show("changepin");
});

$("btn-save-pin").addEventListener("click", () => {

  const msg = $("cp-msg");

  const oldPin = $("cp-old").value.trim();
  const newPin = $("cp-new").value.trim();
  const confirmPin = $("cp-confirm").value.trim();

  const savedPin = localStorage.getItem(PIN_KEY);

  if (oldPin !== savedPin) {

    msg.textContent = "❌ CURRENT PIN IS WRONG";

    return;
  }

  if (!/^\d+$/.test(newPin) || newPin.length < 4) {

    msg.textContent = "❌ PIN MUST BE AT LEAST 4 DIGITS";

    return;
  }

  if (newPin !== confirmPin) {

    msg.textContent = "❌ NEW PINS DON'T MATCH";

    return;
  }

  localStorage.setItem(PIN_KEY, newPin);

  pin = newPin;

  msg.textContent = "✅ PIN CHANGED SUCCESSFULLY";

  msg.style.color = "#0db76d";

  $("cp-old").value = "";
  $("cp-new").value = "";
  $("cp-confirm").value = "";
});

$("btn-back-vault").addEventListener("click", () => {

  renderVault();

  show("vault");
});

/* =========================
   START APP
========================= */

renderDisplay();
renderVault();
show("calc");
