const IS_DEVELOPMENT = false; // Set to true for development console logs

// Constants for "magic strings"
const META_SUPPLIER_CODE = '000770';
const META_REDISTRIBUTE_TEXT = 'Redistribute all';
const IAS_SUPPLIER_CODE = '001148';
const IAS_FLAT_TEXT = 'Flat';
const IAS_UNIT_TYPE_TEXT = 'Unit Type';

// URLs for logo replacement
const AURA_DOMAIN = 'groupmuk-aura.mediaocean.com';
const PRISMA_DOMAIN = 'groupmuk-prisma.mediaocean.com';

if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] Script Injected on URL:", window.location.href, "at", new Date().toLocaleTimeString());

function replaceLogo() {
    const logoElement = document.querySelector('mo-banner.hydrated .logo'); // Highly specific selector
    if (logoElement) {
        if (logoElement.classList.contains('custom-logo-applied')) return; // Already replaced

        const newLogo = document.createElement('img');
        newLogo.src = chrome.runtime.getURL('icon.png');
        newLogo.style.width = '32px';
        newLogo.style.height = '32px';
        newLogo.className = 'custom-logo custom-logo-applied'; // Added a marker class
        logoElement.parentNode.replaceChild(newLogo, logoElement);
        if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] Logo replaced.");
    } else {
        if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] Logo element not found for replacement.");
    }
}

function restoreOriginalLogo() {
    const customLogo = document.querySelector('mo-banner.hydrated .custom-logo'); // Highly specific selector
    if (customLogo) {
        const originalLogo = document.createElement('i');
        originalLogo.className = 'logo'; // Assuming original was an <i> with class 'logo'
        customLogo.parentNode.replaceChild(originalLogo, customLogo);
        if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] Original logo restored.");
    }
}

function checkAndReplaceLogo() {
    chrome.storage.sync.get('logoReplaceEnabled', function(data) {
        if (chrome.runtime.lastError) {
            if (IS_DEVELOPMENT) console.error("[ContentScript Prisma] Error getting logoReplaceEnabled:", chrome.runtime.lastError.message);
            return;
        }
        if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] logoReplaceEnabled from storage:", data.logoReplaceEnabled);
        if (data.logoReplaceEnabled) {
            replaceLogo();
        } else {
            restoreOriginalLogo();
        }
    });
}

