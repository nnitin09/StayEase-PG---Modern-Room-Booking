// Dashboard page logic
(function() {
    let emailInput, fetchBtn, bookingsList;

    function init() {
        emailInput = document.getElementById('dashboard-email');
        fetchBtn = document.getElementById('fetch-bookings-btn');
        bookingsList = document.getElementById('bookings-list');

        if (fetchBtn) fetchBtn.addEventListener('click', fetchBookings);

        // Auto-fill and fetch if logged in
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (emailInput && user.email) {
                emailInput.value = user.email;
                fetchBookings();
            }
        }
    }

    async function fetchBookings() {
        if (!emailInput || !bookingsList) return;
        const email = emailInput.value;
        if (!email) return;

        bookingsList.innerHTML = '<p class="text-center py-12 text-zinc-500">Loading bookings...</p>';

        try {
            const bookings = await API.getUserBookings(email);
            
            if (bookings.length === 0) {
                bookingsList.innerHTML = '<p class="text-center py-12 text-zinc-500">No bookings found for this email.</p>';
                return;
            }

            bookingsList.innerHTML = bookings.map(booking => {
                const activeServices = JSON.parse(booking.services || '[]');
                return `
                    <div class="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                        <div class="flex justify-between items-start mb-6">
                            <div>
                                <h3 class="text-xl font-bold text-zinc-900">${booking.room_type}</h3>
                                <p class="text-sm text-zinc-500">Check-in: ${booking.check_in} | Phone: ${booking.user_phone || 'N/A'}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-2xl font-bold text-emerald-600">₹${booking.total_price}</p>
                                <div class="flex flex-col items-end gap-2">
                                    <span class="text-[10px] uppercase font-bold px-2 py-1 bg-zinc-100 rounded-full">${booking.status}</span>
                                    ${booking.status === 'pending' ? `
                                        <button 
                                            onclick="window.cancelBooking(${booking.id})"
                                            class="text-[10px] text-red-500 font-bold hover:underline"
                                        >
                                            Cancel Booking
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            bookingsList.innerHTML = '<p class="text-center py-12 text-red-500">Failed to load bookings.</p>';
        }
    }

    window.cancelBooking = async function(bookingId) {
        if (!confirm('Are you sure you want to cancel this pending booking?')) return;
        
        try {
            const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to cancel booking');
            fetchBookings();
        } catch (err) {
            alert(err.message);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
