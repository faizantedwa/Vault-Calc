document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       BASIC HELPERS
    ========================================================= */

    function get(id) {
        return document.getElementById(id);
    }

    function showScreen(id) {

        var all = [
            "screen-calculator",
            "screen-history",
            "screen-login",
            "screen-vault",
            "screen-changepin",
            "screen-photo"
        ];

        for (var i = 0; i < all.length; i++) {

            var element = get(all[i]);

            if (element) {

                if (all[i] === id) {
                    element.classList.remove("hidden");
                } else {
                    element.classList.add("hidden");
                }
            }
        }

        if (window.VaultAndroid) {
            try {
                window.VaultAndroid.setCurrentScreen(id);
            } catch (e) {}
        }
    }


    /* =========================================================
       SCREEN HISTORY / BACK
    ========================================================= */

    var currentScreen = "screen-calculator";

    function goTo(id) {
        currentScreen = id;
        showScreen(id);
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
            expression === "" ||
            expression === "ERROR"
        ) {
            return;
        }

        var original = expression;

        var math = expression
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
                    "return (" + math + ")"
                )();


            if (!isFinite(result)) {
                throw new Error();
            }


            history.push(
                original + " = " + result
            );


            expression =
                String(result);

        } catch (error) {

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

                    goTo(
                        "screen-history"
                    );

                    return;
                }


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


                goTo(
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

                goTo(
                    "screen-calculator"
                );
            }
        );
    }


    /* =========================================================
       PIN SYSTEM
    ========================================================= */

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


        goTo(
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


            if (loginMessage) {

                loginMessage.textContent =
                    "✅ PIN CREATED";
            }


            renderVault();


            goTo(
                "screen-vault"
            );


            return;
        }


        if (entered === savedPin) {

            pinInput.value = "";


            if (loginMessage) {
                loginMessage.textContent = "";
            }


            renderVault();


            goTo(
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
            function () {

                handlePin();
            }
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
            function () {

                goTo(
                    "screen-calculator"
                );
            }
        );
    }


    /* =========================================================
       PRIVATE VAULT
    ========================================================= */

    var PHOTOS_KEY =
        "vault_calc_photos";


    var photos = [];


    try {

        var storedPhotos =
            localStorage.getItem(
                PHOTOS_KEY
            );


        if (storedPhotos) {

            photos =
                JSON.parse(
                    storedPhotos
                );
        }


        if (!Array.isArray(photos)) {
            photos = [];
        }

    } catch (error) {

        photos = [];
    }


    /*
      Old localStorage photos are kept for compatibility.
      New photos are stored by Android private storage.
    */


    function savePhotos() {

        try {

            localStorage.setItem(
                PHOTOS_KEY,
                JSON.stringify(photos)
            );

        } catch (error) {

            /*
              New private-storage photos don't
              depend on localStorage.
            */
        }
    }


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
                "No photos yet. Tap ADD PHOTO.";


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
        imageData,
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


        /*
          imageData can now be:
          - old data URL
          - Android private file URL
        */


        image.src =
            imageData;


        image.alt =
            "Private photo";


        image.addEventListener(
            "click",
            function () {

                var full =
                    get("photo-full");


                if (full) {

                    full.src =
                        imageData;
                }


                goTo(
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


        deleteButton.textContent =
            "DELETE";


        deleteButton.className =
            "photo-delete";


        deleteButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                if (
                    !confirm(
                        "Delete this photo?"
                    )
                ) {
                    return;
                }


                var item =
                    photos[index];


                /*
                  Ask Android to delete the
                  private vault file.
                */


                if (
                    window.VaultAndroid &&
                    typeof window.VaultAndroid
                        .deleteVaultPhoto ===
                        "function"
                ) {

                    try {

                        window.VaultAndroid
                            .deleteVaultPhoto(
                                item
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
        );


        card.appendChild(
            deleteButton
        );


        grid.appendChild(
            card
        );
    }


    /* =========================================================
       ADD PHOTO
    ========================================================= */

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


                /*
                  Multiple selection.
                */


                fileInput.multiple = true;

                fileInput.accept =
                    "image/*";


                fileInput.value = "";


                fileInput.click();
            }
        );
    }


    if (fileInput) {

        fileInput.multiple = true;

        fileInput.accept =
            "image/*";


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


                processSelectedPhotos(
                    files
                );
            }
        );
    }


    function processSelectedPhotos(
        files
    ) {

        var completed = 0;

        var total =
            files.length;


        /*
          Read every selected image.
        */


        for (
            var f = 0;
            f < total;
            f++
        ) {

            readPhoto(
                files[f],
                f,
                function () {

                    completed++;


                    if (
                        completed ===
                        total
                    ) {

                        savePhotos();

                        renderVault();

                        goTo(
                            "screen-vault"
                        );


                        /*
                          Tell Android that the
                          selected originals may
                          be moved/deleted after
                          user confirmation.
                        */


                        if (
                            window.VaultAndroid &&
                            typeof window.VaultAndroid
                                .requestMoveToVault ===
                                "function"
                        ) {

                            try {

                                window.VaultAndroid
                                    .requestMoveToVault();

                            } catch (e) {}
                        }
                    }
                }
            );
        }
    }


    function readPhoto(
        file,
        index,
        finished
    ) {

        if (
            !file.type ||
            file.type.indexOf("image/") !== 0
        ) {

            finished();

            return;
        }


        var reader =
            new FileReader();


        reader.onload =
            function () {

                /*
                  Native Android gets the actual
                  private copy.
                */


                var data =
                    reader.result;


                var privatePath =
                    "";


                if (
                    window.VaultAndroid &&
                    typeof window.VaultAndroid
                        .savePrivatePhoto ===
                        "function"
                ) {

                    try {

                        privatePath =
                            window.VaultAndroid
                                .savePrivatePhoto(
                                    data,
                                    file.name
                                );

                    } catch (e) {

                        privatePath = "";
                    }
                }


                /*
                  If native storage succeeded,
                  use the private file.

                  Otherwise keep compatibility
                  with the old system.
                */


                if (privatePath) {

                    photos.push(
                        privatePath
                    );

                } else {

                    photos.push(
                        data
                    );
                }


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


    /* =========================================================
       LOCK
    ========================================================= */

    var lockButton =
        get("btn-lock");


    if (lockButton) {

        lockButton.addEventListener(
            "click",
            function () {

                goTo(
                    "screen-calculator"
                );
            }
        );
    }


    /* =========================================================
       CHANGE PIN
    ========================================================= */

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


                goTo(
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

                var oldPin =
                    get("cp-old").value;

                var newPin =
                    get("cp-new").value;

                var confirmPin =
                    get("cp-confirm").value;

                var message =
                    get("cp-msg");


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


                get("cp-old").value = "";
                get("cp-new").value = "";
                get("cp-confirm").value = "";


                message.textContent =
                    "✅ PIN CHANGED SUCCESSFULLY";
            }
        );
    }


    /* =========================================================
       BACK FROM CHANGE PIN
    ========================================================= */

    var backChangePin =
        get("btn-back-changepin");


    if (backChangePin) {

        backChangePin.addEventListener(
            "click",
            function () {

                renderVault();

                goTo(
                    "screen-vault"
                );
            }
        );
    }


    /* =========================================================
       BACK FROM VAULT
    ========================================================= */

    var backVault =
        get("btn-back-vault");


    if (backVault) {

        backVault.addEventListener(
            "click",
            function () {

                goTo(
                    "screen-calculator"
                );
            }
        );
    }


    /* =========================================================
       PHOTO BACK
    ========================================================= */

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


                renderVault();


                goTo(
                    "screen-vault"
                );
            }
        );
    }


    /* =========================================================
       ANDROID BACK BUTTON
    ========================================================= */

    /*
      MainActivity will call this function when
      Android Back is pressed.
    */


    window.handleAndroidBack =
        function () {

            var active = currentScreen;


            if (
                active ===
                "screen-photo"
            ) {

                if (photoBack) {
                    photoBack.click();
                }

                return;
            }


            if (
                active ===
                "screen-changepin"
            ) {

                if (backChangePin) {
                    backChangePin.click();
                }

                return;
            }


            if (
                active ===
                "screen-vault"
            ) {

                if (backVault) {
                    backVault.click();
                }

                return;
            }


            if (
                active ===
                "screen-login"
            ) {

                if (backLogin) {
                    backLogin.click();
                }

                return;
            }


            if (
                active ===
                "screen-history"
            ) {

                if (backCalculator) {
                    backCalculator.click();
                }

                return;
            }


            /*
              Calculator is the root screen.
              At root, Android can finish the app.
            */

            if (window.VaultAndroid) {

                try {
                    window.VaultAndroid.finishApp();
                } catch (e) {}
            }
        };


    /* =========================================================
       START
    ========================================================= */

    updateDisplay();

    renderVault();

    goTo(
        "screen-calculator"
    );

});
