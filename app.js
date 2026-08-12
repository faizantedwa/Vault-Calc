document.addEventListener("DOMContentLoaded", function () {

    function get(id) {
        return document.getElementById(id);
    }

    function showScreen(id) {
        var screens = [
            "screen-calculator",
            "screen-history",
            "screen-login",
            "screen-vault",
            "screen-changepin",
            "screen-photo"
        ];

        for (var i = 0; i < screens.length; i++) {
            var el = get(screens[i]);

            if (el) {
                el.classList.toggle(
                    "hidden",
                    screens[i] !== id
                );
            }
        }
    }

    /* =========================
       CALCULATOR
    ========================= */

    var display = get("display");
    var expression = "";
    var history = [];

    function updateDisplay() {
        if (display) {
            display.textContent =
                expression === "" ? "0" : expression;
        }
    }

    function addToCalculator(value) {
        if (expression === "ERROR") {
            expression = "";
        }

        expression += value;
        updateDisplay();
    }

    function clearCalculator() {
        expression = "";
        updateDisplay();
    }

    function deleteLast() {
        if (expression === "ERROR") {
            expression = "";
        } else {
            expression =
                expression.substring(
                    0,
                    expression.length - 1
                );
        }

        updateDisplay();
    }

    function calculateResult() {

        if (!expression || expression === "ERROR") {
            return;
        }

        var original = expression;

        var math = expression
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/−/g, "-");

        if (!/^[0-9+\-*/(). ]+$/.test(math)) {
            expression = "ERROR";
            updateDisplay();
            return;
        }

        try {

            var result =
                Function(
                    "return (" + math + ")"
                )();

            if (!isFinite(result)) {
                throw new Error();
            }

            history.push(
                original + " = " + result
            );

            expression = String(result);

        } catch (e) {
            expression = "ERROR";
        }

        updateDisplay();
    }

    var calculatorButtons =
        document.querySelectorAll(".key");

    for (
        var i = 0;
        i < calculatorButtons.length;
        i++
    ) {

        calculatorButtons[i].addEventListener(
            "click",
            function () {

                var value =
                    this.getAttribute("data-k");

                if (value === "C") {
                    clearCalculator();
                }
                else if (value === "⌫") {
                    deleteLast();
                }
                else if (value === "=") {
                    calculateResult();
                }
                else {
                    addToCalculator(value);
                }
            }
        );
    }


    /* =========================
       HISTORY
    ========================= */

    var historyButton =
        get("btn-history");

    var historyList =
        get("history-list");

    var clearHistoryButton =
        get("btn-clear-history");

    if (historyButton) {

        historyButton.addEventListener(
            "click",
            function () {

                if (historyList) {

                    historyList.innerHTML = "";

                    if (history.length === 0) {

                        var empty =
                            document.createElement("div");

                        empty.className =
                            "history-item";

                        empty.textContent =
                            "No calculations yet.";

                        historyList.appendChild(
                            empty
                        );

                    } else {

                        for (
                            var h =
                                history.length - 1;
                            h >= 0;
                            h--
                        ) {

                            var item =
                                document.createElement(
                                    "div"
                                );

                            item.className =
                                "history-item";

                            item.textContent =
                                history[h];

                            historyList.appendChild(
                                item
                            );
                        }
                    }
                }

                showScreen(
                    "screen-history"
                );
            }
        );
    }

    if (clearHistoryButton) {

        clearHistoryButton.addEventListener(
            "click",
            function () {

                history = [];

                if (historyButton) {
                    historyButton.click();
                }
            }
        );
    }

    var backCalculator =
        get("btn-back-calc");

    if (backCalculator) {

        backCalculator.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showScreen(
                    "screen-calculator"
                );
            }
        );
    }


    /* =========================
       PIN
    ========================= */

    var PIN_KEY =
        "vault_calc_user_pin";

    var savedPin =
        localStorage.getItem(PIN_KEY) || "";

    var vaultButton =
        get("btn-vault");

    var pinInput =
        get("pin-input");

    var openButton =
        get("btn-open");

    var loginMessage =
        get("login-msg");

    function preparePinScreen() {

        if (!pinInput || !openButton) {
            return;
        }

        pinInput.value = "";

        if (savedPin === "") {

            pinInput.placeholder =
                "Create PIN";

            openButton.textContent =
                "🔐 CREATE PIN";

            if (loginMessage) {
                loginMessage.textContent =
                    "Create a PIN with at least 4 digits.";
            }

        } else {

            pinInput.placeholder =
                "Enter PIN";

            openButton.textContent =
                "🔓 OPEN VAULT";

            if (loginMessage) {
                loginMessage.textContent = "";
            }
        }

        showScreen(
            "screen-login"
        );
    }

    if (vaultButton) {

        vaultButton.addEventListener(
            "click",
            function () {
                preparePinScreen();
            }
        );
    }

    function handlePin() {

        if (!pinInput) {
            return;
        }

        var entered =
            pinInput.value;

        if (savedPin === "") {

            if (!/^[0-9]{4,}$/.test(entered)) {

                if (loginMessage) {
                    loginMessage.textContent =
                        "❌ PIN must contain at least 4 digits.";
                }

                return;
            }

            savedPin = entered;

            localStorage.setItem(
                PIN_KEY,
                savedPin
            );

            pinInput.value = "";

            renderVault();

            showScreen(
                "screen-vault"
            );

            return;
        }

        if (entered === savedPin) {

            pinInput.value = "";

            renderVault();

            showScreen(
                "screen-vault"
            );

        } else {

            pinInput.value = "";

            if (loginMessage) {
                loginMessage.textContent =
                    "❌ WRONG PIN";
            }
        }
    }

    if (openButton) {
        openButton.addEventListener(
            "click",
            handlePin
        );
    }

    if (pinInput) {

        pinInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {
                    handlePin();
                }
            }
        );
    }

    var backLogin =
        get("btn-back-login");

    if (backLogin) {

        backLogin.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showScreen(
                    "screen-calculator"
                );
            }
        );
    }


    /* =========================
       PRIVATE VAULT STORAGE
    ========================= */

    var PHOTOS_KEY =
        "vault_calc_private_photos";

    var photos = [];

    try {

        var stored =
            localStorage.getItem(
                PHOTOS_KEY
            );

        if (stored) {
            photos = JSON.parse(stored);
        }

        if (!Array.isArray(photos)) {
            photos = [];
        }

    } catch (e) {

        photos = [];
    }

    function savePhotos() {

        try {

            localStorage.setItem(
                PHOTOS_KEY,
                JSON.stringify(photos)
            );

        } catch (e) {

            alert(
                "Storage full. Please delete some photos."
            );
        }
    }


    /* =========================
       RENDER VAULT
    ========================= */

    function renderVault() {

        var grid =
            get("vault-grid");

        if (!grid) {
            return;
        }

        grid.innerHTML = "";

        if (photos.length === 0) {

            var empty =
                document.createElement("div");

            empty.className =
                "photo-empty";

            empty.textContent =
                "No private photos yet.";

            grid.appendChild(
                empty
            );

            return;
        }

        for (
            var i = 0;
            i < photos.length;
            i++
        ) {

            createPhotoCard(
                photos[i],
                i
            );
        }
    }


    /* =========================
       PHOTO CARD
    ========================= */

    function createPhotoCard(
        photo,
        index
   
