// Success page logic
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');

    async function confirm() {
        if (!bookingId) {
            showError('No booking ID found.');
            return;
        }

        try {
            await API.confirmBooking(bookingId);
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('success-content').classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            showError(err.message);
        }
    }

    function showError(msg) {
        const loading = document.getElementById('loading');
        const errorContent = document.getElementById('error-content');
        const errorMsg = document.getElementById('error-msg');
        
        if (loading) loading.classList.add('hidden');
        if (errorContent) errorContent.classList.remove('hidden');
        if (errorMsg) errorMsg.textContent = msg;
        if (window.lucide) window.lucide.createIcons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', confirm);
    } else {
        confirm();
    }
})();
