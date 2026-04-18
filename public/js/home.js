// Home page logic
(function() {
    function animateCounters() {
        const counters = document.querySelectorAll('[data-count]');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-count');
            const duration = 2000; // 2 seconds
            const startTime = performance.now();
            
            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (outQuad)
                const easedProgress = 1 - (1 - progress) * (1 - progress);
                
                const currentCount = Math.floor(easedProgress * target);
                counter.textContent = currentCount + (target > 99 ? '+' : '+');
                
                // Specific formatting for Safety Score
                if (counter.nextElementSibling.textContent.includes('Safety Score')) {
                    counter.textContent = currentCount + '%';
                }

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target + (counter.nextElementSibling.textContent.includes('Safety Score') ? '%' : '+');
                }
            };
            
            requestAnimationFrame(updateCounter);
        });
    }

    function init() {
        console.log('Home page initializing...');
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Intersection Observer for reveal animations
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    
                    // If it's the stats container, trigger counters
                    if (entry.target.classList.contains('stagger-reveal') && entry.target.querySelector('[data-count]')) {
                        animateCounters();
                    }
                    
                    // Unobserve after animating
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal, .stagger-reveal').forEach(el => {
            observer.observe(el);
        });

        // Hero parallax effect on mouse move
        const heroSection = document.querySelector('section');
        if (heroSection) {
            heroSection.addEventListener('mousemove', (e) => {
                const { clientX, clientY } = e;
                const { innerWidth, innerHeight } = window;
                
                const moveX = (clientX - innerWidth / 2) / innerWidth * 20;
                const moveY = (clientY - innerHeight / 2) / innerHeight * 20;
                
                const heroImg = heroSection.querySelector('img');
                if (heroImg) {
                    heroImg.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
