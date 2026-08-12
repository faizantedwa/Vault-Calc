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

        window.scrollTo(0, 0);
    }

    function safeButton(id, fn) {
        var btn = get(id);

        if (!btn) return;

        btn.type = "button";

        btn.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();
                fn();
            },
            false
        );
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

            var result = Function(
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

        calculatorButtons[i].type = "button";

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

    safeButton(
        "btn-history",
        function () {

            var historyList =
                get("history-list");

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
                        var h = history.length - 1;
                        h >= 0;
                        h--
                    ) {

                        var item =
                            document.createElement("div");

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

            showScreen("screen-history");
        }
    );


    safeButton(
        "btn-clear-history",
        function () {

            history = [];

            var historyList =
                get("history-list");

            if (historyList) {
                historyList.innerHTML = "";
            }

            showScreen("screen-history");
        }
    );


    safeButton(
        "btn-back-calc",
        function () {
            showScreen("screen-calculator");
        }
    );


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

        showScreen("screen-login");
    }


    safeButton(
        "btn-vault",
        function () {
            preparePinScreen();
        }
    );


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

            showScreen("screen-vault");

            return;
        }

        if (entered === savedPin) {

            pinInput.value = "";

            renderVault();

            showScreen("screen-vault");

        } else {

            pinInput.value = "";

            if (loginMessage) {
                loginMessage.textContent =
                    "❌ WRONG PIN";
            }
        }
    }


    safeButton(
        "btn-open",
        function () {
            handlePin();
        }
    );


    if (pinInput) {

        pinInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {
                    event.preventDefault();
                    handlePin();
                }
            }
        );
    }


    safeButton(
        "btn-back-login",
        function () {
            showScreen("screen-calculator");
        }
    );


    /* =========================
       PRIVATE VAULT STORAGE
    ========================= */

    var PHOTOS_KEY =
        "vault_calc_private_photos";

    var photos = [];

    try {

        var stored =
            localStorage.getItem(PHOTOS_KEY);

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

            grid.appendChild(empty);

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


    function createPhotoCard(
        photo,
        index
    ) {

        var grid =
            get("vault-grid");

        if (!grid) {
            return;
        }

        var card =
            document.createElement("div");

        card.className =
            "photo-card";


        var image =
            document.createElement("img");

        image.src =
            photo.data;

        image.alt =
            "Private photo";


        image.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                var full =
                    get("photo-full");

                if (full) {
                    full.src = photo.data;
                }

                showScreen("screen-photo");
            }
        );


        card.appendChild(image);


        var deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "photo-delete";

        deleteButton.textContent =
            "DELETE";


        deleteButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                if (
                    confirm(
                        "Remove this photo from the vault?"
                    )
                ) {

                    if (
                        window.VaultAndroid &&
                        photo.androidPath
                    ) {

                        try {

                            window.VaultAndroid
                                .deleteVaultPhoto(
                                    photo.androidPath
                                );

                        } catch (e) {}
                    }


                    photos.splice(
                        index,
                        1
                    );

                    savePhotos();

                    renderVault();
                }
            }
        );


        card.appendChild(
            deleteButton
        );

        grid.appendChild(card);
    }


    /* =========================
       ADD MULTIPLE PHOTOS
    ========================= */

    var addPhotoButton =
        get("btn-add");

    var fileInput =
        get("file-input");


    if (fileInput) {

        fileInput.multiple = true;

        fileInput.setAttribute(
            "multiple",
            "multiple"
        );

        fileInput.setAttribute(
            "accept",
            "image/*"
        );
    }


    safeButton(
        "btn-add",
        function () {

            if (!fileInput) {

                alert(
                    "Photo picker unavailable."
                );

                return;
            }

            fileInput.value = "";

            fileInput.multiple = true;

            fileInput.click();
        }
    );


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            function () {

                var files =
                    this.files;

                if (
                    !files ||
                    files.length === 0
                ) {
                    return;
                }


                var total =
                    files.length;

                var completed = 0;

                var added = 0;


                for (
                    var i = 0;
                    i < total;
                    i++
                ) {

                    readPhoto(
                        files[i],
                        function (photo) {

                            completed++;

                            if (photo) {

                                photos.push(
                                    photo
                                );

                                added++;
                            }


                            if (
                                completed === total
                            ) {

                                savePhotos();

                                renderVault();

                                showScreen(
                                    "screen-vault"
                                );


                                if (
                                    added > 0 &&
                                    window.VaultAndroid
                                ) {

                                    setTimeout(
                                        function () {

                                            var answer =
                                                confirm(
                                                    added +
                                                    " photo(s) copied to Private Vault.\n\nDo you want Android to ask for permission to remove the original photos from Gallery?"
                                                );

                                            if (answer) {

                                                try {

                                                    window.VaultAndroid
                                                        .requestMoveToVault();

                                                } catch (e) {

                                                    alert(
                                                        "Android could not open the deletion confirmation."
                                                    );
                                                }
                                            }
                                        },
                                        400
                                    );
                                }
                            }
                        }
                    );
                }
            }
        );
    }


    function readPhoto(
        file,
        finished
    ) {

        if (
            !file ||
            !file.type ||
            file.type.indexOf("image/") !== 0
        ) {

            finished(null);
            return;
        }


        var reader =
            new FileReader();


        reader.onload =
            function () {

                var data =
                    reader.result;

                var androidPath = "";


                if (
                    window.VaultAndroid &&
                    window.VaultAndroid.savePrivatePhoto
                ) {

                    try {

                        androidPath =
                            window.VaultAndroid
                                .savePrivatePhoto(
                                    data,
                                    file.name
                                );

                    } catch (e) {

                        androidPath = "";
                    }
                }


                finished({
                    data: data,
                    name: file.name,
                    androidPath: androidPath
                });
            };


        reader.onerror =
            function () {
                finished(null);
            };


        reader.readAsDataURL(file);
    }


    /* =========================
       LOCK
    ========================= */

    safeButton(
        "btn-lock",
        function () {
            showScreen("screen-calculator");
        }
    );


    /* =========================
       CHANGE PIN
    ========================= */

    safeButton(
        "btn-change-pin",
        function () {

            var oldField =
                get("cp-old");

            var newField =
                get("cp-new");

            var confirmField =
                get("cp-confirm");

            var message =
                get("cp-msg");


            if (oldField) oldField.value = "";
            if (newField) newField.value = "";
            if (confirmField) confirmField.value = "";
            if (message) message.textContent = "";


            showScreen(
                "screen-changepin"
            );
        }
    );


    safeButton(
        "btn-save-pin",
        function () {

            var oldField =
                get("cp-old");

            var newField =
                get("cp-new");

            var confirmField =
                get("cp-confirm");

            var message =
                get("cp-msg");


            if (
                !oldField ||
                !newField ||
                !confirmField ||
                !message
            ) {
                return;
            }


            var oldPin =
                oldField.value;

            var newPin =
                newField.value;

            var confirmPin =
                confirmField.value;


            if (oldPin !== savedPin) {

                message.textContent =
                    "❌ CURRENT PIN IS WRONG";

                return;
            }


            if (
                !/^[0-9]{4,}$/.test(
                    newPin
                )
            ) {

                message.textContent =
                    "❌ NEW PIN MUST BE 4+ DIGITS";

                return;
            }


            if (
                newPin !== confirmPin
            ) {

                message.textContent =
                    "❌ NEW PINS DON'T MATCH";

                return;
            }


            savedPin =
                newPin;

            localStorage.setItem(
                PIN_KEY,
                savedPin
            );


            oldField.value = "";
            newField.value = "";
            confirmField.value = "";


            message.textContent =
                "✅ PIN CHANGED SUCCESSFULLY";
        }
    );


    /* CHANGE PIN BACK */

    safeButton(
        "btn-back-vault",
        function () {

            var oldField =
                get("cp-old");

            var newField =
                get("cp-new");

            var confirmField =
                get("cp-confirm");

            var message =
                get("cp-msg");


            if (oldField) oldField.value = "";
            if (newField) newField.value = "";
            if (confirmField) confirmField.value = "";
            if (message) message.textContent = "";


            renderVault();

            showScreen(
                "screen-vault"
            );
        }
    );


    /* =========================
       PHOTO BACK
    ========================= */

    safeButton(
        "btn-photo-back",
        function () {

            var full =
                get("photo-full");

            if (full) {
                full.src = "";
            }

            renderVault();

            showScreen(
                "screen-vault"
            );
        }
    );


    /* =========================
       ANDROID BACK
    ========================= */

    window.handleAndroidBack =
        function () {

            var screens = [
                "screen-calculator",
                "screen-history",
                "screen-login",
                "screen-vault",
                "screen-changepin",
                "screen-photo"
            ];

            var current = "";

            for (
                var i = 0;
                i < screens.length;
                i++
            ) {

                var el =
                    get(screens[i]);

                if (
                    el &&
                    !el.classList.contains("hidden")
                ) {

                    current =
                        screens[i];

                    break;
                }
            }


            if (
                current === "screen-history" ||
                current === "screen-login"
            ) {

                showScreen(
                    "screen-calculator"
                );

                return;
            }


            if (
                current === "screen-vault"
            ) {

                showScreen(
                    "screen-calculator"
                );

                return;
            }


            if (
                current === "screen-changepin"
            ) {

                renderVault();

                showScreen(
                    "screen-vault"
                );

                return;
            }


            if (
                current === "screen-photo"
            ) {

                var full =
                    get("photo-full");

                if (full) {
                    full.src = "";
                }

                renderVault();

                showScreen(
                    "screen-vault"
                );

                return;
            }


            /*
             * Calculator:
             * do nothing.
             * Android back will NOT close the app
             * through this JavaScript handler.
             */
        };


    /* =========================
       START
    ========================= */

    updateDisplay();

    renderVault();

    showScreen(
        "screen-calculator"
    );

});
