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

// Add reminder styles to the page (reused for both Meta and IAS)
function addReminderStyles() {
    // Check if styles are already added
    if (document.getElementById('reminder-styles')) {
        return;
    }

    const reminderStyles = document.createElement('style');
    reminderStyles.id = 'reminder-styles';
    reminderStyles.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');

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

        #meta-reminder-popup h3, #ias-reminder-popup h3 {
            margin-top: 0;
            font-size: 18px;
            font-weight: 700;
        }

        #meta-reminder-popup p, #ias-reminder-popup p {
            margin-bottom: 10px;
            font-size: 14px;
        }

        #meta-reminder-popup ul, #ias-reminder-popup ul {
            text-align: left;
            margin-bottom: 20px;
            font-size: 14px;
            padding-left: 20px;
        }

        #meta-reminder-popup li, #ias-reminder-popup li {
            margin-bottom: 5px;
        }

        #meta-reminder-close, #ias-reminder-close {
            background-color: white;
            color: #ff4087;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s, transform 0.1s;
        }

        #meta-reminder-close:hover, #ias-reminder-close:hover {
            background-color: #f8f8f8;
            animation: vibrate 0.3s ease-in-out;
        }

        #meta-reminder-close:active, #ias-reminder-close:active {
            transform: translateY(2px);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -60%); }
            to { opacity: 1; transform: translate(-50%, -50%); }
        }

        @keyframes vibrate {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-2px); }
            40% { transform: translateX(2px); }
            60% { transform: translateX(-1px); }
            80% { transform: translateX(1px); }
        }
    `;

    document.head.appendChild(reminderStyles);
}

// Flags to track if popups have been dismissed in current tab session
let metaReminderDismissed = false;
let iasReminderDismissed = false;

// Meta reminder functionality
function createMetaReminderPopup() {
    // Check if popup already exists or has been dismissed in this session
    if (document.getElementById('meta-reminder-popup') || metaReminderDismissed) {
        return;
    }

    // Add the styles first
    addReminderStyles();

    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'meta-reminder-popup';

    // Add content to popup
    popup.innerHTML = `
        <h3>⚠️ Meta Reconciliation Reminder ⚠️</h3>
        <p>When reconciling Meta, please:</p>
        <ul>
            <li>Actualise to the 'Supplier' option</li>
            <li>Self-accept the IO</li>
            <li>Push through on trafficking tab to Meta</li>
            <li>Verify success of the push, every time</li>
            <li>Do not just leave the page!</li>
        </ul>
        <button id="meta-reminder-close">Got it!</button>
    `;

    // Add popup to body
    document.body.appendChild(popup);

    // Add event listener to close button
    document.getElementById('meta-reminder-close').addEventListener('click', function() {
        document.body.removeChild(popup);
        // Set flag to prevent showing again in this tab session
        metaReminderDismissed = true;
    });

    // Set timeout to auto-close after 15 seconds
    setTimeout(() => {
        if (document.getElementById('meta-reminder-popup')) {
            document.body.removeChild(popup);
        }
    }, 15000);
}

// IAS reminder functionality
function createIASReminderPopup() {
    // Check if popup already exists or has been dismissed in this session
    if (document.getElementById('ias-reminder-popup') || iasReminderDismissed) {
        return;
    }

    // Add the styles first
    addReminderStyles();

    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'ias-reminder-popup'; // Use a unique ID

    // Add content to popup
    popup.innerHTML = `
        <h3>⚠️ IAS Booking Reminder ⚠️</h3>
        <p>Please ensure you book as CPM</p>
        <ul>
            <li>With correct rate for media type</li>
            <li>Check the plan</li>
            <li>Ensure what is planned is what goes live</li>
        </ul>
        <button id="ias-reminder-close">Got it!</button>
    `;

    // Add popup to body
    document.body.appendChild(popup);

    // Add event listener to close button
    document.getElementById('ias-reminder-close').addEventListener('click', function() {
        document.body.removeChild(popup);
        // Set flag to prevent showing again in this tab session
        iasReminderDismissed = true;
    });

    // Set timeout to auto-close after 15 seconds
    setTimeout(() => {
        if (document.getElementById('ias-reminder-popup')) {
            document.body.removeChild(popup);
        }
    }, 15000);
}


// Function to check for Meta vendor code AND "Redistribute all" on the page
function checkForMetaConditions() {
    chrome.storage.sync.get('metaReminderEnabled', function(data) {
        // Default to enabled if setting doesn't exist
        if (data.metaReminderEnabled !== false && !metaReminderDismissed) {
            const pageText = document.body.innerText;
            // Only show the reminder if both conditions are met
            if (pageText.includes('000770') && pageText.includes('Redistribute all')) {
                createMetaReminderPopup();
            }
        }
    });
}

// Function to check for "001148", "Flat", and "Unit Type" on the page
function checkForIASConditions() {
    // No specific setting for IAS reminder, so it's always potentially active unless dismissed
    if (!iasReminderDismissed) {
        const pageText = document.body.innerText;
        // Only show the reminder if all three conditions are met
        if (pageText.includes('001148') && pageText.includes('Flat') && pageText.includes('Unit Type')) {
            createIASReminderPopup();
        }
    }
}


// Reset the dismissed flags when page location changes
let currentUrl = window.location.href;
setInterval(() => {
    if (currentUrl !== window.location.href) {
        metaReminderDismissed = false;
        iasReminderDismissed = false; // Reset IAS flag
        currentUrl = window.location.href;
    }
}, 500); // Check every half second

// Check if the current URL matches the specified patterns
function shouldReplaceLogoOnThisPage() {
    const url = window.location.href;
    return url.includes('groupmuk-aura.mediaocean.com') || url.includes('groupmuk-prisma.mediaocean.com');
}

// Initial checks
if (shouldReplaceLogoOnThisPage()) {
    checkAndReplaceLogo();

    // Wait a bit for the page to fully load before checking for conditions
    setTimeout(() => {
        checkForMetaConditions();
        checkForIASConditions(); // Check for IAS conditions initially
    }, 2000);
}

// Observe DOM changes to handle dynamic content loading
const observer = new MutationObserver(function(mutations) {
    if (shouldReplaceLogoOnThisPage()) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                checkAndReplaceLogo();
                checkForMetaConditions();
                checkForIASConditions(); // Check for IAS conditions on mutations
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
    } else if (request.action === "showMetaReminder") {
        // Reset the dismissed flag for manual testing
        metaReminderDismissed = false;
        createMetaReminderPopup();
        sendResponse({status: "Meta reminder shown"});
    }
    // No specific action for triggering IAS reminder from popup was requested, but could be added similarly
    return true; // Keep the message channel open for asynchronous response
});
