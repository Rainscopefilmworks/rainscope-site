// Infinite Auto-Scrolling Posters Carousel for Our Work Page
// Initialize immediately (works even if script loads async late)
console.log('our-work.js loaded');
(function initInfinitePostersCarousel() {
    console.log('initInfinitePostersCarousel function called');
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
        
        // Wait for images to load before starting animation (ensures proper width calculation)
        const images = carousel.querySelectorAll('img');
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if image fails
                // Timeout after 2 seconds to not block forever
                setTimeout(resolve, 2000);
            });
        });
        
        Promise.all(imagePromises).then(() => {
            // Force reflow to ensure layout is calculated
            carousel.offsetHeight;
            
            // Enable infinite scroll animation via CSS class
            carousel.classList.add('infinite-scroll');
            
            // Detailed debugging
            const computedStyle = window.getComputedStyle(carousel);
            const animationName = computedStyle.getPropertyValue('animation-name');
            const animationDuration = computedStyle.getPropertyValue('animation-duration');
            const animationTimingFunction = computedStyle.getPropertyValue('animation-timing-function');
            const animationIterationCount = computedStyle.getPropertyValue('animation-iteration-count');
            const animationPlayState = computedStyle.getPropertyValue('animation-play-state');
            const transform = computedStyle.getPropertyValue('transform');
            const display = computedStyle.getPropertyValue('display');
            const width = computedStyle.getPropertyValue('width');
            const carouselWidth = carousel.offsetWidth;
            const scrollWidth = carousel.scrollWidth;
            
            console.log('=== CAROUSEL DEBUG INFO ===');
            console.log('Posters carousel initialized with', originalSlides.length, 'slides');
            console.log('Total slides (including duplicates):', carousel.querySelectorAll('.poster-slide').length);
            console.log('Has infinite-scroll class:', carousel.classList.contains('infinite-scroll'));
            console.log('--- Animation Properties ---');
            console.log('Animation name:', animationName);
            console.log('Animation duration:', animationDuration);
            console.log('Animation timing function:', animationTimingFunction);
            console.log('Animation iteration count:', animationIterationCount);
            console.log('Animation play state:', animationPlayState);
            console.log('--- Layout Properties ---');
            console.log('Display:', display);
            console.log('Width (computed):', width);
            console.log('Width (offsetWidth):', carouselWidth);
            console.log('Scroll width:', scrollWidth);
            console.log('Transform:', transform);
            console.log('--- CSS Check ---');
            const allStyles = Array.from(document.styleSheets).map(sheet => {
                try {
                    return Array.from(sheet.cssRules || []).filter(rule => 
                        rule.selectorText && rule.selectorText.includes('infinite-scroll')
                    );
                } catch(e) {
                    return [];
                }
            }).flat();
            console.log('Found CSS rules for infinite-scroll:', allStyles.length);
            if (allStyles.length > 0) {
                allStyles.forEach(rule => console.log('  -', rule.selectorText, rule.cssText.substring(0, 100)));
            }
            
            // If animation isn't applied, force it inline
            if (!animationName || animationName === 'none' || animationName.trim() === '') {
                console.warn('⚠️ CSS animation not detected, applying inline animation as fallback');
                
                // First, inject the @keyframes if it doesn't exist
                const styleId = 'infinite-scroll-keyframes';
                if (!document.getElementById(styleId)) {
                    const keyframesStyle = document.createElement('style');
                    keyframesStyle.id = styleId;
                    keyframesStyle.textContent = `
                        @keyframes infiniteScroll {
                            0% {
                                transform: translateX(0);
                            }
                            100% {
                                transform: translateX(-50%);
                            }
                        }
                    `;
                    document.head.appendChild(keyframesStyle);
                    console.log('✅ Injected @keyframes infiniteScroll');
                }
                
                // Apply animation inline
                carousel.style.animation = 'infiniteScroll 30s linear infinite';
                carousel.style.willChange = 'transform';
                
                // Check again after applying inline
                setTimeout(() => {
                    const newComputedStyle = window.getComputedStyle(carousel);
                    const newAnimationName = newComputedStyle.getPropertyValue('animation-name');
                    const newAnimationDuration = newComputedStyle.getPropertyValue('animation-duration');
                    console.log('After inline fallback - Animation name:', newAnimationName);
                    console.log('After inline fallback - Animation duration:', newAnimationDuration);
                    
                    if (newAnimationName && newAnimationName !== 'none') {
                        console.log('✅ Animation successfully applied via inline fallback');
                    } else {
                        console.error('❌ Animation still not working after inline fallback');
                    }
                }, 100);
            } else {
                console.log('✅ CSS animation detected and applied');
            }
            
            // Force animation restart if needed
            carousel.offsetHeight; // Trigger reflow
        });
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
    
    // Expose function globally as fallback
    window.initCarouselManually = initCarousel;
})();
