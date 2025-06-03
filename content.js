console.log("[ContentScript Prisma] Script Injected on URL:", window.location.href, "at", new Date().toLocaleTimeString());

// Global variables for custom reminders
let activeCustomReminders = [];
let shownCustomReminderIds = new Set();

// Utility to escape HTML for display (used by custom reminder popup)
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function replaceLogo() {
    const specificSvg = document.querySelector('i.logo > svg[width="20"][height="28"]');
    const logoContainer = specificSvg ? specificSvg.parentElement : null; // Should be the <i> tag

    if (logoContainer) {
        // Check if custom logo already exists by checking for our specific class within the container
        if (logoContainer.querySelector('.custom-prisma-logo')) {
            return; // Already replaced
        }

        // Store original content (the SVG itself) if not already stored
        if (!logoContainer.dataset.originalSvgContent && specificSvg) {
            logoContainer.dataset.originalSvgContent = specificSvg.outerHTML;
        }

        // Remove the original SVG
        if (specificSvg) {
            specificSvg.remove();
        }

        const newLogoImg = document.createElement('img');
        newLogoImg.src = chrome.runtime.getURL('icon.png');
        newLogoImg.style.width = '32px'; // Or use dimensions from the original SVG if desired
        newLogoImg.style.height = '28px'; // Match height of original SVG container
        newLogoImg.style.objectFit = 'contain';
        newLogoImg.className = 'custom-prisma-logo';

        logoContainer.appendChild(newLogoImg);
        // console.log("[ContentScript Prisma] Prisma logo SVG replaced with custom image.");
    }
}

function restoreOriginalLogo() {
    const customLogoImg = document.querySelector('i.logo > img.custom-prisma-logo');
    if (customLogoImg) {
        const logoContainer = customLogoImg.parentElement; // The <i> tag
        if (logoContainer && logoContainer.dataset.originalSvgContent) {
            customLogoImg.remove(); // Remove the custom image
            // Prepend original SVG. Ensure it's not added multiple times if logic re-runs.
            if (!logoContainer.querySelector('svg[width="20"][height="28"]')) {
                 logoContainer.innerHTML = logoContainer.dataset.originalSvgContent + logoContainer.innerHTML;
            }
            // console.log("[ContentScript Prisma] Original Prisma SVG logo restored from stored content.");
        } else if (logoContainer) {
            // Fallback if original content wasn't stored: just remove the custom logo
            customLogoImg.remove();
            // console.log("[ContentScript Prisma] Custom logo image removed (no stored original SVG). Page may need refresh for original logo.");
        }
    }
}

function checkAndReplaceLogo() {
    chrome.storage.sync.get('logoReplaceEnabled', function(data) {
        // console.log("[ContentScript Prisma] logoReplaceEnabled from storage:", data.logoReplaceEnabled);
        if (data.logoReplaceEnabled) {
            replaceLogo();
        } else {
            restoreOriginalLogo();
        }
    });
}

function addReminderStyles() {
    if (document.getElementById('reminder-styles')) {
        // If styles are already added, ensure the overlay style is present or add it
        const existingStyles = document.getElementById('reminder-styles');
        if (!existingStyles.textContent.includes('.reminder-overlay')) {
            existingStyles.textContent += `
                .reminder-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.2); /* 20% dim */
                    z-index: 9999; /* Below popup, above page content */
                    animation: fadeInOverlay 0.3s ease-in-out;
                }
                @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }

                #meta-reminder-close:disabled {
                    background-color: #cccccc;
                    color: #666666;
                    cursor: not-allowed;
                }
            `;
        }
        return;
    }
    const reminderStyles = document.createElement('style');
    reminderStyles.id = 'reminder-styles';
    reminderStyles.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');
        /* ... (rest of your existing reminder styles) ... */
        #meta-reminder-popup, #ias-reminder-popup { /* Apply styles to both popups */
            font-family: 'Montserrat', sans-serif;
            position: fixed;
            z-index: 10000;
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
            animation: fadeIn 0.3s ease-in-out;
        }
        #meta-reminder-popup h3, #ias-reminder-popup h3 { margin-top: 0; font-size: 18px; font-weight: 700; }
        #meta-reminder-popup p, #ias-reminder-popup p { margin-bottom: 10px; font-size: 14px; }
        #meta-reminder-popup ul, #ias-reminder-popup ul { text-align: left; margin-bottom: 20px; font-size: 14px; padding-left: 20px; }
        #meta-reminder-popup li, #ias-reminder-popup li { margin-bottom: 5px; }
        #meta-reminder-close, #ias-reminder-close { background-color: white; color: #ff4087; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background-color 0.2s, transform 0.1s; }
        #meta-reminder-close:hover:not(:disabled), #ias-reminder-close:hover { background-color: #f8f8f8; animation: vibrate 0.3s ease-in-out; }
        #meta-reminder-close:active:not(:disabled), #ias-reminder-close:active { transform: translateY(2px); }
        #meta-reminder-close:disabled {
            background-color: #cccccc;
            color: #666666;
            cursor: not-allowed;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -60%); } to { opacity: 1; transform: translate(-50%, -50%); } }
        @keyframes vibrate { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-2px); } 40% { transform: translateX(2px); } 60% { transform: translateX(-1px); } 80% { transform: translateX(1px); } }

        /* Dimming Overlay */
        .reminder-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.2); /* 20% dim */
            z-index: 9999; /* Below popup, above page content */
            animation: fadeInOverlay 0.3s ease-in-out;
        }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(reminderStyles);
}

