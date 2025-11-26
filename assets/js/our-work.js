// Infinite Auto-Scrolling Posters Carousel for Our Work Page
// Initialize immediately (works even if script loads async late)
(function initInfinitePostersCarousel() {
    function initCarousel() {
        const carousel = document.getElementById('postersCarousel');
        if (!carousel) {
            console.warn('Posters carousel element not found');
            return;
        }
        
        const slides = Array.from(carousel.querySelectorAll('.poster-slide'));
        if (slides.length === 0) {
            console.warn('No poster slides found');
            return;
        }
        
        // Duplicate slides once for seamless infinite scroll
        // Moving by 50% will loop perfectly back to start
        const originalSlides = [...slides];
        
        // Remove any existing duplicates (in case script runs multiple times)
        const existingClones = carousel.querySelectorAll('.poster-slide.duplicate');
        existingClones.forEach(clone => clone.remove());
        
        // Duplicate all slides once (creates 2x total for seamless loop)
        originalSlides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.classList.add('duplicate');
            // Clone nodes preserve img src, ensure loading is eager for performance
            const cloneImages = clone.querySelectorAll('img');
            cloneImages.forEach(img => {
                img.loading = 'eager';
                img.setAttribute('loading', 'eager');
            });
            carousel.appendChild(clone);
        });
        
        // Enable infinite scroll animation via CSS class
        carousel.classList.add('infinite-scroll');
        console.log('Posters carousel initialized with', originalSlides.length, 'slides');
    }
    
    // Try multiple initialization strategies to ensure it works
    function tryInit() {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // Wait a tiny bit to ensure DOM is fully ready
            setTimeout(initCarousel, 10);
        } else {
            document.addEventListener('DOMContentLoaded', initCarousel);
        }
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        // DOM already loaded, initialize immediately
        tryInit();
    }
    
    // Fallback: try again after a short delay in case images haven't loaded yet
    setTimeout(function() {
        const carousel = document.getElementById('postersCarousel');
        if (carousel && !carousel.classList.contains('infinite-scroll')) {
            console.log('Retrying carousel initialization...');
            initCarousel();
        }
    }, 500);
})();
