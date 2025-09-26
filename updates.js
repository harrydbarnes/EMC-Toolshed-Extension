document.addEventListener('DOMContentLoaded', () => {
    const tabContainer = document.querySelector('.tab-container');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            const clickedButton = e.target.closest('.tab-button');
            if (!clickedButton) return;

            const tabId = clickedButton.dataset.tab;
            const targetContent = document.getElementById(tabId);

            // Deactivate all buttons and content
            tabButtons.forEach(button => button.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activate the clicked button and corresponding content
            clickedButton.classList.add('active');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    }
});