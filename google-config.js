// === GOOGLE OAUTH CONFIGURATION ===
// Replace YOUR_GOOGLE_CLIENT_ID with your actual Google Client ID
// Get it from: https://console.cloud.google.com/apis/credentials

window.GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';

// Update the Google Sign-In component when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const gIdOnload = document.getElementById('g_id_onload');
    if (gIdOnload && window.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
        gIdOnload.setAttribute('data-client_id', window.GOOGLE_CLIENT_ID);
    }
});
