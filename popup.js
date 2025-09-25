document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("type").addEventListener("change", function () {
        const type = document.getElementById("type").value;
        const idInput = document.getElementById("idInput");

        if (type === "group") {
            idInput.style.display = "block";
            idInput.placeholder = "Enter group id";
            idInput.focus();
        } else {
            idInput.style.display = "none";
            idInput.value = ""; 
        }
    });

    document.getElementById("setId").addEventListener("click", function () {
        const type = document.getElementById("type").value;
        const id = document.getElementById("idInput").value;

        if (type === "group" && !id) {
            alert("Please enter a group id.");
            return;
        }

        chrome.storage.sync.set({ selectedType: type, selectedId: id }, function () {
            alert(type === "group" ? "Group saved successfully!" : "User saved successfully!");
        });
    });

    chrome.storage.sync.get(["selectedType", "selectedId"], function (data) {
        if (data.selectedType) {
            const typeSelector = document.getElementById("type");
            const idInput = document.getElementById("idInput");

            typeSelector.value = data.selectedType;

            if (data.selectedType === "group") {
                idInput.style.display = "block";
                idInput.value = data.selectedId || "";
            } else {
                idInput.style.display = "none";
            }
        }
    });
});
