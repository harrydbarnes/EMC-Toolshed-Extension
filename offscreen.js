const IS_DEVELOPMENT = false; // Set to true for development console logs

chrome.runtime.onMessage.addListener(handleMessage);

async function handleMessage(message, sender, sendResponse) {
    if (IS_DEVELOPMENT) console.log('[Offscreen] Message received:', message);

    // Optional: Check if the message is specifically for the offscreen document
    // if (message.target !== 'offscreen') return; // Example of targeting

    if (message.action === 'playAlarm') {
        if (!message.sound) {
            if (IS_DEVELOPMENT) console.error('[Offscreen] No sound URL provided.');
            sendResponse({ status: 'Error: No sound URL' });
            return true;
        }
        try {
            if (IS_DEVELOPMENT) console.log('[Offscreen] Attempting to play audio:', message.sound);
            const audio = new Audio(message.sound);
            audio.play()
                .then(() => {
                    if (IS_DEVELOPMENT) console.log('[Offscreen] Audio playback started.');
                    sendResponse({ status: 'Audio playback started' });
                    // Chrome automatically closes offscreen documents after ~30s of inactivity (e.g., sound ends).
                    // If explicit closing is needed sooner:
                    // audio.onended = () => { close(); };
                })
                .catch(error => {
                    if (IS_DEVELOPMENT) console.error('[Offscreen] Error playing audio:', error);
                    sendResponse({ status: 'Error playing audio', error: error.message });
                });
        } catch (error) {
            if (IS_DEVELOPMENT) console.error('[Offscreen] General error in playAlarm:', error);
            sendResponse({ status: 'General error', error: error.message });
        }
        return true; // Indicates asynchronous response
    }
    return false; // No asynchronous response for other actions
}

if (IS_DEVELOPMENT) console.log('[Offscreen] Script loaded and listener attached.');
