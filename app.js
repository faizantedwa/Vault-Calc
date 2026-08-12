const $ = (id) => document.getElementById(id);

const STORE_KEY = "calcvault.photos.v1";
const PIN_KEY = "calcvault.pin.v1";
const DEFAULT_PIN = "1234";

const screens = {
  calc: $("screen-calculator"),
  history: $("screen-history"),
  login: $("screen-login"),
  vault: $("screen-vault"),
  changepin: $("screen-changepin"),
  photo: $("screen-photo"),
};

let pin = localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
let photos = [];
try {
  photos = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
} catch {}
if (!Array.isArray(photos)) photos = [];

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

function appendKey(value) {
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
  if (!original || original === "ERROR") return;

  let expr = original;

  for (const k of Object.keys(MAPPING)) {
    expr = expr.split(k).join(MAPPING[k]);
  }

  // केवल numbers, decimal point और calculator operators की अनुमति
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    calcExpr = "ERROR";
    renderDisplay();
    return;
  }

  // लगातार dangerous operators रोकें
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
      calcExpr = calcExpr.slice(0, -1);
      renderDisplay();
    } else if (k === "=") {
      evaluate();
    } else {
      appendKey(k);
    }
  });
});

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

$("btn-back-calc").addEventListener("click", () => show("calc"));

$("btn-vault").addEventListener("click", () => show("login"));

$("btn-back-login").addEventListener("click", () => {
  $("pin-input").value = "";
  $("login-msg").textContent = "";
  show("calc");
});

function submitPin() {
  const msg = $("login-msg");

  if ($("pin-input").value === pin) {
    msg.textContent = "";
    $("pin-input").value = "";
    show("vault");
  } else {
    msg.textContent = "❌ WRONG PIN";
    $("pin-input").value = "";
  }
}

$("btn-open").addEventListener("click", submitPin);

$("pin-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitPin();
});

$("btn-lock").addEventListener("click", () => show("calc"));

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

    card.addEventListener("click", () => openPhoto(src));

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

  if (!file) return;

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

$("btn-change-pin").addEventListener("click", () => {
  $("cp-old").value = "";
  $("cp-new").value = "";
  $("cp-confirm").value = "";
  $("cp-msg").textContent = "";
  show("changepin");
});

$("btn-save-pin").addEventListener("click", () => {
  const msg = $("cp-msg");

  const oldPin = $("cp-old").value;
  const newPin = $("cp-new").value;
  const confirmPin = $("cp-confirm").value;

  if (oldPin !== pin) {
    msg.textContent = "❌ CURRENT PIN IS WRONG";
    return;
  }

  if (!/^\d+$/.test(newPin) || newPin.length < 4) {
    msg.textContent = "❌ PIN MUST BE 4+ DIGITS";
    return;
  }

  if (newPin !== confirmPin) {
    msg.textContent = "❌ NEW PINS DON'T MATCH";
    return;
  }

  pin = newPin;
  localStorage.setItem(PIN_KEY, pin);

  msg.textContent = "✅ PIN SAVED SUCCESSFULLY";
  msg.style.color = "#0db76d";

  $("cp-old").value = "";
  $("cp-new").value = "";
  $("cp-confirm").value = "";
});

$("btn-back-vault").addEventListener("click", () => {
  renderVault();
  show("vault");
});

renderDisplay();
renderVault();
show("calc");
