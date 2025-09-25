let cookie
let lastCallTime = 0
//* Art3mLapa
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    cookie = message.cookie;
    sendResponse({ received: true });
});

function getCSRFToken() {
    return fetch('https://auth.roblox.com/v2/logout', {
        method: 'POST',
        headers: {
            'Cookie': cookie
        },
        credentials: 'include'
    })
        .then(token_response => {
            const csrfToken = token_response.headers.get('x-csrf-token');
            return csrfToken;
        });
}

function getUserId() {
    return fetch('https://users.roblox.com/v1/users/authenticated', {
        method: 'GET',
        headers: {
            'Cookie': cookie
        },
        credentials: 'include'
    })
        .then(user_response => user_response.json())
        .then(data => data.id)
}

function observeMutations() {
    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            updatepage();
        });
    });

    const targetNode = document.querySelector("#applayout-scroll-container");
    if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true, attributes: true });
    }
}

let lastUrl = location.href;
function monitorUrlChanges() {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        observeMutations();
        updatepage();
    }
}

setInterval(() => {
    updatepage();
}, 1000);

setInterval(monitorUrlChanges, 100);

window.addEventListener("load", updatepage);

observeMutations();
updatepage();

function downloadid(assetId) {
    getCSRFToken().then(token => {
        fetch('https://assetdelivery.roblox.com/v1/assets/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie,
                'X-Csrf-Token': token,
                'Roblox-Browser-Asset-Request': true
            },
            credentials: 'include',
            body: JSON.stringify([{ "requestId": assetId, "assetId": assetId }])
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('POST request failed');
                }
            })
            .then(data => {
                const fileUrl = data[0].location;
                const filename = `${assetId}.ogg`;

                let a = document.createElement('a');
                a.href = fileUrl;
                a.download = filename;

                if (window.Blob && window.URL && window.URL.createObjectURL) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', fileUrl, true);
                    xhr.responseType = 'blob';
                    xhr.onload = function () {
                        a.href = window.URL.createObjectURL(xhr.response);
                        a.click();
                    };
                    xhr.onerror = function () {
                        console.log('Download failed');
                    };
                    xhr.send();
                } else {
                    a.click();
                }
            })
            .catch(error => console.error('Error making POST request:', error));
    });
}

