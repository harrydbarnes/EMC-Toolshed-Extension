chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'playAlarm') {
        try {
            // Play the audio file received from the background script
            const audio = new Audio(message.sound);
            await audio.play();
            // Optional: Add logic to close the offscreen document after sound finishes if needed
        } catch (error) {
            console.error('Error playing audio in offscreen document:', error);
        }
    }
});
