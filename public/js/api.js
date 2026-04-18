// Shared API service for the application
const API = {
    async getRooms() {
        const res = await fetch('/api/rooms');
        if (!res.ok) {
            let errorMsg = 'Failed to fetch rooms';
            try {
                const error = await res.json();
                errorMsg = error.error || error.details || errorMsg;
            } catch (e) {
                // Fallback to generic message
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },

    async signup(userData) {
        const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Signup failed');
        }
        return res.json();
    },

    async sendOTP(email) {
        const res = await fetch('/api/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to send OTP');
        }
        return res.json();
    },

    async login(credentials) {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Login failed');
        }
        return res.json();
    },

    async requestPasswordReset(email) {
        const res = await fetch('/api/password/reset-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to request reset');
        }
        return res.json();
    },

    async confirmPasswordReset(email, otp, newPassword) {
        const res = await fetch('/api/password/reset-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to reset password');
        }
        return res.json();
    },

    async createBooking(formData) {
        const res = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (!res.ok) {
            let errorMsg = 'Booking failed';
            try {
                const error = await res.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = await res.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },

    async createCheckoutSession(bookingId, roomType, totalPrice, roomId) {
        const res = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, roomType, totalPrice, roomId })
        });
        if (!res.ok) {
            let errorMsg = 'Checkout failed';
            try {
                const error = await res.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = await res.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },

    async getUserBookings(email) {
        const res = await fetch(`/api/user/bookings?email=${email}`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return res.json();
    },

    async updateBookingServices(bookingId, services, totalPrice) {
        const res = await fetch(`/api/user/bookings/${bookingId}/services`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ services, totalPrice })
        });
        if (!res.ok) throw new Error('Failed to update services');
        return res.json();
    },

    async confirmBooking(bookingId) {
        const res = await fetch('/api/confirm-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId })
        });
        if (!res.ok) throw new Error('Confirmation failed');
        return res.json();
    },

    // Admin APIs
    async adminUploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (!res.ok) {
            let errorMsg = 'Upload failed';
            try {
                const error = await res.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = await res.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },

    async adminAddRoom(roomData) {
        const res = await fetch('/api/admin/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        if (!res.ok) {
            let errorMsg = 'Add room failed';
            try {
                const error = await res.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = await res.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },

    async adminUpdateRoom(id, roomData) {
        const res = await fetch(`/api/admin/rooms/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        if (!res.ok) {
            let errorMsg = 'Update room failed';
            try {
                const error = await res.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = await res.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },

    async adminDeleteRoom(id) {
        const res = await fetch(`/api/admin/rooms/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            let errorMsg = 'Delete room failed';
            try {
                const error = await res.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = await res.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }
        return res.json();
    }
};

window.API = API;