function updatepage() {
    if (window.location.href.includes("https://create.roblox.com/dashboard/creations") && window.location.href.includes("activeTab=Audio")) {
        const TableHead = document.querySelector("table > thead");
        const TableBody = document.querySelector("table > tbody");

        if (TableHead) {
            const parentRow = TableHead.querySelector("tr");

            if (parentRow && !parentRow.querySelector('[data-custom-header="icon"]')) {
                const elementToClone = parentRow.querySelector("th");

                if (elementToClone) {
                    const clonedElement = elementToClone.cloneNode(true);
                    const span = clonedElement.querySelector('span');
                    if (span) {
                        span.textContent = "ICON";
                        span.style.textAlign = "left";
                    }
                    clonedElement.setAttribute("data-custom-header", "icon");

                    clonedElement.style.width = "45px";
                    clonedElement.style.height = "45px";

                    parentRow.insertBefore(clonedElement, parentRow.firstChild);
                }
            }
        }

        if (TableBody) {
            const rows = TableBody.querySelectorAll('tr');
            const assetIds = [];

            rows.forEach((row) => {
                const linkElement = row.querySelector('a');
                if (linkElement) {
                    const href = linkElement.getAttribute('href');
                    const idMatch = href.match(/\/store\/(\d+)\//);
                    const id = idMatch ? idMatch[1] : null;

                    if (id) {
                        if (!row.querySelector('[data-custom-icon="true"]')) {
                            assetIds.push(id);
                            const iconCell = document.createElement('td');
                            iconCell.setAttribute("data-custom-icon", "true");

                            const imageButton = document.createElement('button');
                            imageButton.style.padding = "0";
                            imageButton.style.border = "none";
                            imageButton.style.background = "none";
                            imageButton.style.cursor = "pointer";

                            const thumbnailImage = document.createElement('img');
                            thumbnailImage.src = "https://i.ibb.co/vbczQCZ/250925-16h53m23s-screenshot.png";
                            thumbnailImage.alt = "Placeholder Thumbnail";
                            thumbnailImage.style.width = "45px";
                            thumbnailImage.style.height = "45px";
                            thumbnailImage.style.display = "block";

                            imageButton.title = "Download Audio"

                            imageButton.appendChild(thumbnailImage);

                            imageButton.addEventListener('click', () => {
                                downloadid(id)
                            });

                            iconCell.style.textAlign = "center";
                            iconCell.style.verticalAlign = "middle";
                            iconCell.style.borderBottom = "1px solid rgba(255, 255, 255, 0.12)";

                            iconCell.appendChild(imageButton);
                            row.insertBefore(iconCell, row.firstChild);
                        }
                    }
                }
            });

            if (assetIds.length > 0) {
                const apiUrl = `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds.join(',')}&returnPolicy=AutoGenerated&size=512x512&format=png`;
                fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Cookie': cookie,
                    },
                    credentials: 'include'
                })
                    .then(response => response.json())
                    .then(apiResponse => {
                        const dataItems = apiResponse.data || [];
                        dataItems.forEach(item => {
                            const matchingRow = [...rows].find(r => {
                                const linkElement = r.querySelector('a');
                                const href = linkElement ? linkElement.getAttribute('href') : null;
                                return href && href.includes(`${item.targetId}`);
                            });

                            if (matchingRow) {
                                const existingIcon = matchingRow.querySelector('[data-custom-icon="true"] img');
                                if (existingIcon) {
                                    existingIcon.src = item.imageUrl;
                                    existingIcon.alt = "Thumbnail";
                                }
                            }
                        });
                    })
            }
        }

        const uploadAssetButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Upload Asset');
        if (uploadAssetButton) {
            const buttonContainer = uploadAssetButton.parentNode;

            if (buttonContainer && !buttonContainer.querySelector('[data-custom-button="mass-upload"]') &&
                !buttonContainer.querySelector('[data-custom-button="upload-multiple"]')) {
                const massUploadButton = uploadAssetButton.cloneNode(true);
                massUploadButton.setAttribute("data-custom-button", "mass-upload");
                massUploadButton.style.marginRight = "8px";
                const massUploadText = massUploadButton.querySelector('span');
                if (massUploadText) {
                    massUploadText.textContent = "Mass Upload";
                }
                massUploadButton.addEventListener('click', function () {
                    encodeInput.click();
                });

                const uploadMultipleButton = uploadAssetButton.cloneNode(true);
                uploadMultipleButton.setAttribute("data-custom-button", "upload-multiple");
                uploadMultipleButton.style.marginRight = "8px";
                const uploadMultipleText = uploadMultipleButton.querySelector('span');
                if (uploadMultipleText) {
                    uploadMultipleText.textContent = "Upload Multiple";
                }

                uploadMultipleButton.classList.add('MuiButton-containedSecondary', 'MuiButton-colorSecondary');
                uploadMultipleButton.addEventListener('click', function () {
                    fileInput.click();
                });


                buttonContainer.insertBefore(uploadMultipleButton, buttonContainer.firstChild);
                buttonContainer.insertBefore(massUploadButton, buttonContainer.firstChild);
            }
        }

        const formatElements = document.querySelectorAll('div');
        const formatElement = Array.from(formatElements).find(el => el.textContent.startsWith('Format:'));
        if (formatElement) {
            formatElement.textContent = 'Format: *.mp3, *.ogg';
        }
    }
}

function gen(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            const data = new Uint8Array(event.target.result);
            const bytesToDuplicate = 2666;

            const segment = data.slice(0, bytesToDuplicate);
            const generatedFiles = [];

            for (let i = 1; i <= 10; i++) {
                const repeatedSegments = new Uint8Array(segment.length * i + data.length);
                for (let j = 0; j < i; j++) {
                    repeatedSegments.set(segment, j * segment.length);
                }
                repeatedSegments.set(data, segment.length * i);

                const fileExt = file.name.split('.').pop().toLowerCase();
                const mimeType = fileExt === 'ogg' ? 'audio/ogg' : 'audio/mp3';
                const blob = new Blob([repeatedSegments], { type: mimeType });
                const fileName = file.name.replace(/\.[^/.]+$/, "") || 'empty';
                blob.name = `${fileName}_${i}.${fileExt}`;
                generatedFiles.push(blob);
            }

            resolve(generatedFiles);
        };
        reader.onerror = function (event) {
            reject(event.target.error);
        };
        reader.readAsArrayBuffer(file);
    });
}

function checkOperationStatus(operationId) {
    return new Promise((resolve, reject) => {
        const checkStatus = () => {
            fetch(`https://apis.roblox.com/assets/user-auth/v1/operations/${operationId}`, {
                method: 'GET',
                headers: {
                    'Cookie': cookie
                },
                credentials: 'include'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.done) {
                        resolve();
                    } else {
                        setTimeout(checkStatus, 1000);
                    }
                })
                .catch(error => {
                    reject(error);
                });
        };

        checkStatus();
    });
}

