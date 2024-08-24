function replaceLogo() {
    const logoContainer = document.querySelector('.mo-body-container');
    if (logoContainer) {
        const existingLogo = logoContainer.querySelector('img');
        if (existingLogo) {
            const newLogo = document.createElement('img');
            newLogo.src = chrome.runtime.getURL('icon.png');
            newLogo.style.width = '150px';
            newLogo.style.height = 'auto';
            existingLogo.parentNode.replaceChild(newLogo, existingLogo);
        }
    }
}

function restoreOriginalLogo() {
    const logoContainer = document.querySelector('.mo-body-container');
    if (logoContainer) {
        const currentLogo = logoContainer.querySelector('img');
        if (currentLogo && currentLogo.src.includes('icon.png')) {
            const originalLogo = document.createElement('img');
            originalLogo.src = 'https://groupmuk-prisma.mediaocean.com/assets/images/mo-logo-white.svg';
            originalLogo.style.width = '150px';
            originalLogo.style.height = 'auto';
            currentLogo.parentNode.replaceChild(originalLogo, currentLogo);
        }
    }
}

chrome.storage.sync.get('logoReplaceEnabled', function(data) {
    if (data.logoReplaceEnabled) {
        replaceLogo();
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "toggleLogo") {
        if (request.enabled) {
            replaceLogo();
        } else {
            restoreOriginalLogo();
        }
    }
});

// Observe DOM changes to handle dynamic content loading
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            chrome.storage.sync.get('logoReplaceEnabled', function(data) {
                if (data.logoReplaceEnabled) {
                    replaceLogo();
                }
            });
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });
