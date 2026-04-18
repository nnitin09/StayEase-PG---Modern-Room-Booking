// Shared components injection logic
(function() {
const Components = {
    renderNavbar() {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const navbar = document.getElementById('navbar-placeholder');
        if (!navbar) return;

        navbar.innerHTML = `
            <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16 items-center">
                        <a href="/" class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                            <span class="font-bold text-xl tracking-tight text-zinc-900">StayEase ${isAdmin ? 'Admin' : ''}</span>
                        </a>
                        
                        <div class="hidden md:flex items-center gap-8">
                            <a href="/" class="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Home</a>
                            <a href="/rooms.html" class="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Rooms</a>
                            <a href="/dashboard.html" class="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">MyPG</a>
                            ${isAdmin ? '<a href="/admin.html" class="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Admin Panel</a>' : ''}
                            
                            ${user ? `
                                <div class="flex items-center gap-4">
                                    <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Hi, ${user.name.split(' ')[0]}</span>
                                    <button id="logout-btn" class="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-full text-sm font-medium hover:bg-zinc-200 transition-all">
                                        Logout
                                    </button>
                                </div>
                            ` : `
                                <a href="/login.html" class="px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-all">
                                    Login
                                </a>
                            `}
                        </div>

                        <button class="md:hidden" id="menu-btn">
                            <i data-lucide="menu"></i>
                        </button>
                    </div>
                </div>
                <div id="mobile-menu" class="hidden md:hidden bg-white border-b border-black/5 p-4 flex flex-col gap-4">
                    <a href="/" class="text-lg font-medium">Home</a>
                    <a href="/rooms.html" class="text-lg font-medium">Rooms</a>
                    <a href="/dashboard.html" class="text-lg font-medium">MyPG</a>
                    ${isAdmin ? '<a href="/admin.html" class="text-lg font-medium">Admin Panel</a>' : ''}
                    ${user ? `
                        <button id="mobile-logout-btn" class="text-lg font-medium text-left text-red-600">Logout (${user.name})</button>
                    ` : `
                        <a href="/login.html" class="text-lg font-medium">Login</a>
                    `}
                </div>
            </nav>
        `;

        // Re-initialize icons
        if (window.lucide) window.lucide.createIcons();

        // Mobile menu toggle
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        }

        // Logout logic
        const logoutHandler = () => {
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('user');
            window.location.href = '/';
        };

        const logoutBtn = document.getElementById('logout-btn');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', logoutHandler);
        if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', logoutHandler);
    },

    renderFooter() {
        const footer = document.getElementById('footer-placeholder');
        if (!footer) return;

        footer.innerHTML = `
            <footer class="bg-black text-white py-12 border-t border-zinc-800">
                <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 class="font-bold text-lg mb-4 text-white">StayEase PG</h3>
                        <p class="text-zinc-400 text-sm leading-relaxed">
                            Providing premium living spaces for students and professionals since 2020. 
                            Comfort, security, and community at your doorstep.
                        </p>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm uppercase tracking-widest text-zinc-500 mb-4">Quick Links</h4>
                        <ul class="space-y-2 text-sm text-zinc-300">
                            <li><a href="/rooms.html" class="hover:text-emerald-400">Available Rooms</a></li>
                            <li><a href="/privacy.html" class="hover:text-emerald-400">Privacy Policy</a></li>
                            <li><a href="/terms.html" class="hover:text-emerald-400">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm uppercase tracking-widest text-zinc-500 mb-4">Contact Us</h4>
                        <ul class="space-y-2 text-sm text-zinc-300">
                            <li class="flex items-center gap-2"><i data-lucide="phone" class="w-4 h-4 text-emerald-500"></i> +91 73067 04230</li>
                            <li class="flex items-center gap-2"><i data-lucide="mail" class="w-4 h-4 text-emerald-500"></i> muhammedfarsinb@gmail.com</li>
                        </ul>
                    </div>
                </div>
                <div class="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-xs">
                    &copy; 2026 StayEase Premium PG. All rights reserved.
                </div>
            </footer>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    init() {
        this.renderNavbar();
        this.renderFooter();
    }
};

window.Components = Components;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Components.init());
    } else {
        Components.init();
    }
})();