function handleFileSelection(event) {
    const files = event.target.files;
    let creatorData = {};
    chrome.storage.sync.get(["selectedType"], function (data) {
        if (data.selectedType) {
            if (data.selectedType === "group") {
                chrome.storage.sync.get(["selectedId"], function (groupData) {
                    if (groupData.selectedId) {
                        creatorData = { "creator": { "groupId": groupData.selectedId } };
                        uploadFiles(files, creatorData);
                    } else {
                        console.error("No Group ID set in extension storage.");
                    }
                });
            } else if (data.selectedType === "user") {
                getUserId()
                    .then(userId => {
                        creatorData = { "creator": { "userId": userId } };
                        uploadFiles(files, creatorData);
                    })
                    .catch(error => console.error("Error retrieving User ID:", error));
            }
        } else {
            console.error("No user/group type set in extension storage.");
        }
    });
}

function handleEncodeFileSelection(event) {
    const file = event.target.files[0];
    let creatorData = {};

    gen(file)
        .then(files => {
            chrome.storage.sync.get(["selectedType"], function (data) {
                if (data.selectedType) {
                    if (data.selectedType === "group") {
                        chrome.storage.sync.get(["selectedId"], function (groupData) {
                            if (groupData.selectedId) {
                                creatorData = { "creator": { "groupId": groupData.selectedId } };
                                uploadFiles(files, creatorData);
                            } else {
                                alert("No group id was set in extension.");
                            }
                        });
                    } else if (data.selectedType === "user") {
                        getUserId()
                            .then(userId => {
                                creatorData = { "creator": { "userId": userId } };
                                uploadFiles(files, creatorData);
                            })
                    }
                } else {
                    alert("No upload type set in extension.");
                }
            });
        })
}

let ongoingOperationsCount = 0;

function uploadFiles(files, creatorData) {
    const parentElement = document.evaluate(
        "/html/body/div/div/div/div[2]/div/main/section/div/div[3]/div[1]/div",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;

    if (parentElement) {
        parentElement.innerHTML = '';
    } else {
        console.error('Parent element not found');
        return;
    }

    const loaderGif = document.createElement('img');
    loaderGif.src = 'https://upload.wikimedia.org/wikipedia/commons/a/ad/YouTube_loading_symbol_3_%28transparent%29.gif';
    loaderGif.style.width = '100px';
    loaderGif.style.height = '100px';

    parentElement.appendChild(loaderGif);

    getCSRFToken().then(token => {
        for (const file of files) {
            const fileName = file.name.replace(/\.[^/.]+$/, "") || 'empty';
            const formData = new FormData();
            formData.append('fileContent', file, fileName);
            formData.append('request', JSON.stringify({
                "displayName": fileName,
                "description": "[ POVREZHDEN ]",
                "assetType": "Audio",
                "creationContext": {
                    ...creatorData,
                    "expectedPrice": 0
                }
            }));

            fetch(`https://apis.roblox.com/assets/user-auth/v1/assets`, {
                method: 'POST',
                headers: {
                    'Cookie': cookie,
                    'X-Csrf-Token': token
                },
                credentials: 'include',
                body: formData
            }).then(response => {
                return response.json();
            }).then(resdata => {
                if (resdata.error) {
                    console.error("Error creating asset:", resdata.error.message);
                } else {
                    const operationId = resdata.operationId;
                    if (!operationId) {
                        return;
                    }
                    ongoingOperationsCount++;
                    checkOperationStatus(operationId)
                        .then(() => {
                            ongoingOperationsCount--;
                            if (ongoingOperationsCount === 0) {
                                parentElement.removeChild(loaderGif);
                                location.reload();
                            }
                        })
                        .catch(error => {
                            console.error("Error checking operation status:", error);
                            ongoingOperationsCount--;
                        });
                }
            })
                .catch(error => {
                    console.error('Error uploading file:', error);
                });
        }
    });
}

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.multiple = true;
fileInput.accept = '.mp3,.ogg';
fileInput.style.display = 'none';

document.body.appendChild(fileInput);

fileInput.addEventListener('change', handleFileSelection);

const encodeInput = document.createElement('input');
encodeInput.type = 'file';
encodeInput.accept = '.mp3,.ogg';
encodeInput.style.display = 'none';

document.body.appendChild(encodeInput);

encodeInput.addEventListener('change', handleEncodeFileSelection);

//* NICNACS_W

