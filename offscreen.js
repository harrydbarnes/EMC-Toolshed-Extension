chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'playAlarm') {
        (async () => {
            try {
                const audio = new Audio(message.sound);
                await audio.play();
            } catch (error) {
                console.error('Error playing audio in offscreen document:', error);
            }
        })();
        // No response needed for this action
    } else if (message.action === 'readClipboard') {
        (async () => {
            try {
                const text = await navigator.clipboard.readText();
                sendResponse({ status: 'success', text: text });
            } catch (error) {
                console.error('Error reading clipboard in offscreen document:', error);
                sendResponse({ status: 'error', message: error.message });
            }
        })();
        return true; // Required for async sendResponse
    }
});
