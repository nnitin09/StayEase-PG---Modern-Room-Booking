// Booking page logic
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    let currentRoom = null;

    async function init() {
        if (!roomId) {
            window.location.href = '/rooms.html';
            return;
        }

        // Pre-fill user data if logged in
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const nameInput = document.getElementById('user-name');
            const emailInput = document.getElementById('user-email');
            if (nameInput) nameInput.value = user.name || '';
            if (emailInput) emailInput.value = user.email || '';
            // Make them readonly if we want to force the logged in user
            if (nameInput) nameInput.readOnly = true;
            if (emailInput) emailInput.readOnly = true;
        } else {
            // Should not happen if rooms.js check works, but just in case
            window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            return;
        }

        const checkInInput = document.getElementById('check-in');
        if (checkInInput) checkInInput.addEventListener('change', updateSummary);

        const bookingForm = document.getElementById('booking-form');
        const submitBtn = bookingForm ? bookingForm.querySelector('button[type="submit"]') : null;

        if (bookingForm) {
            bookingForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Disable button to prevent double clicks
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';
                }

                const duration = calculateDuration();
                const total = Math.round(currentRoom.price * (duration / 30));

                const formData = {
                    roomId: currentRoom.id,
                    name: document.getElementById('user-name').value,
                    email: document.getElementById('user-email').value,
                    phone: document.getElementById('user-phone').value,
                    checkIn: document.getElementById('check-in').value,
                    services: [],
                    totalPrice: total
                };

                try {
                    const data = await API.createBooking(formData);
                    const checkoutData = await API.createCheckoutSession(data.bookingId, currentRoom.type, total, currentRoom.id);
                    window.location.href = checkoutData.url;
                } catch (err) {
                    alert(err.message);
                    // Re-enable button on error
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Pay & Confirm Booking';
                    }
                }
            });
        }

        try {
            const rooms = await API.getRooms();
            currentRoom = rooms.find(r => r.id == roomId);
            if (!currentRoom) throw new Error('Room not found');

            const loadingEl = document.getElementById('loading');
            const contentEl = document.getElementById('booking-content');
            if (loadingEl) loadingEl.classList.add('hidden');
            if (contentEl) contentEl.classList.remove('hidden');
            
            updateSummary();
        } catch (err) {
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.innerHTML = `<p class="text-red-500">${err.message}</p>`;
        }
    }

    function calculateDuration() {
        return 30; // Default to 30 days (1 month) as check-out is removed
    }

    function updateSummary() {
        if (!currentRoom) return;
        const duration = calculateDuration();
        const total = Math.round(currentRoom.price * (duration / 30));

        document.getElementById('total-price').textContent = `₹${total}`;
        
        const summaryItems = document.getElementById('summary-items');
        summaryItems.innerHTML = `
            <div class="flex justify-between text-zinc-400">
                <span>${currentRoom.type} (Base)</span>
                <span>₹${currentRoom.price}</span>
            </div>
            <div class="flex justify-between text-zinc-400 text-sm italic">
                <span>Duration</span>
                <span>1 Month (30 Days)</span>
            </div>
        `;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
