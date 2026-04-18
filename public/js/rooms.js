// Rooms page logic
(function() {
    let allRooms = [];
    let roomsGrid, searchInput, priceRange, priceDisplay;

    async function init() {
        console.log('Initializing rooms page...');
        
        // Select elements here to ensure they are available
        roomsGrid = document.getElementById('rooms-grid');
        searchInput = document.getElementById('search-input');
        priceRange = document.getElementById('price-range');
        priceDisplay = document.getElementById('price-display');

        if (!roomsGrid) {
            console.error('rooms-grid element not found!');
            return;
        }

        if (searchInput) searchInput.addEventListener('input', renderRooms);
        if (priceRange) priceRange.addEventListener('input', renderRooms);

        if (!window.API) {
            console.error('API service not found!');
            roomsGrid.innerHTML = '<p class="col-span-full text-center text-red-500">System error: API service missing.</p>';
            return;
        }

        try {
            allRooms = await API.getRooms();
            console.log('Rooms fetched:', allRooms);
            renderRooms();
        } catch (err) {
            console.error('Failed to load rooms:', err);
            roomsGrid.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to load rooms: ${err.message}</p>`;
        }
    }

    function renderRooms() {
        const query = searchInput.value.toLowerCase();
        const maxPrice = parseInt(priceRange.value);
        priceDisplay.textContent = `₹${maxPrice}`;

        const filtered = allRooms.filter(room => {
            const matchesSearch = room.type.toLowerCase().includes(query) || room.description.toLowerCase().includes(query);
            const matchesPrice = room.price <= maxPrice;
            return matchesSearch && matchesPrice;
        });

        if (filtered.length === 0) {
            roomsGrid.innerHTML = '<div class="col-span-full text-center py-24 bg-white rounded-3xl border border-dashed border-zinc-200"><p class="text-zinc-400 font-medium">No rooms found matching your criteria.</p></div>';
            return;
        }

        const interests = JSON.parse(localStorage.getItem('interestedRooms') || '[]');

        roomsGrid.innerHTML = filtered.map(room => {
            const isInterested = interests.includes(room.id);
            const interestBtnClass = isInterested 
                ? 'w-full py-3 bg-emerald-600 border-2 border-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2'
                : 'w-full py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2';
            const interestIconClass = isInterested ? 'fill-current' : '';
            const interestText = isInterested ? 'Saved to Interests' : 'I am interested';

            return `
            <div class="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm hover:shadow-xl transition-all group">
                <div class="relative h-64 overflow-hidden">
                    <img src="${room.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${room.type}">
                    <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-600">
                        ${room.available} Left
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-zinc-900">${room.type}</h3>
                            <p class="text-sm text-zinc-500">${room.capacity} Sharing</p>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-bold text-emerald-600">₹${room.price}</p>
                            <p class="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Per Month</p>
                        </div>
                    </div>
                    <p class="text-sm text-zinc-600 mb-6 line-clamp-2">${room.description}</p>
                    <button onclick="window.bookRoom(${room.id})" class="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mb-3">
                        Book Now <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </button>
                    <button onclick="window.expressInterest(${room.id})" id="interest-btn-${room.id}" class="${interestBtnClass}">
                        <i data-lucide="heart" class="w-4 h-4 ${interestIconClass}"></i> <span id="interest-text-${room.id}">${interestText}</span>
                    </button>
                </div>
            </div>
            `;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    window.bookRoom = function(id) {
        const user = localStorage.getItem('user');
        if (!user) {
            // Redirect to login with a return path
            window.location.href = `/login.html?redirect=${encodeURIComponent('/book.html?id=' + id)}`;
            return;
        }
        window.location.href = `/book.html?id=${id}`;
    };

    window.expressInterest = function(id) {
        const btn = document.getElementById(`interest-btn-${id}`);
        const textSpan = document.getElementById(`interest-text-${id}`);
        // Read existing interests
        let interests = JSON.parse(localStorage.getItem('interestedRooms') || '[]');
        
        if (interests.includes(id)) {
            // Remove interest
            interests = interests.filter(roomId => roomId !== id);
            localStorage.setItem('interestedRooms', JSON.stringify(interests));
            if(btn && textSpan) {
                 textSpan.textContent = 'I am interested';
                 btn.className = 'w-full py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2';
                 btn.querySelector('i').classList.remove('fill-current');
            }
            alert("Removed from your interests.");
        } else {
            // Add interest
            interests.push(id);
            localStorage.setItem('interestedRooms', JSON.stringify(interests));
            if(btn && textSpan) {
                 textSpan.textContent = 'Saved to Interests';
                 btn.className = 'w-full py-3 bg-emerald-600 border-2 border-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2';
                 btn.querySelector('i').classList.add('fill-current');
            }
            alert("Added to your interests! We will keep you updated.");
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
