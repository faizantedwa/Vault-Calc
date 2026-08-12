document.addEventListener("DOMContentLoaded", function () {

    /* ==============================
       HELPERS
    ============================== */

    function get(id) {
        return document.getElementById(id);
    }

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

            var element = get(screens[i]);

            if (!element) {
                continue;
            }

            if (screens[i] === id) {
                element.classList.remove("hidden");
            } else {
                element.classList.add("hidden");
            }
        }

        window.currentScreen = id;
    }


    window.currentScreen =
        "screen-calculator";


    /* ==============================
       CALCULATOR
    ============================== */

    var display = get("display");

    var expression = "";

    var history = [];


    function updateDisplay() {

        if (!display) {
            return;
        }

        display.textContent =
            expression === ""
                ? "0"
                : expression;
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
            expression === "" ||
            expression === "ERROR"
        ) {
            return;
        }

        var original =
            expression;

        var math =
            expression
                .split("×").join("*")
                .split("÷").join("/")
                .split("−").join("-");


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
                throw new Error(
                    "Invalid result"
                );
            }


            history.push(
                original +
                " = " +
                result
            );


            expression =
                String(result);


        } catch (error) {

            expression = "ERROR";
        }


        updateDisplay();
    }


    var calculatorButtons =
        document.querySelectorAll(
            ".key"
        );


    for (
        var i = 0;
        i < calculatorButtons.length;
        i++
    ) {

        calculatorButtons[i]
            .addEventListener(
                "click",
                function () {

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


    /* ==============================
       HISTORY
    ============================== */

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

                if (!historyList) {

                    showScreen(
                        "screen-history"
                    );

                    return;
                }


                historyList.innerHTML = "";


                if (
                    history.length === 0
                ) {

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
            function () {

                showScreen(
                    "screen-calculator"
                );
            }
        );
    }


    /* ==============================
       PIN
    ============================== */

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

                loginMessage.textContent =
                    "";
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


            if (loginMessage) {
                loginMessage.textContent =
                    "";
            }


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

                if (
                    event.key === "Enter"
                ) {

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
            function () {

                showScreen(
                    "screen-calculator"
                );
            }
        );
    }


    /* ==============================
       PHOTO STORAGE
    ============================== */

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

    } catch (error) {

        photos = [];
    }


    function savePhotos() {

        try {

            localStorage.setItem(
                PHOTOS_KEY,
                JSON.stringify(photos)
            );

        } catch (error) {

            alert(
                "Vault storage is full. Delete some photos first."
            );
        }
    }


    /* ==============================
       VAULT RENDER
    ============================== */

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
                "No photos yet. Tap ADD PHOTOS.";


            grid.appendChild(
                empty
            );


            return;
        }


        for (
            var p = 0;
            p < photos.length;
            p++
        ) {

            createPhotoCard(
                photos[p],
                p
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
            function () {

                var full =
                    get("photo-full");


                if (full) {

                    full.src =
                        photo.data;
                }


                window.selectedPhotoIndex =
                    index;


                showScreen(
                    "screen-photo"
                );
            }
        );


        card.appendChild(
            image
        );


        var deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.className =
            "photo-delete";


        deleteButton.textContent =
            "DELETE";


        deleteButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                if (
                    !confirm(
                        "Delete this photo from the Private Vault?"
                    )
                ) {
                    return;
                }


                deletePrivatePhoto(
                    index
                );
            }
        );


        card.appendChild(
            deleteButton
        );


        grid.appendChild(
            card
        );
    }


    /* ==============================
       ADD MULTIPLE PHOTOS
    ============================== */

    var addPhotoButton =
        get("btn-add");

    var fileInput =
        get("file-input");


    if (addPhotoButton) {

        addPhotoButton.addEventListener(
            "click",
            function () {

                if (!fileInput) {

                    alert(
                        "Photo picker is unavailable."
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

                var completed =
                    0;


                for (
                    var f = 0;
                    f < files.length;
                    f++
                ) {

                    readPhoto(
                        files[f],
                        function () {

                            completed++;


                            if (
                                completed ===
                                total
                            ) {

                                savePhotos();

                                renderVault();

                                /*
                                 * Ask Android to request
                                 * deletion of selected
                                 * original files.
                                 */
                                if (
                                    window.VaultAndroid &&
                                    window.VaultAndroid
                                        .requestMoveToVault
                                ) {

                                    window.VaultAndroid
                                        .requestMoveToVault();
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

            finished();

            return;
        }


        var reader =
            new FileReader();


        reader.onload =
            function () {

                photos.push({

                    data:
                        reader.result,

                    name:
                        file.name ||
                        "photo.jpg",

                    addedAt:
                        Date.now()
                });


                finished();
            };


        reader.onerror =
            function () {

                finished();
            };


        reader.readAsDataURL(
            file
        );
    }


    /* ==============================
       DELETE FROM VAULT
    ============================== */

    function deletePrivatePhoto(
        index
    ) {

        if (
            index < 0 ||
            index >= photos.length
        ) {
            return;
        }


        var photo =
            photos[index];


        if (
            photo &&
            photo.androidPath &&
            window.VaultAndroid &&
            window.VaultAndroid
                .deleteVaultPhoto
        ) {

            window.VaultAndroid
                .deleteVaultPhoto(
                    photo.androidPath
                );
        }


        photos.splice(
            index,
            1
        );


        savePhotos();


        renderVault();


        showScreen(
            "screen-vault"
        );
    }


    /* ==============================
       RESTORE TO GALLERY
    ============================== */

    var restoreButton =
        get("btn-restore");


    if (restoreButton) {

        restoreButton.addEventListener(
            "click",
            function () {

                var index =
                    window.selectedPhotoIndex;


                if (
                    typeof index !==
                    "number"
                ) {

                    return;
                }


                if (
                    index < 0 ||
                    index >= photos.length
                ) {

                    return;
                }


                var photo =
                    photos[index];


                if (
                    !photo ||
                    !photo.data
                ) {

                    alert(
                        "Photo could not be restored."
                    );

                    return;
                }


                if (
                    window.VaultAndroid &&
                    window.VaultAndroid
                        .restorePhoto
                ) {

                    var result =
                        window.VaultAndroid
                            .restorePhoto(
                                photo.data,
                                photo.name ||
                                "restored_photo.jpg"
                            );


                    if (
                        result === "OK"
                    ) {

                        alert(
                            "Photo restored to Gallery."
                        );

                    } else {

                        alert(
                            "Could not restore the photo."
                        );
                    }

                } else {

                    alert(
                        "Restore is unavailable in this APK."
                    );
                }
            }
        );
    }


    /* ==============================
       DELETE VIEWED PHOTO
    ============================== */

    var deleteViewedButton =
        get("btn-delete-photo");


    if (deleteViewedButton) {

        deleteViewedButton.addEventListener(
            "click",
            function () {

                var index =
                    window.selectedPhotoIndex;


                if (
                    typeof index !==
                    "number"
                ) {
                    return;
                }


                if (
                    !confirm(
                        "Delete this photo from the Private Vault?"
                    )
                ) {
                    return;
                }


                deletePrivatePhoto(
                    index
                );


                window.selectedPhotoIndex =
                    null;
            }
        );
    }


    /* ==============================
       LOCK
    ============================== */

    var lockButton =
        get("btn-lock");


    if (lockButton) {

        lockButton.addEventListener(
            "click",
            function () {

                showScreen(
                    "screen-calculator"
                );
            }
        );
    }


    /* ==============================
       CHANGE PIN
    ============================== */

    var changePinButton =
        get("btn-change-pin");


    if (changePinButton) {

        changePinButton.addEventListener(
            "click",
            function () {

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


    /* ==============================
       BACK BUTTONS
    ============================== */

    var backVault =
        get("btn-back-vault");


    if (backVault) {

        backVault.addEventListener(
            "click",
            function () {

                showScreen(
                    "screen-vault"
                );

                renderVault();
            }
        );
    }


    var photoBack =
        get("btn-photo-back");


    if (photoBack) {

        photoBack.addEventListener(
            "click",
            function () {

                var full =
                    get("photo-full");


                if (full) {
                    full.src = "";
                }


                showScreen(
                    "screen-vault"
                );


                renderVault();
            }
        );
    }


    /* ==============================
       ANDROID BACK
    ============================== */

    window.handleAndroidBack =
        function () {

            var current =
                window.currentScreen;


            if (
                current ===
                "screen-photo"
            ) {

                var full =
                    get("photo-full");


                if (full) {
                    full.src = "";
                }


                showScreen(
                    "screen-vault"
                );


                return;
            }


            if (
                current ===
                "screen-changepin"
            ) {

                showScreen(
                    "screen-vault"
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
                "screen-login"
            ) {

                showScreen(
                    "screen-calculator"
                );


                return;
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


            /*
             * Calculator is the home screen.
             * Do not finish the Android Activity
             * from JavaScript.
             */
        };


    /* ==============================
       START
    ============================== */

    updateDisplay();

    renderVault();

    showScreen(
        "screen-calculator"
    );

});
