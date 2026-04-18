// Admin panel logic
(function() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    let roomsList, roomForm, submitBtn, cancelBtn, formTitle;

    async function init() {
        console.log('Initializing admin panel...');
        
        roomsList = document.getElementById('rooms-list');
        roomForm = document.getElementById('room-form');
        submitBtn = document.getElementById('submit-btn');
        cancelBtn = document.getElementById('cancel-btn');
        formTitle = document.getElementById('form-title');

        if (!isAdmin) {
            const accessDenied = document.getElementById('access-denied');
            if (accessDenied) accessDenied.classList.remove('hidden');
            return;
        }

        const adminContent = document.getElementById('admin-content');
        if (adminContent) adminContent.classList.remove('hidden');

        const formError = document.getElementById('form-error');
        const formSuccess = document.getElementById('form-success');

        function showMsg(el, msg) {
            if (!el) return;
            el.textContent = msg;
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('hidden'), 5000);
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                roomForm.reset();
                document.getElementById('room-id').value = '';
                formTitle.textContent = 'Manage Room';
                submitBtn.textContent = 'Add Room';
                cancelBtn.classList.add('hidden');
                if (formError) formError.classList.add('hidden');
                if (formSuccess) formSuccess.classList.add('hidden');
            };
        }

        if (roomForm) {
            roomForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (formError) formError.classList.add('hidden');
                if (formSuccess) formSuccess.classList.add('hidden');
                
                const type = document.getElementById('room-type').value;
                const priceStr = document.getElementById('room-price').value;
                const capacityStr = document.getElementById('room-capacity').value;
                const availableStr = document.getElementById('room-available').value;
                const description = document.getElementById('room-description').value;

                if (!type || !priceStr || !capacityStr || !availableStr || !description) {
                    showMsg(formError, 'Please fill out all required fields (Type, Price, Capacity, Available, Description).');
                    return;
                }

                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';

                const id = document.getElementById('room-id').value;
                const roomData = {
                    type: type,
                    price: parseInt(priceStr),
                    capacity: parseInt(capacityStr),
                    available: parseInt(availableStr),
                    description: description,
                    image: document.getElementById('room-image').value
                };

                try {
                    if (id) {
                        await API.adminUpdateRoom(id, roomData);
                        showMsg(formSuccess, 'Room updated successfully!');
                    } else {
                        await API.adminAddRoom(roomData);
                        showMsg(formSuccess, 'Room added successfully!');
                    }
                    roomForm.reset();
                    if (cancelBtn) cancelBtn.onclick();
                    fetchRooms();
                } catch (err) {
                    showMsg(formError, 'Operation failed: ' + err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        }

        const imageUpload = document.getElementById('image-upload');
        const roomImageInput = document.getElementById('room-image');
        if (imageUpload && roomImageInput) {
            imageUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                if (formError) formError.classList.add('hidden');
                if (formSuccess) formSuccess.classList.add('hidden');

                const originalValue = roomImageInput.value;
                roomImageInput.value = 'Uploading image, please wait...';
                roomImageInput.disabled = true;
                if (submitBtn) submitBtn.disabled = true;
                
                try {
                    const data = await API.adminUploadImage(file);
                    roomImageInput.value = data.imageUrl;
                    showMsg(formSuccess, 'Image uploaded successfully!');
                } catch (err) {
                    roomImageInput.value = originalValue;
                    showMsg(formError, 'Image upload failed: ' + err.message);
                    alert('Image upload failed: ' + err.message); // Fallback alert
                } finally {
                    roomImageInput.disabled = false;
                    if (submitBtn) submitBtn.disabled = false;
                    e.target.value = ''; // Reset file input so same file can be selected again
                }
            });
        }
        
        try {
            await fetchRooms();
        } catch (err) {
            console.error('Admin init failed:', err);
        }
    }

    async function fetchRooms() {
        if (!roomsList) return;
        try {
            const rooms = await API.getRooms();
            roomsList.innerHTML = rooms.map(room => `
                <div class="bg-white p-6 rounded-3xl border border-black/5 flex flex-col sm:flex-row gap-6 items-center">
                    <img src="${room.image}" class="w-32 h-32 object-cover rounded-2xl" alt="${room.type}">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-lg truncate">${room.type}</h3>
                        <p class="text-sm text-zinc-500">₹${room.price} | ${room.capacity} Sharing | ${room.available} Available</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick='window.editRoom(${JSON.stringify(room)})' class="p-2 bg-zinc-100 rounded-lg hover:bg-zinc-200 text-zinc-600"><i data-lucide="pencil" class="w-5 h-5"></i></button>
                        <button onclick="window.deleteRoom(${room.id})" class="p-2 bg-red-50 rounded-lg hover:bg-red-100 text-red-600"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                    </div>
                </div>
            `).join('');
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            roomsList.innerHTML = '<p class="text-red-500">Failed to load rooms.</p>';
        }
    }

    window.editRoom = function(room) {
        document.getElementById('room-id').value = room.id;
        document.getElementById('room-type').value = room.type;
        document.getElementById('room-price').value = room.price;
        document.getElementById('room-capacity').value = room.capacity;
        document.getElementById('room-available').value = room.available;
        document.getElementById('room-description').value = room.description;
        document.getElementById('room-image').value = room.image;
        
        formTitle.textContent = 'Edit Room';
        submitBtn.textContent = 'Update Room';
        cancelBtn.classList.remove('hidden');
    };

    window.deleteRoom = async function(id) {
        if (!confirm('Are you sure you want to delete this room?')) return;
        try {
            await API.adminDeleteRoom(id);
            fetchRooms();
            alert('Room deleted successfully!');
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