let metaReminderDismissed = false;
let iasReminderDismissed = false;
// Removed metaPopupTimeoutId as it's no longer used

function createMetaReminderPopup() {
    if (document.getElementById('meta-reminder-popup') || metaReminderDismissed) {
        console.log("[ContentScript Prisma] Meta reminder popup skipped (already exists or dismissed).");
        return;
    }
    addReminderStyles();

    // Create and add the overlay
    const overlay = document.createElement('div');
    overlay.className = 'reminder-overlay';
    overlay.id = 'meta-reminder-overlay';
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'meta-reminder-popup';
    popup.innerHTML = `
        <h3>⚠️ Meta Reconciliation Reminder ⚠️</h3>
        <p>When reconciling Meta, please:</p>
        <ul><li>Actualise to the 'Supplier' option</li><li>Self-accept the IO</li><li>Push through on trafficking tab to Meta</li><li>Verify success of the push, every time</li><li>Do not just leave the page!</li></ul>
        <button id="meta-reminder-close">Got it!</button>
    `;
    document.body.appendChild(popup);
    console.log("[ContentScript Prisma] Meta reminder popup CREATED.");

    const closeButton = document.getElementById('meta-reminder-close');
    let countdownInterval; // For the 5-second timer

    const cleanupPopup = () => {
        if (popup.parentNode === document.body) {
            document.body.removeChild(popup);
        }
        if (overlay.parentNode === document.body) {
            document.body.removeChild(overlay);
        }
        metaReminderDismissed = true; // Set dismissed flag
        clearInterval(countdownInterval); // Clear countdown interval if active
        console.log("[ContentScript Prisma] Meta reminder popup and overlay removed.");
    };

    if (closeButton) {
        const today = new Date().toDateString();
        const lastShownDate = localStorage.getItem('metaReminderLastShown');

        if (lastShownDate !== today) {
            // First time shown today, implement delay
            closeButton.disabled = true;
            let secondsLeft = 5;
            closeButton.textContent = `Got it! (${secondsLeft}s)`;

            countdownInterval = setInterval(() => {
                secondsLeft--;
                if (secondsLeft > 0) {
                    closeButton.textContent = `Got it! (${secondsLeft}s)`;
                } else {
                    clearInterval(countdownInterval);
                    closeButton.textContent = 'Got it!';
                    closeButton.disabled = false;
                    localStorage.setItem('metaReminderLastShown', today); // Store today's date
                }
            }, 1000);
        } else {
            // Already shown today, button is active immediately
            closeButton.disabled = false;
        }

        closeButton.addEventListener('click', function() {
            cleanupPopup();
            console.log("[ContentScript Prisma] Meta reminder popup closed by user.");
        });
    }
    // Auto-close timeout has been removed. Popup stays until user clicks "Got it!".
}


function createIASReminderPopup() {
    if (document.getElementById('ias-reminder-popup') || iasReminderDismissed) {
        return;
    }
    addReminderStyles(); // Ensure styles are present

    const popup = document.createElement('div');
    popup.id = 'ias-reminder-popup';
    popup.innerHTML = `
        <h3>⚠️ IAS Booking Reminder ⚠️</h3>
        <p>Please ensure you book as CPM</p>
        <ul><li>With correct rate for media type</li><li>Check the plan</li><li>Ensure what is planned is what goes live</li></ul>
        <button id="ias-reminder-close">Got it!</button>
    `;
    document.body.appendChild(popup);

    const closeButton = document.getElementById('ias-reminder-close');

    const cleanupIASPopup = () => {
        if (popup.parentNode === document.body) {
            document.body.removeChild(popup);
        }
        iasReminderDismissed = true;
    };

    if (closeButton) {
        closeButton.addEventListener('click', function() {
            cleanupIASPopup();
        });
    }

    // Auto-close IAS reminder (kept as per original, modify if IAS should also persist)
    setTimeout(() => {
        if (document.getElementById('ias-reminder-popup')) {
            cleanupIASPopup();
        }
    }, 15000);
}

