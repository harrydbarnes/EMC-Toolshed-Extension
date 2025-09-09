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

// addReminderStyles function is now removed as styles are in style.css
// Ensure style.css is listed in manifest.json's content_scripts css array.

let metaReminderDismissed = false;
let iasReminderDismissed = false;
// Removed metaPopupTimeoutId as it's no longer used

function createMetaReminderPopup() {
    if (document.getElementById('meta-reminder-popup') || metaReminderDismissed) {
        console.log("[ContentScript Prisma] Meta reminder popup skipped (already exists or dismissed).");
        return;
    }
    // addReminderStyles(); // Removed call

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
    // addReminderStyles(); // Ensure styles are present // Removed call

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
    // Escape regex special chars
    let escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // If no wildcard '*' is present in the original pattern, assume it means 'contains'
    // So, add '.*' to the beginning and end of the escaped pattern.
    // Otherwise, just convert user-defined '*' to '.*'
    if (!pattern.includes('*')) {
        escapedPattern = '.*' + escapedPattern + '.*';
    } else {
        // Convert user-defined '*' to '.*'
        escapedPattern = escapedPattern.replace(/\*/g, '.*');
    }
    // Always ensure the regex is case-insensitive for URL matching, and still use ^$ to match the whole URL against the pattern
    return new RegExp('^' + escapedPattern + '$', 'i'); // Added 'i' flag for case-insensitivity
}

function createCustomReminderPopup(reminder) {
    // const popupId = 'custom-reminder-popup-' + reminder.id; // Old ID
    if (document.getElementById('custom-reminder-display-popup')) { // Check for the new generic ID
        // console.log(`[ContentScript Prisma] Custom reminder popup for ${reminder.name} already exists or another custom reminder is shown.`);
        return; // Avoid showing multiple custom popups if one is already up with the generic ID
    }

    // addReminderStyles(); // Ensure styles are loaded // Removed call

    const overlay = document.createElement('div');
    overlay.className = 'reminder-overlay';
    overlay.id = 'custom-reminder-overlay-' + reminder.id; // Keep overlay ID specific for now
    // Ensure overlay doesn't stack if multiple custom popups appear (though shownCustomReminderIds should prevent this)
    // And also check generic overlays from meta/ias
    if (!document.querySelector('.reminder-overlay')) { // Simpler check: if ANY .reminder-overlay exists, don't add another one if this logic is flawed
        document.body.appendChild(overlay);
    } else if (!document.getElementById(overlay.id)) { // Only add if this specific overlay isn't already there
        // If an overlay for another reminder (meta, ias, or another custom) is already there,
        // this new custom popup will appear over it, which is fine.
        // The z-index for popups is higher than overlays.
        // We still append this specific overlay to ensure its removal logic is tied to this popup.
        document.body.appendChild(overlay);
    }


    const popup = document.createElement('div');
    popup.id = 'custom-reminder-display-popup'; // Standardized ID

    // Inline styles are removed, will be handled by addReminderStyles

    popup.innerHTML = `
        <h3>${escapeHTML(reminder.name)}</h3>
        ${reminder.popupMessage}
        <button id="custom-reminder-display-close">Got it!</button>
    `;
    document.body.appendChild(popup);

    const closeButton = document.getElementById('custom-reminder-display-close'); // Use new ID
    closeButton.addEventListener('click', () => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay); // Remove its specific overlay
        // shownCustomReminderIds.add(reminder.id) happens in checkCustomReminders, which is correct.
        console.log(`[ContentScript Prisma] Custom reminder popup for ${reminder.name} closed by user.`);
    });
    console.log(`[ContentScript Prisma] Custom reminder popup created for: ${reminder.name}`);
}


function checkCustomReminders() {
    console.log("[ContentScript Prisma] Running checkCustomReminders...");
    if (activeCustomReminders.length === 0) {
        console.log("[ContentScript Prisma] No active custom reminders to check.");
        return;
    }

    // If a custom reminder is already displayed using the generic ID, don't try to show another one.
    if (document.getElementById('custom-reminder-display-popup')) {
        console.log("[ContentScript Prisma] Another custom reminder popup is already visible. Skipping further checks.");
        // Log which reminder is being skipped IF we were iterating, but here we are aborting early.
        // To log the specific reminder that would have been shown, this check needs to be inside the loop.
        // However, the current logic is to prevent ANY new custom reminder if one is up.
        return;
    }

    const currentUrl = window.location.href;
    const pageText = document.body.innerText.toLowerCase(); // For case-insensitive search

    for (const reminder of activeCustomReminders) {
        console.log("[ContentScript Prisma] Checking custom reminder:", reminder.name, "ID:", reminder.id);
        console.log("[ContentScript Prisma] Current URL:", currentUrl);
        console.log("[ContentScript Prisma] Reminder URL Pattern:", reminder.urlPattern);

        if (shownCustomReminderIds.has(reminder.id)) {
            console.log("[ContentScript Prisma] Reminder", reminder.name, "already shown on this page load. Skipping.");
            continue;
        }

        // Moved this check inside the loop so we can log which reminder is skipped due to an existing popup
        if (document.getElementById('custom-reminder-display-popup')) {
            console.log("[ContentScript Prisma] Another custom reminder popup is already visible. Skipping reminder:", reminder.name);
            // Since only one custom popup can be shown at a time due to the generic ID,
            // if one is already up, we must not attempt to show another.
            // We can break here as no other reminder can be shown.
            break;
        }

        const urlRegex = wildcardToRegex(reminder.urlPattern);
        console.log("[ContentScript Prisma] Generated Regex:", urlRegex.toString());
        const urlMatches = urlRegex.test(currentUrl);
        console.log("[ContentScript Prisma] URL Match Result:", urlMatches);

        if (urlMatches) {
            console.log("[ContentScript Prisma] Reminder Text Trigger:", reminder.textTrigger);
            let textMatch = false;
            if (reminder.textTrigger && reminder.textTrigger.trim() !== '') {
                const triggerTexts = reminder.textTrigger.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
                if (triggerTexts.length > 0) {
                    if (triggerTexts.some(text => {
                        const pageIncludesText = pageText.includes(text);
                        // console.log(`[ContentScript Prisma] Checking page text for: "${text}", Found: ${pageIncludesText}`); // Potentially too verbose
                        return pageIncludesText;
                    })) {
                        textMatch = true;
                    }
                } else {
                     textMatch = true; // Text trigger was defined but empty after trim/split (e.g. ", ,") means match.
                }
            } else {
                textMatch = true; // No text trigger defined, URL match is enough
            }
            console.log("[ContentScript Prisma] Text Match Result:", textMatch);

            if (textMatch) {
                console.log("[ContentScript Prisma] Conditions MET for custom reminder:", reminder.name);
                createCustomReminderPopup(reminder);
                shownCustomReminderIds.add(reminder.id);
                // Since custom popups now use a generic ID, we should break after finding the first one to show.
                // This prevents multiple custom reminders from trying to use the same popup ID simultaneously.
                break;
            }
        }
    }
    console.log("[ContentScript Prisma] Finished checkCustomReminders.");
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
