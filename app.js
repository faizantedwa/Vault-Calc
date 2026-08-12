document.addEventListener("DOMContentLoaded", function () {

    /* ==============================
       BASIC HELPERS
    ============================== */

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
    }


    /* ==============================
       CALCULATOR
    ============================== */

    var display = get("display");
    var expression = "";
    var history = [];

    function updateDisplay() {
        if (display) {
            if (expression === "") {
                display.textContent = "0";
            } else {
                display.textContent = expression;
            }
        }
    }

    function addToCalculator(value) {

        if (expression === "ERROR") {
            expression = "";
        }

        expression = expression + value;

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
            expression = expression.substring(
                0,
                expression.length - 1
            );
        }

        updateDisplay();
    }

    function calculateResult() {

        if (expression === "") {
            return;
        }

        if (expression === "ERROR") {
            return;
        }

        var original = expression;

        var math = expression;

        math = math.split("×").join("*");
        math = math.split("÷").join("/");
        math = math.split("−").join("-");

        /*
          Only calculator characters allowed.
        */

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
                throw new Error("Invalid result");
            }

            history.push(
                original + " = " + result
            );

            expression = String(result);

        } catch (error) {

            expression = "ERROR";
        }

        updateDisplay();
    }


    /*
      Calculator buttons
    */

    var calculatorButtons =
        document.querySelectorAll(".key");

    for (var i = 0; i < calculatorButtons.length; i++) {

        calculatorButtons[i].addEventListener(
            "click",
            function () {

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


    /* ==============================
       HISTORY
    ============================== */

    var historyButton = get("btn-history");
    var historyList = get("history-list");
    var clearHistoryButton = get(
        "btn-clear-history"
    );

    if (historyButton) {

        historyButton.addEventListener(
            "click",
            function () {

                if (!historyList) {
                    showScreen("screen-history");
                    return;
                }

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

                showScreen("screen-history");
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
       PIN SYSTEM
    ============================== */

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

        /*
          First time:
          CREATE PIN
        */

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

            if (loginMessage) {

                loginMessage.textContent =
                    "✅ PIN CREATED";
            }

            renderVault();

            showScreen(
                "screen-vault"
            );

            return;
        }


        /*
          Existing user:
          ENTER PIN
        */

        if (entered === savedPin) {

            pinInput.value = "";

            if (loginMessage) {
                loginMessage.textContent = "";
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

                showScreen(
                    "screen-calculator"
                );
            }
        );
    }


    /* ==============================
       VAULT
    ============================== */

    var PHOTOS_KEY =
        "vault_calc_photos";

    var photos = [];

    try {

        var storedPhotos =
            localStorage.getItem(PHOTOS_KEY);

        if (storedPhotos) {

            photos =
                JSON.parse(storedPhotos);
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
                "Storage full. Try removing some photos."
            );
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
                document.createElement("div");

            empty.className =
                "photo-empty";

            empty.textContent =
                "No photos yet. Tap ADD PHOTO.";

            grid.appendChild(empty);

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
            document.createElement("div");

        card.className =
            "photo-card";


        var image =
            document.createElement("img");

        image.src =
            imageData;

        image.alt =
            "Private photo";


        /*
          Open photo
        */

        image.addEventListener(
            "click",
            function () {

                var full =
                    get("photo-full");

                if (full) {

                    full.src =
                        imageData;
                }

                showScreen(
                    "screen-photo"
                );
            }
        );


        card.appendChild(image);


        /*
          Delete photo
        */

        var deleteButton =
            document.createElement("button");

        deleteButton.textContent =
            "DELETE";

        deleteButton.className =
            "photo-delete";


        deleteButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (
                    confirm(
                        "Delete this photo?"
                    )
                ) {

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


    /* ==============================
       ADD PHOTO
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

                if (!files || files.length === 0) {
                    return;
                }


                var completed = 0;


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
                                files.length
                            ) {

                                savePhotos();

                                renderVault();

                                showScreen(
                                    "screen-vault"
                                );
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

                photos.push(
                    reader.result
                );

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


    /*
      THIS WAS ONE OF THE BROKEN BUTTONS
    */

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


    /* ==============================
       PHOTO BACK
    ============================== */

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

                showScreen(
                    "screen-vault"
                );
            }
        );
    }


    /* ==============================
       START
    ============================== */

    updateDisplay();

    renderVault();

    showScreen(
        "screen-calculator"
    );

});