function addReminderStyles() {
    if (document.getElementById('em-prisma-tools-reminder-styles')) {
        return;
    }
    const reminderStyles = document.createElement('style');
    reminderStyles.id = 'em-prisma-tools-reminder-styles'; // More specific ID
    // Note: These styles are also in style.css for the popup. Keep them synced if they should be identical.
    reminderStyles.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');
        #meta-reminder-popup, #ias-reminder-popup {
            font-family: 'Montserrat', sans-serif;
            position: fixed;
            z-index: 2147483647; /* Max z-index */
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #ff4087;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            max-width: 400px;
            text-align: center;
            animation: csPrismaFadeIn 0.3s ease-in-out; /* Renamed animation to avoid conflicts */
        }
        #meta-reminder-popup h3, #ias-reminder-popup h3 { margin-top: 0; font-size: 18px; font-weight: 700; }
        #meta-reminder-popup p, #ias-reminder-popup p { margin-bottom: 10px; font-size: 14px; }
        #meta-reminder-popup ul, #ias-reminder-popup ul { text-align: left; margin-bottom: 20px; font-size: 14px; padding-left: 20px; }
        #meta-reminder-popup li, #ias-reminder-popup li { margin-bottom: 5px; }
        #meta-reminder-close, #ias-reminder-close { background-color: white; color: #ff4087; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background-color 0.2s, transform 0.1s; }
        #meta-reminder-close:hover, #ias-reminder-close:hover { background-color: #f8f8f8; animation: csPrismaVibrate 0.3s ease-in-out; } /* Renamed animation */
        #meta-reminder-close:active, #ias-reminder-close:active { transform: translateY(2px); }
        @keyframes csPrismaFadeIn { from { opacity: 0; transform: translate(-50%, -60%); } to { opacity: 1; transform: translate(-50%, -50%); } }
        @keyframes csPrismaVibrate { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-2px); } 40% { transform: translateX(2px); } 60% { transform: translateX(-1px); } 80% { transform: translateX(1px); } }
    `;
    document.head.appendChild(reminderStyles);
}

let metaReminderDismissedThisSession = false; // Renamed for clarity
let iasReminderDismissedThisSession = false;   // Renamed for clarity

function createReminderPopup(id, title, contentHtml, dismissFlagSetter) {
    if (document.getElementById(id) || (id === 'meta-reminder-popup' && metaReminderDismissedThisSession) || (id === 'ias-reminder-popup' && iasReminderDismissedThisSession)) {
        if (IS_DEVELOPMENT) console.log(`[ContentScript Prisma] Reminder popup '${id}' skipped (already exists or dismissed this session).`);
        return null;
    }
    addReminderStyles();
    const popup = document.createElement('div');
    popup.id = id;
    popup.innerHTML = `<h3>${title}</h3>${contentHtml}<button id="${id}-close">Got it!</button>`;
    document.body.appendChild(popup);
    if (IS_DEVELOPMENT) console.log(`[ContentScript Prisma] Reminder popup '${id}' CREATED.`);

    const closeButton = document.getElementById(`${id}-close`);
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            if (popup.parentNode === document.body) {
                document.body.removeChild(popup);
            }
            dismissFlagSetter(true);
            if (IS_DEVELOPMENT) console.log(`[ContentScript Prisma] Reminder popup '${id}' closed by user.`);
        });
    }

    setTimeout(() => {
        if (document.getElementById(id) && popup.parentNode === document.body) {
            document.body.removeChild(popup);
            if (IS_DEVELOPMENT) console.log(`[ContentScript Prisma] Reminder popup '${id}' auto-closed.`);
        }
    }, 15000); // 15 seconds
    return popup;
}

function createMetaReminderPopup() {
    const content = `<p>When reconciling Meta, please:</p>
                     <ul><li>Actualise to the 'Supplier' option</li><li>Self-accept the IO</li><li>Push through on trafficking tab to Meta</li><li>Verify success of the push, every time</li><li>Do not just leave the page!</li></ul>`;
    createReminderPopup('meta-reminder-popup', '⚠️ Meta Reconciliation Reminder ⚠️', content, (val) => metaReminderDismissedThisSession = val);
}

function createIASReminderPopup() {
    const content = `<p>Please ensure you book as CPM</p>
                     <ul><li>With correct rate for media type</li><li>Check the plan</li><li>Ensure what is planned is what goes live</li></ul>`;
    createReminderPopup('ias-reminder-popup', '⚠️ IAS Booking Reminder ⚠️', content, (val) => iasReminderDismissedThisSession = val);
}

function checkForPageConditions() {
    // Checking document.body.innerText can be performance-intensive on large/dynamic pages.
    // If possible, target more specific elements that are known to contain these codes/texts.
    const pageText = document.body.innerText || ""; // Ensure pageText is a string

    // Meta Conditions
    chrome.storage.sync.get('metaReminderEnabled', function(data) {
        if (chrome.runtime.lastError) {
            if (IS_DEVELOPMENT) console.error("[ContentScript Prisma] Error getting metaReminderEnabled:", chrome.runtime.lastError.message);
            return;
        }
        if (data.metaReminderEnabled !== false && !metaReminderDismissedThisSession) {
            // Example: Check if specific elements exist instead of generic pageText.includes
            // const metaSupplierElement = document.querySelector(`[data-supplier-code="${META_SUPPLIER_CODE}"]`);
            // const redistributeElement = document.querySelector('.some-class-indicating-redistribute');
            if (pageText.includes(META_SUPPLIER_CODE) && pageText.includes(META_REDISTRIBUTE_TEXT)) {
                createMetaReminderPopup();
            }
        }
    });

    // IAS Conditions (Assuming IAS reminders are always on if content script runs and not dismissed)
    if (!iasReminderDismissedThisSession) {
        // Example:
        // const iasSupplierElement = document.querySelector(`[data-supplier-code="${IAS_SUPPLIER_CODE}"]`);
        if (pageText.includes(IAS_SUPPLIER_CODE) && pageText.includes(IAS_FLAT_TEXT) && pageText.includes(IAS_UNIT_TYPE_TEXT)) {
            createIASReminderPopup();
        }
    }
}


let lastUrlForDismissFlags = window.location.href;
// Using a MutationObserver for SPA navigation detection can be more robust than setInterval.
// However, for simple URL checks, setInterval is less complex.
// Consider History API (popstate, pushState/replaceState wrapping) for more advanced SPA handling.
const urlCheckInterval = setInterval(() => {
    if (lastUrlForDismissFlags !== window.location.href) {
        if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] URL changed, reminder dismissal flags reset.");
        metaReminderDismissedThisSession = false;
        iasReminderDismissedThisSession = false;
        lastUrlForDismissFlags = window.location.href;
        // Re-check conditions on URL change if necessary, after a small delay for page to potentially load
        setTimeout(checkForPageConditions, 500);
    }
}, 1000); // Check every 1 second

function shouldRunOnThisPage() {
    const url = window.location.href;
    return url.includes(AURA_DOMAIN) || url.includes(PRISMA_DOMAIN);
}

function mainContentScriptInit() {
    if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] DOMContentLoaded or already loaded. Initializing checks.");
    if (shouldRunOnThisPage()) {
        checkAndReplaceLogo(); // Initial check
        // Initial check for page conditions, slight delay for full render
        setTimeout(checkForPageConditions, 2000);

        // Observe DOM changes. This can be performance-intensive.
        // Try to observe a more specific part of the DOM if possible, e.g., document.getElementById('app-container')
        // Also, consider what kind of mutations are relevant (e.g., only childList, not attributes unless needed).
        const observer = new MutationObserver(function(mutationsList, observer) {
            if (!shouldRunOnThisPage()) { // Double check, in case URL changes outside of interval's detection
                observer.disconnect(); // Stop observing if not on a relevant page
                clearInterval(urlCheckInterval); // Clear interval too
                return;
            }

            let relevantChangeDetected = false;
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if added nodes are significant or if the logo/relevant sections might have re-rendered.
                    // A more targeted check would be:
                    // if (Array.from(mutation.addedNodes).some(node => node.querySelector('.logo') || node.classList.contains('relevant-section')))
                    relevantChangeDetected = true;
                    break; 
                }
                // Add other mutation types if needed, e.g., 'attributes' if class changes on body/banner affect layout.
            }

            if (relevantChangeDetected) {
                if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] Relevant DOM mutation detected.");
                // Debounce or throttle these checks if mutations are very frequent.
                // The setTimeout provides a simple form of delay/debounce.
                checkAndReplaceLogo(); // Re-check logo on relevant changes
                setTimeout(checkForPageConditions, 200); // Re-check for reminders
            }
        });

        // Start observing the body for configured mutations
        // subtree: true can be very expensive. If changes are shallower, adjust.
        observer.observe(document.body, { childList: true, subtree: true });
        if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] MutationObserver started on document.body.");
    }
}

// Initialize after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mainContentScriptInit);
} else {
    mainContentScriptInit();
}

// Message listener
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] Message received in listener:", request);

    let responseSent = false;
    switch (request.action) {
        case "checkLogoReplaceEnabled":
            if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] 'checkLogoReplaceEnabled' action received.");
            if (shouldRunOnThisPage()) {
                checkAndReplaceLogo();
            }
            sendResponse({status: "Logo check processed by content script"});
            responseSent = true;
            break;
        case "showMetaReminder":
            if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] 'showMetaReminder' action received. Attempting to create popup.");
            // Reset dismissal flag specifically for manual trigger
            metaReminderDismissedThisSession = false;
            createMetaReminderPopup();
            sendResponse({status: "Meta reminder shown by content script"});
            responseSent = true;
            if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] Response sent for 'showMetaReminder'.");
            break;
        default:
            if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] Unknown action received or no action taken:", request.action);
            // No specific response needed for unknown actions unless an error state is desired.
            break;
    }
    // If you might respond asynchronously for some actions not covered here, return true.
    // For synchronous responses or no response, returning false or undefined is fine.
    // To be safe if more async messages are added, 'return true' can be used generally if sendResponse MIGHT be called later.
    // Given the current structure, if a response is sent, it's done synchronously within the switch.
    return responseSent; // Explicitly return true if sendResponse was called, or will be called asynchronously.
                         // If no response is planned, it's okay to not return true.
});

if (IS_DEVELOPMENT) console.log("[ContentScript Prisma] Event listeners, including onMessage, should be set up now.");
