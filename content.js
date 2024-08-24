function replaceLogo() {
    const logoImg = document.querySelector('i.logo');
    if (logoImg) {
        const newLogo = document.createElement('img');
        newLogo.src = chrome.runtime.getURL('icon.png');
        newLogo.style.width = '32px';
        newLogo.style.height = '32px';
        newLogo.className = 'custom-logo';
        logoImg.parentNode.replaceChild(newLogo, logoImg);
    }
}

function restoreOriginalLogo() {
    const customLogo = document.querySelector('img.custom-logo');
    if (customLogo) {
        const originalLogo = document.createElement('i');
        originalLogo.className = 'logo';
        originalLogo.style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAAA9CAYAAAAQyx+GAAAACXBIWXMAABYlAAAWJQFJUiTwAAAFH0lEQVR4nN1bPXLaUBDeaFSoMxWtfQPcU5ioFyYnsBrqcARyA1KrMD5BCOoVKOjNDUyrCjoVDM48sk9eCUlG0q5s8s0wntjhSfr07e/b9+X19RXKwHaiGwBQn1sAaAHAAgC2gW89l1rok+NsYmwncgFgBACdnP+yAYApAEwC39r+98TYTtTDB74+c80dAIwD35qw3OEHoZAYVMljxVt7CnzLvSAuEjDy/lCTFIUH24mm9W7v45CpGHS2D4w3oAgefL5HL0aWYpRauHFxTjhBjO1EKmm7E7iOxJqiSCtmJHUxJP1iYJAbbwn7gotywFQxA8ZIdPEwU8SIIfCtRd7aphfe4vVbWJxqqO/M9sN24wVqnODZTrQVVMwm8K2b9C9NL3QxCr5Xh6kCdbQfthtLFI+KwdxF0owSD2R6YQt/d260UsT9Mr3wtwr9+2FbvHrXPqYnfJ240kZSFhVD+L36Lq4hCk2MZChVVfYL+feioKdzDjq4hig0MSf2z4QdzaRNLxzXJEWjg2uJQRPDcbNZmGm1oPw5E8iRpEnl9mOYQN/qiNnBixanBkYkCSwF1aIhR4zUwqkQLZVVi0XTJomRgFjuJUXMJhWi74WuIwZTaOE4zzC9UDp5fBfGan5LqvuXQ7f/8t53pIihF5ZMHjd5fzBWcxdN+EStxmq+w5c3OXT7mcmimXoILtCLSabvJw9lrObnbBBeIWH3xmq+VBHz0O0nKngj5QskIGlKiX0rVMmfErumgDXbAr/7thb+zJXkJ8ZyP2zHisEHq7pBqBT0SMnRxEirRgJxVo3mU2fXVGNirObHulETI16tMmNN1ZI2qRq40mtpYi5ttiUmAuVfxqe8hzsV3ptQjATp0lm1eyQGB33WjAvT3IW7DbnbD9vUJ0pEvR4tCTgbzbTxxa3GWIHoKCXqpQ4lhnOWhb5FSf8l1Xl8KyIx0eMyp44e/cCOPqeZNoJ0dc05N0dVIzVZJabGBDGBb02xgc0BGi04/Ve87XLo9reM90uxzOrHcKnmgZiTMtMnpnX1lq6GxO7kLI8YrrdACzNOc6JqlDDTU2Iwp+Has4kb4JjCc6kmJhz7KUumdRWeVCMrs7WJw8sckeTadiK6OzBmUuM1DgRouEzrbvTLLOr5cs3NjVO+hmsbZaw33LBVWfd+FbEDdOj5xOChiR81Lwa0YoV/5EyZTOqaBopDt6+c8NeKylFK6dEuXuEuQeBbYyb7vcdJ8yP2w7bLZKoPphfGCkR/c1OS+J+qtku3Ns85ZNHCRKpuaa/eZE8f3yHjIBz75j/2w3YiYGAd5WKiSUdOdvg8SmGzvB2Ds47l4MTlgqFgU5K91cd2kJwp074T61BRmfNKXOSsUTnxA5heqHzF95rrAqpBrTWpS1CpE27M5AzoDgVuzJU5F1WEnTYVdb9VSKpy9I+LnITPgeRUBPfICODLGKV6xbkoTQy8HduZcTlOjH4xkCB91LCugtZoWqVKh0rEwFu0mjCdVDnuBmYdOCUzwOnokodE1Em1Qc9GZWI0bCcaoG/gkP4TnqfMfRjTC28KOnfPjUelIqB6xkyRBZCg2UeejGMhRgN9z5TxGM5Gj82rn00eW2YlRgMj14j5pBwQ/7HNaGsewz12IWtDhBgNNDEXP1Ijs2tU6ZRTUaLEUKCZ9cinahjW5rVA8xIZSGiMmCzgKG36KE4WjuZTdLSHFQDwF+L6+OT9RThbAAAAAElFTkSuQmCC)';
        originalLogo.style.width = '32px';
        originalLogo.style.height = '32px';
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

// Initial check and replace
checkAndReplaceLogo();

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "toggleLogo") {
        checkAndReplaceLogo();
    }
});

// Observe DOM changes to handle dynamic content loading
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            checkAndReplaceLogo();
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });
