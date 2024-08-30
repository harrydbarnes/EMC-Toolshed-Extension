document.addEventListener('DOMContentLoaded', function() {
    const openTimesheetsButton = document.getElementById('openTimesheets');
    const dismissButton = document.getElementById('dismiss');
    const alarmSound = document.getElementById('alarmSound');

    // Play the alarm sound
    alarmSound.play();

    openTimesheetsButton.addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://groupmuk-aura.mediaocean.com/viewport-home/#osAppId=rod-time&osPspId=rod-time&route=time/display/myTimesheets/ToDo' });
        window.close();
    });

    dismissButton.addEventListener('click', function() {
        window.close();
    });
});
