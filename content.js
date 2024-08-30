function replaceLogo() {
    const logoElement = document.querySelector('mo-banner.hydrated .logo');
    if (logoElement) {
        const newLogo = document.createElement('img');
        newLogo.src = chrome.runtime.getURL('icon.png');
        newLogo.style.width = '32px';
        newLogo.style.height = '32px';
        newLogo.className = 'custom-logo';
        logoElement.parentNode.replaceChild(newLogo, logoElement);
    }
}

function restoreOriginalLogo() {
    const customLogo = document.querySelector('mo-banner.hydrated .custom-logo');
    if (customLogo) {
        const originalLogo = document.createElement('i');
        originalLogo.className = 'logo';
        customLogo.parentNode.replaceChild(originalLogo, customLogo);
    }
}

function checkAndReplaceLogo() {
    chrome.storage.sync.get('logoReplaceEnabled', function(data) {
        if (data.logoReplaceEnabled) {
            replaceLogo();
        } else {
            restoreOriginalLogo();
        }
    });
}

// Check if the current URL matches the specified patterns
function shouldReplaceLogoOnThisPage() {
    const url = window.location.href;
    return url.includes('groupmuk-aura.mediaocean.com') || url.includes('groupmuk-prisma.mediaocean.com');
}

// Initial check
if (shouldReplaceLogoOnThisPage()) {
    checkAndReplaceLogo();
}

// Observe DOM changes to handle dynamic content loading
const observer = new MutationObserver(function(mutations) {
    if (shouldReplaceLogoOnThisPage()) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                checkAndReplaceLogo();
            }
        });
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "checkLogoReplaceEnabled") {
        if (shouldReplaceLogoOnThisPage()) {
            checkAndReplaceLogo();
        }
    }
});