function checkForMetaConditions() {
    if (metaReminderDismissed && !window.forceShowMetaReminder) return;

    chrome.storage.sync.get('metaReminderEnabled', function(data) {
        if (data.metaReminderEnabled !== false) {
            const pageText = document.body.innerText;
            if (pageText.includes('000770') && pageText.includes('Redistribute all')) {
                 if (!document.getElementById('meta-reminder-popup')) {
                    createMetaReminderPopup();
                 }
            }
        }
    });
    window.forceShowMetaReminder = false;
}

function checkForIASConditions() {
    if (iasReminderDismissed) return;

    const pageText = document.body.innerText;
    if (pageText.includes('001148') && pageText.includes('Flat') && pageText.includes('Unit Type')) {
         if (!document.getElementById('ias-reminder-popup')) {
            createIASReminderPopup();
         }
    }
}

let currentUrlForDismissFlags = window.location.href;
setInterval(() => {
    if (currentUrlForDismissFlags !== window.location.href) {
        console.log("[ContentScript Prisma] URL changed, reminder dismissal flags reset.");
        metaReminderDismissed = false;
        iasReminderDismissed = false;
        shownCustomReminderIds.clear(); // Reset shown custom reminders on URL change
        currentUrlForDismissFlags = window.location.href;
        // Potentially re-fetch or re-check custom reminders if needed immediately on SPA navigation
        // For now, MutationObserver and initial load handle most cases.
        // checkCustomReminders(); // Optional: check immediately on navigation
    }
}, 500);

// --- Custom Reminder Functions ---

function fetchCustomReminders() {
    chrome.storage.sync.get({customReminders: []}, function(data) {
        if (chrome.runtime.lastError) {
            console.error("[ContentScript Prisma] Error fetching custom reminders:", chrome.runtime.lastError);
            activeCustomReminders = [];
            return;
        }
        activeCustomReminders = data.customReminders.filter(r => r.enabled);
        // console.log("[ContentScript Prisma] Fetched active custom reminders:", activeCustomReminders);
        // Resetting shownCustomReminderIds here might be too broad if only one reminder setting changed.
        // However, the message listener for "customRemindersUpdated" already clears it, which is often sufficient.
    });
}

function wildcardToRegex(pattern) {
    // Escape regex special chars, then convert wildcard * to .*
    const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('^' + escapedPattern.replace(/\*/g, '.*') + '$');
}

function createCustomReminderPopup(reminder) {
    const popupId = 'custom-reminder-popup-' + reminder.id;
    if (document.getElementById(popupId)) {
        // console.log(`[ContentScript Prisma] Custom reminder popup for ${reminder.name} already exists or shown.`);
        return;
    }

    addReminderStyles(); // Ensure styles are loaded

    const overlay = document.createElement('div');
    overlay.className = 'reminder-overlay';
    overlay.id = 'custom-reminder-overlay-' + reminder.id;
    // Ensure overlay doesn't stack if multiple custom popups appear (though shownCustomReminderIds should prevent this)
    if (!document.querySelector('.reminder-overlay[id^="custom-reminder-overlay-"]')) {
        document.body.appendChild(overlay);
    } else {
        // If an overlay for a custom reminder is already there, just ensure this new popup is above it.
        // This scenario should be rare due to shownCustomReminderIds logic.
        overlay.style.zIndex = (parseInt(document.querySelector('.reminder-overlay[id^="custom-reminder-overlay-"]').style.zIndex || '9999', 10) + 1).toString();
        document.body.appendChild(overlay);
    }


    const popup = document.createElement('div');
    popup.id = popupId;
    // Basic styling - consider creating a shared class if many popups adopt this
    popup.style.fontFamily = "'Montserrat', sans-serif";
    popup.style.position = "fixed";
    popup.style.zIndex = (parseInt(overlay.style.zIndex, 10) + 1).toString(); // Above its own overlay
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = reminder.color || "#336699"; // Allow custom color or default
    popup.style.color = "white";
    popup.style.padding = "20px";
    popup.style.borderRadius = "8px";
    popup.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
    popup.style.maxWidth = "450px"; // Slightly wider for more text
    popup.style.textAlign = "center";
    popup.style.animation = "fadeIn 0.3s ease-in-out";

    popup.innerHTML = `
        <h3 style="margin-top:0; font-size: 1.2em;">${escapeHTML(reminder.name)}</h3>
        <p style="font-size: 1em; margin-bottom: 15px;">${escapeHTML(reminder.popupMessage)}</p>
        <button id="custom-reminder-close-${reminder.id}" class="settings-button" style="background-color: white; color: ${reminder.color || '#336699'}; padding: 8px 16px; border-radius: 5px; font-weight: bold; cursor: pointer;">Got it!</button>
    `;
    document.body.appendChild(popup);

    const closeButton = document.getElementById('custom-reminder-close-' + reminder.id);
    closeButton.addEventListener('click', () => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        // Do not remove from shownCustomReminderIds here, so it doesn't reappear on the same page load after dismissal
        // shownCustomReminderIds.delete(reminder.id);
        console.log(`[ContentScript Prisma] Custom reminder popup for ${reminder.name} closed by user.`);
    });
    console.log(`[ContentScript Prisma] Custom reminder popup created for: ${reminder.name}`);
}


