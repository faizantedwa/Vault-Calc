document.addEventListener("DOMContentLoaded", function () {

    function get(id) {
        return document.getElementById(id);
    }

    /* =========================
       SCREEN NAVIGATION
    ========================= */

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

            var el = get(screens[i]);

            if (!el) continue;

            if (screens[i] === id) {
                el.classList.remove("hidden");
            } else {
                el.classList.add("hidden");
            }
        }

        /*
         * Photo screen पर बड़े RESTORE और DELETE
         * buttons बिल्कुल नहीं रहने देंगे.
         */
        if (id === "screen-photo") {
            removeLargePhotoButtons();
        }
    }


    function removeLargePhotoButtons() {

        var photoScreen =
            get("screen-photo");

        if (!photoScreen) return;

        var buttons =
            photoScreen.querySelectorAll("button");

        for (var i = 0; i < buttons.length; i++) {

            var text =
                (buttons[i].textContent || "")
                    .trim()
                    .toUpperCase();

            if (
                text.indexOf("RESTORE") !== -1 ||
                text.indexOf("DELETE") !== -1
            ) {

                buttons[i].remove();
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

        var original =
            expression;

        var math =
            expression
                .replace(/×/g, "*")
                .replace(/÷/g, "/")
                .replace(/−/g, "-");


        if (
            !/^[0-9+\-*/(). ]+$/.test(math)
        ) {

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


            expression =
                String(result);


        } catch (e) {

            expression =
                "ERROR";
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

        calculatorButtons[i]
            .addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    var value =
                        this.getAttribute(
                            "data-k"
                        );


                    if (value === "C") {

                        clearCalculator();

                    } else if (
                        value === "⌫"
                    ) {

                        deleteLast();

                    } else if (
                        value === "="
                    ) {

                        calculateResult();

                    } else {

                        addToCalculator(
                            value
                        );
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
            function (event) {

                event.preventDefault();

                if (historyList) {

                    historyList.innerHTML = "";


                    if (history.length === 0) {

                        var empty =
                            document.createElement(
                                "div"
                            );

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
            function (event) {

                event.preventDefault();

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
                event.stopPropagation();

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
        localStorage.getItem(
            PIN_KEY
        ) || "";


    var vaultButton =
        get("btn-vault");

    var pinInput =
        get("pin-input");

    var openButton =
        get("btn-open");

    var loginMessage =
        get("login-msg");


    function preparePinScreen() {

        if (
            !pinInput ||
            !openButton
        ) {
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


        var entered =
            pinInput.value;


        if (savedPin === "") {

            if (
                !/^[0-9]{4,}$/.test(
                    entered
                )
            ) {

                if (loginMessage) {

                    loginMessage.textContent =
                        "❌ PIN must contain at least 4 digits.";
                }

                return;
            }


            savedPin =
                entered;


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


        if (
            entered === savedPin
        ) {

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

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    handlePin();
                }
            }
        );
    }


    /* LOGIN BACK */

    var backLogin =
        get("btn-back-login");


    if (backLogin) {

        backLogin.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                showScreen(
                    "screen-calculator"
                );
            }
        );
    }


    /* =========================
       PRIVATE PHOTOS
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

            photos =
                JSON.parse(stored);
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
                document.createElement(
                    "div"
                );

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
    ) {

        var grid =
            get("vault-grid");


        if (!grid) {
            return;
        }


        var card =
            document.createElement(
                "div"
            );

        card.className =
            "photo-card";


        var image =
            document.createElement(
                "img"
            );


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

                    full.src =
                        photo.data;
                }


                /*
                 * Full photo screen:
                 * no large Restore/Delete.
                 */

                showScreen(
                    "screen-photo"
                );


                removeLargePhotoButtons();
            }
        );


        card.appendChild(
            image
        );


        /* =========================
           SMALL RESTORE BUTTON
           ========================= */

        var restoreButton =
            document.createElement(
                "button"
            );


        restoreButton.type =
            "button";

        restoreButton.className =
            "photo-restore";

        restoreButton.textContent =
            "RESTORE";


        restoreButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();


                if (
                    !photo.androidPath
                ) {

                    alert(
                        "This photo cannot be restored because its private copy is missing."
                    );

                    return;
                }


                if (
                    !window.VaultAndroid ||
                    !window.VaultAndroid
                        .restorePrivatePhoto
                ) {

                    alert(
                        "Restore is unavailable on this build."
                    );

                    return;
                }


                var ok =
                    confirm(
                        "Restore this photo to your Gallery?"
                    );


                if (!ok) {
                    return;
                }


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


                    photos.splice(
                        index,
                        1
                    );


                    savePhotos();

                    renderVault();


                    alert(
                        "✅ Photo restored to Gallery."
                    );


                } else {

                    alert(
                        "❌ Could not restore this photo."
                    );
                }
            }
        );


        card.appendChild(
            restoreButton
        );


        /* =========================
           SMALL DELETE BUTTON
           ========================= */

        var deleteButton =
            document.createElement(
                "button"
            );


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


                photos.splice(
                    index,
                    1
                );


                savePhotos();

                renderVault();
            }
        );


        card.appendChild(
            deleteButton
        );


        grid.appendChild(
            card
        );
    }


    /* =========================
       ADD MULTIPLE PHOTOS
    ========================= */

    var addPhotoButton =
        get("btn-add");

    var fileInput =
        get("file-input");


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
                                completed ===
                                total
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

                                                window.VaultAndroid
                                                    .requestMoveToVault();
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


    function readPhoto(
        file,
        finished
    ) {

        if (
            !file ||
            !file.type ||
            file.type.indexOf(
                "image/"
            ) !== 0
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

                var androidPath =
                    "";


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


        reader.readAsDataURL(
            file
        );
    }


    /* =========================
       LOCK
    ========================= */

    var lockButton =
        get("btn-lock");


    if (lockButton) {

        lockButton.addEventListener(
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
       CHANGE PIN
    ========================= */

    var changePinButton =
        get("btn-change-pin");


    if (changePinButton) {

        changePinButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();


                var oldField =
                    get("cp-old");

                var newField =
                    get("cp-new");

                var confirmField =
                    get("cp-confirm");

                var message =
                    get("cp-msg");


                if (oldField) {
                    oldField.value = "";
                }

                if (newField) {
                    newField.value = "";
                }

                if (confirmField) {
                    confirmField.value = "";
                }

                if (message) {
                    message.textContent = "";
                }


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


                if (
                    oldPin !== savedPin
                ) {

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
    }


    /* =========================
       CHANGE PIN BACK
       ========================= */

    function goBackToVault(event) {

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        renderVault();

        showScreen(
            "screen-vault"
        );
    }


    var backVault =
        get("btn-back-vault");


    if (backVault) {

        backVault.addEventListener(
            "click",
            goBackToVault
        );
    }


    /* =========================
       PHOTO BACK
       ========================= */

    var photoBack =
        get("btn-photo-back");


    if (photoBack) {

        photoBack.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();


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
    }


    /* =========================
       EXTRA BACK SAFETY
    ========================= */

    document.addEventListener(
        "click",
        function (event) {

            var target =
                event.target;


            if (!target) {
                return;
            }


            var id =
                target.id || "";


            if (
                id === "btn-back-vault"
            ) {

                goBackToVault(event);

                return;
            }


            if (
                id === "btn-back-calc"
            ) {

                event.preventDefault();
                event.stopPropagation();

                showScreen(
                    "screen-calculator"
                );

                return;
            }


            if (
                id === "btn-back-login"
            ) {

                event.preventDefault();
                event.stopPropagation();

                showScreen(
                    "screen-calculator"
                );

                return;
            }


            if (
                id === "btn-photo-back"
            ) {

                event.preventDefault();
                event.stopPropagation();

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
        },
        true
    );


    /* =========================
       ANDROID BACK
    ========================= */

    window.handleAndroidBack =
        function () {

            var current =
                "screen-calculator";


            for (
                var i = 0;
                i < screens.length;
                i++
            ) {

                var el =
                    get(screens[i]);


                if (
                    el &&
                    !el.classList.contains(
                        "hidden"
                    )
                ) {

                    current =
                        screens[i];

                    break;
                }
            }


            if (
                current ===
                "screen-history"
            ) {

                showScreen(
                    "screen-calculator"
                );

                return;
            }


            if (
                current ===
                "screen-login"
            ) {

                showScreen(
                    "screen-calculator"
                );

                return;
            }


            if (
                current ===
                "screen-vault"
            ) {

                showScreen(
                    "screen-calculator"
                );

                return;
            }


            if (
                current ===
                "screen-changepin"
            ) {

                renderVault();

                showScreen(
                    "screen-vault"
                );

                return;
            }


            if (
                current ===
                "screen-photo"
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
