document.addEventListener("DOMContentLoaded", function () {

    function get(id) {
        return document.getElementById(id);
    }

    /* =========================================================
       SCREEN NAVIGATION
    ========================================================= */

    var screens = [
        "screen-calculator",
        "screen-history",
        "screen-login",
        "screen-vault",
        "screen-changepin",
        "screen-photo"
    ];

    function showScreen(id) {

        for (var i = 0; i < screens.length; i++) {

            var screen = get(screens[i]);

            if (!screen) {
                continue;
            }

            if (screens[i] === id) {
                screen.classList.remove("hidden");
            } else {
                screen.classList.add("hidden");
            }
        }

        if (id === "screen-photo") {
            setupFullPhotoScreen();
        }
    }


    /* =========================================================
       REMOVE ONLY LARGE PHOTO-SCREEN ACTION BUTTONS
       SMALL THUMBNAIL BUTTONS ARE NOT TOUCHED
    ========================================================= */

    function removeLargePhotoButtons() {

        var photoScreen = get("screen-photo");

        if (!photoScreen) {
            return;
        }

        var buttons =
            photoScreen.querySelectorAll("button");

        for (var i = buttons.length - 1; i >= 0; i--) {

            var button = buttons[i];

            var text =
                (button.textContent || "")
                    .trim()
                    .toUpperCase();

            if (
                text === "RESTORE" ||
                text === "DELETE" ||
                text.indexOf("RESTORE") !== -1 ||
                text.indexOf("DELETE") !== -1
            ) {

                button.remove();
            }
        }
    }


    /* =========================================================
       FULL PHOTO
    ========================================================= */

    function setupFullPhotoScreen() {

        var photoScreen = get("screen-photo");
        var full = get("photo-full");

        if (!photoScreen || !full) {
            return;
        }

        removeLargePhotoButtons();

        photoScreen.style.width = "100%";
        photoScreen.style.height = "100vh";
        photoScreen.style.minHeight = "100vh";
        photoScreen.style.boxSizing = "border-box";
        photoScreen.style.overflow = "hidden";

        full.style.display = "block";
        full.style.width = "100%";
        full.style.height = "100%";
        full.style.maxWidth = "100%";
        full.style.maxHeight = "100%";
        full.style.objectFit = "contain";
        full.style.objectPosition = "center";
        full.style.margin = "0";
        full.style.padding = "0";
    }


    function openFullPhoto(photo) {

        var full = get("photo-full");

        if (!full) {
            alert("Full photo view is unavailable.");
            return;
        }

        full.onload = function () {
            setupFullPhotoScreen();
        };

        full.onerror = function () {
            alert("Could not open this photo.");
        };

        full.src = photo.data;

        showScreen("screen-photo");

        setupFullPhotoScreen();
    }


    function closeFullPhoto() {

        var full = get("photo-full");

        if (full) {
            full.onload = null;
            full.onerror = null;
            full.removeAttribute("src");
        }

        renderVault();
        showScreen("screen-vault");
    }


    /* =========================================================
       CALCULATOR
    ========================================================= */

    var display = get("display");

    var expression = "";

    var history = [];


    function updateDisplay() {

        if (display) {

            display.textContent =
                expression === ""
                    ? "0"
                    : expression;
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

        if (
            !expression ||
            expression === "ERROR"
        ) {
            return;
        }

        var original = expression;

        var math =
            expression
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
                    "return (" +
                    math +
                    ")"
                )();

            if (!isFinite(result)) {
                throw new Error();
            }

            history.push(
                original +
                " = " +
                result
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
            function (event) {

                event.preventDefault();

                var value =
                    this.getAttribute("data-k");

                if (value === "C") {

                    clearCalculator();

                } else if (value === "⌫") {

                    deleteLast();

                } else if (value === "=") {

                    calculateResult();

                } else {

                    addToCalculator(value);
                }
            }
        );
    }


    /* =========================================================
       HISTORY
    ========================================================= */

    var historyButton = get("btn-history");
    var historyList = get("history-list");
    var clearHistoryButton = get("btn-clear-history");


    if (historyButton) {

        historyButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (historyList) {

                    historyList.innerHTML = "";

                    if (history.length === 0) {

                        var empty =
                            document.createElement("div");

                        empty.className =
                            "history-item";

                        empty.textContent =
                            "No calculations yet.";

                        historyList.appendChild(empty);

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

                            historyList.appendChild(item);
                        }
                    }
                }

                showScreen("screen-history");
            }
        );
    }


    if (clearHistoryButton) {

        clearHistoryButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                history = [];

                if (historyButton) {
                    historyButton.click();
                }
            }
        );
    }


    /* =========================================================
       PIN
    ========================================================= */

    var PIN_KEY = "vault_calc_user_pin";

    var savedPin =
        localStorage.getItem(PIN_KEY) || "";

    var vaultButton = get("btn-vault");
    var pinInput = get("pin-input");
    var openButton = get("btn-open");
    var loginMessage = get("login-msg");


    function preparePinScreen() {

        if (!pinInput || !openButton) {
            return;
        }

        pinInput.value = "";

        if (savedPin === "") {

            pinInput.placeholder = "Create PIN";

            openButton.textContent =
                "🔐 CREATE PIN";

            if (loginMessage) {

                loginMessage.textContent =
                    "Create a PIN with at least 4 digits.";
            }

        } else {

            pinInput.placeholder = "Enter PIN";

            openButton.textContent =
                "🔓 OPEN VAULT";

            if (loginMessage) {
                loginMessage.textContent = "";
            }
        }

        showScreen("screen-login");
    }


    if (vaultButton) {

        vaultButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                preparePinScreen();
            }
        );
    }


    function handlePin() {

        if (!pinInput) {
            return;
        }

        var entered = pinInput.value;

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


    if (openButton) {

        openButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                handlePin();
            }
        );
    }


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


    /* =========================================================
       PHOTOS
    ========================================================= */

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


    /* =========================================================
       VAULT RENDER
    ========================================================= */

    function renderVault() {

        var grid = get("vault-grid");

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


    /* =========================================================
       PHOTO CARD
    ========================================================= */

    function createPhotoCard(photo, index) {

        var grid = get("vault-grid");

        if (!grid) {
            return;
        }


        var card =
            document.createElement("div");

        card.className =
            "photo-card";


        var image =
            document.createElement("img");

        image.src = photo.data;

        image.alt = "Private photo";


        /* THUMBNAIL CLICK = FULL PHOTO */

        image.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                openFullPhoto(photo);
            }
        );


        card.appendChild(image);


        /* =====================================================
           SMALL RESTORE
        ===================================================== */

        var restoreButton =
            document.createElement("button");

        restoreButton.type = "button";

        restoreButton.className =
            "photo-restore";

        restoreButton.textContent =
            "RESTORE";


        restoreButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                restorePhoto(
                    photo,
                    index
                );
            }
        );


        card.appendChild(
            restoreButton
        );


        /* =====================================================
           SMALL DELETE
        ===================================================== */

        var deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "photo-delete";

        deleteButton.textContent =
            "DELETE";


        deleteButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                deletePhoto(
                    photo,
                    index
                );
            }
        );


        card.appendChild(
            deleteButton
        );


        grid.appendChild(card);
    }


    /* =========================================================
       RESTORE RESULT CALLBACK
       Java calls this after Android permission is granted
    ========================================================= */

    window.__vaultRestoreResult =
        function (result) {

            if (result === "OK") {

                if (
                    window.__pendingRestoreIndex !== null &&
                    window.__pendingRestoreIndex !== undefined
                ) {

                    var index =
                        window.__pendingRestoreIndex;

                    var photo =
                        photos[index];

                    if (photo) {

                        try {

                            if (
                                window.VaultAndroid &&
                                window.VaultAndroid
                                    .deleteVaultPhoto
                            ) {

                                window.VaultAndroid
                                    .deleteVaultPhoto(
                                        photo.androidPath
                                    );
                            }

                        } catch (e) {
                        }

                        photos.splice(index, 1);

                        savePhotos();

                        renderVault();

                        alert(
                            "✅ Photo restored to Gallery."
                        );
                    }
                }

                window.__pendingRestoreIndex = null;

            } else {

                window.__pendingRestoreIndex = null;

                alert(
                    "❌ Could not restore this photo."
                );
            }
        };


    window.__pendingRestoreIndex = null;


    /* =========================================================
       RESTORE PHOTO
    ========================================================= */

    function restorePhoto(photo, index) {

        if (!photo || !photo.androidPath) {

            alert(
                "This photo cannot be restored because its private copy is missing."
            );

            return;
        }


        if (
            !window.VaultAndroid ||
            !window.VaultAndroid.restorePrivatePhoto
        ) {

            alert(
                "Restore is unavailable on this build."
            );

            return;
        }


        if (
            !confirm(
                "Restore this photo to your Gallery?"
            )
        ) {
            return;
        }


        window.__pendingRestoreIndex = index;

        var result = "";


        try {

            result =
                window.VaultAndroid
                    .restorePrivatePhoto(
                        photo.androidPath,
                        photo.name ||
                        "restored_photo.jpg"
                    );

        } catch (e) {

            result = "";
        }


        if (result === "OK") {

            window.__vaultRestoreResult("OK");

        } else if (
            result === "PERMISSION_REQUIRED"
        ) {

            /*
             * Java will call __vaultRestoreResult()
             * after the Android permission dialog.
             */

        } else {

            window.__pendingRestoreIndex = null;

            alert(
                "❌ Could not restore this photo."
            );
        }
    }


    /* =========================================================
       DELETE PHOTO
    ========================================================= */

    function deletePhoto(photo, index) {

        if (
            !confirm(
                "Permanently delete this private photo?"
            )
        ) {
            return;
        }


        if (
            window.VaultAndroid &&
            photo.androidPath
        ) {

            try {

                window.VaultAndroid
                    .deleteVaultPhoto(
                        photo.androidPath
                    );

            } catch (e) {
            }
        }


        photos.splice(index, 1);

        savePhotos();

        renderVault();
    }


    /* =========================================================
       ADD PHOTOS
    ========================================================= */

    var addPhotoButton = get("btn-add");
    var fileInput = get("file-input");


    if (fileInput) {

        fileInput.setAttribute(
            "multiple",
            "multiple"
        );

        fileInput.setAttribute(
            "accept",
            "image/*"
        );
    }


    if (addPhotoButton) {

        addPhotoButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (!fileInput) {

                    alert(
                        "Photo picker unavailable."
                    );

                    return;
                }

                fileInput.value = "";

                fileInput.click();
            }
        );
    }


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            function () {

                var files = this.files;

                if (
                    !files ||
                    files.length === 0
                ) {
                    return;
                }


                var total = files.length;
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

                                photos.push(photo);

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
                                    window.VaultAndroid &&
                                    window.VaultAndroid
                                        .requestMoveToVault
                                ) {

                                    setTimeout(
                                        function () {

                                            var answer =
                                                confirm(
                                                    "Photos copied to Private Vault.\n\nDo you want to remove the original photos from Gallery?"
                                                );

                                            if (answer) {

                                                try {

                                                    window.VaultAndroid
                                                        .requestMoveToVault();

                                                } catch (e) {
                                                }
                                            }

                                        },
                                        300
                                    );
                                }
                            }
                        }
                    );
                }
            }
        );
    }


    function readPhoto(file, finished) {

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
                    window.VaultAndroid
                        .savePrivatePhoto
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


                if (!androidPath) {

                    finished(null);

                    return;
                }


                finished({

                    data: data,

                    name: file.name,

                    androidPath:
                        androidPath
                });
            };


        reader.onerror =
            function () {

                finished(null);
            };


        reader.readAsDataURL(file);
    }


    /* =========================================================
       CHANGE PIN
    ========================================================= */

    var changePinButton =
        get("btn-change-pin");


    if (changePinButton) {

        changePinButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                var oldField = get("cp-old");
                var newField = get("cp-new");
                var confirmField = get("cp-confirm");
                var message = get("cp-msg");


                if (oldField) oldField.value = "";
                if (newField) newField.value = "";
                if (confirmField) confirmField.value = "";
                if (message) message.textContent = "";

                showScreen(
                    "screen-changepin"
                );
            }
        );
    }


    var savePinButton =
        get("btn-save-pin");


    if (savePinButton) {

        savePinButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                var oldField = get("cp-old");
                var newField = get("cp-new");
                var confirmField = get("cp-confirm");
                var message = get("cp-msg");


                if (
                    !oldField ||
                    !newField ||
                    !confirmField ||
                    !message
                ) {
                    return;
                }


                var oldPin = oldField.value;
                var newPin = newField.value;
                var confirmPin = confirmField.value;


                if (oldPin !== savedPin) {

                    message.textContent =
                        "❌ CURRENT PIN IS WRONG";

                    return;
                }


                if (!/^[0-9]{4,}$/.test(newPin)) {

                    message.textContent =
                        "❌ NEW PIN MUST BE 4+ DIGITS";

                    return;
                }


                if (newPin !== confirmPin) {

                    message.textContent =
                        "❌ NEW PINS DON'T MATCH";

                    return;
                }


                savedPin = newPin;

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
    }


    /* =========================================================
       BACK BUTTONS
    ========================================================= */

    function goCalculator() {

        showScreen(
            "screen-calculator"
        );
    }


    function goVault() {

        renderVault();

        showScreen(
            "screen-vault"
        );
    }


    var backCalc = get("btn-back-calc");

    if (backCalc) {

        backCalc.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                goCalculator();
            }
        );
    }


    var backLogin = get("btn-back-login");

    if (backLogin) {

        backLogin.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                goCalculator();
            }
        );
    }


    var backVault = get("btn-back-vault");

    if (backVault) {

        backVault.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                goVault();
            }
        );
    }


    var photoBack = get("btn-photo-back");

    if (photoBack) {

        photoBack.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                closeFullPhoto();
            }
        );
    }


    var lockButton = get("btn-lock");

    if (lockButton) {

        lockButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                goCalculator();
            }
        );
    }


    /* =========================================================
       ANDROID BACK
    ========================================================= */

    window.handleAndroidBack =
        function () {

            var current =
                "screen-calculator";


            for (
                var i = 0;
                i < screens.length;
                i++
            ) {

                var el = get(screens[i]);

                if (
                    el &&
                    !el.classList.contains("hidden")
                ) {

                    current = screens[i];

                    break;
                }
            }


            if (
                current === "screen-history"
            ) {

                goCalculator();

                return;
            }


            if (
                current === "screen-login"
            ) {

                goCalculator();

                return;
            }


            if (
                current === "screen-vault"
            ) {

                goCalculator();

                return;
            }


            if (
                current === "screen-changepin"
            ) {

                goVault();

                return;
            }


            if (
                current === "screen-photo"
            ) {

                closeFullPhoto();

                return;
            }
        };


    /* =========================================================
       START
    ========================================================= */

    updateDisplay();

    renderVault();

    showScreen(
        "screen-calculator"
    );

});