function checkCustomReminders() {
    if (activeCustomReminders.length === 0) {
        // console.log("[ContentScript Prisma] No active custom reminders to check.");
        return;
    }

    const currentUrl = window.location.href;
    const pageText = document.body.innerText.toLowerCase(); // For case-insensitive search

    for (const reminder of activeCustomReminders) {
        if (shownCustomReminderIds.has(reminder.id)) {
            // console.log(`[ContentScript Prisma] Reminder ${reminder.name} already shown this session.`);
            continue;
        }

        const urlRegex = wildcardToRegex(reminder.urlPattern);
        if (urlRegex.test(currentUrl)) {
            // console.log(`[ContentScript Prisma] URL match for reminder: ${reminder.name}`);
            let textMatch = false;
            if (reminder.textTrigger && reminder.textTrigger.trim() !== '') {
                const triggerTexts = reminder.textTrigger.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
                if (triggerTexts.length > 0) {
                    if (triggerTexts.some(text => pageText.includes(text))) {
                        textMatch = true;
                        // console.log(`[ContentScript Prisma] Text match for reminder: ${reminder.name}`);
                    }
                } else {
                     textMatch = true; // Text trigger was defined but empty after trim/split (e.g. ", ,")
                }
            } else {
                textMatch = true; // No text trigger defined, URL match is enough
                // console.log(`[ContentScript Prisma] No text trigger for reminder: ${reminder.name}, URL match sufficient.`);
            }

            if (textMatch) {
                console.log(`[ContentScript Prisma] Conditions met for custom reminder: ${reminder.name}. Creating popup.`);
                createCustomReminderPopup(reminder);
                shownCustomReminderIds.add(reminder.id);
                // Optional: break here if only one custom reminder should be shown at a time
                // break;
            }
        }
    }
}

// --- End Custom Reminder Functions ---

function shouldReplaceLogoOnThisPage() {
    const url = window.location.href;
    // Updated condition:
    return url.includes('aura.mediaocean.com') || url.includes('prisma.mediaocean.com');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mainContentScriptInit);
} else {
    mainContentScriptInit();
}

function mainContentScriptInit() {
    console.log("[ContentScript Prisma] DOMContentLoaded or already loaded. Initializing checks.");
    if (shouldReplaceLogoOnThisPage()) {
        fetchCustomReminders(); // Fetch initial set of custom reminders
        checkAndReplaceLogo();
        setTimeout(() => {
            checkForMetaConditions();
            checkForIASConditions();
            checkCustomReminders(); // Initial check for custom reminders
        }, 2000);
    }

    const observer = new MutationObserver(function(mutations) {
        if (shouldReplaceLogoOnThisPage()) {
            checkAndReplaceLogo();
            // No need to iterate mutations for these checks, just run them if any mutation occurred
            setTimeout(() => { // Debounce/delay slightly
                checkForMetaConditions();
                checkForIASConditions();
                checkCustomReminders(); // Check for custom reminders on DOM changes
            }, 300);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("[ContentScript Prisma] Message received in listener:", request);

    if (request.action === "checkLogoReplaceEnabled") {
        console.log("[ContentScript Prisma] 'checkLogoReplaceEnabled' action received.");
        if (shouldReplaceLogoOnThisPage()) {
            checkAndReplaceLogo();
        }
        sendResponse({status: "Logo check processed by content script"});
    } else if (request.action === "showMetaReminder") {
        console.log("[ContentScript Prisma] 'showMetaReminder' action received. Attempting to create popup.");
        metaReminderDismissed = false;
        window.forceShowMetaReminder = true;
        checkForMetaConditions();
        sendResponse({status: "Meta reminder shown by content script"});
        console.log("[ContentScript Prisma] Response sent for 'showMetaReminder'.");
    } else if (request.action === "customRemindersUpdated") {
        console.log("[ContentScript Prisma] Received 'customRemindersUpdated' message. Re-fetching reminders.");
        fetchCustomReminders();
        shownCustomReminderIds.clear(); // Allow all reminders to be shown again as settings/list might have changed
        checkCustomReminders(); // Optional: re-check immediately after update
        sendResponse({status: "Custom reminders re-fetched and IDs reset by content script"});
    } else {
        console.log("[ContentScript Prisma] Unknown action received or no action taken:", request.action);
    }
    return true; // Keep the message channel open for asynchronous response if needed
});

console.log("[ContentScript Prisma] Event listeners, including onMessage, should be set up now.");
