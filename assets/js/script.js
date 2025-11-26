// Testimonials Slider
// Initialize immediately (works even if script loads async late)
(function initTestimonialsSlider() {
    function initSlider() {
    try {
        const slides = document.querySelectorAll('.testimonial-slide');
        const indicators = document.querySelectorAll('.indicator');
        
        // Only initialize slider if slides exist
        if (!slides || slides.length === 0) {
            return; // Exit early if no testimonials on this page
        }
        
        let currentSlide = 0;
        let slideInterval;

        function showSlide(index) {
            if (!slides || !indicators) return;
            slides.forEach(slide => {
                if (slide) slide.classList.remove('active');
            });
            indicators.forEach(indicator => {
                if (indicator) indicator.classList.remove('active');
            });
            
            if (slides[index]) {
                slides[index].classList.add('active');
            }
            if (indicators[index]) {
                indicators[index].classList.add('active');
            }
        }

        function nextSlide() {
            if (!slides || slides.length === 0) return;
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }

        function startSlider() {
            if (slides && slides.length > 0) {
                slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
            }
        }

        function stopSlider() {
            if (slideInterval) {
                clearInterval(slideInterval);
            }
        }

        // Indicator click handlers
        if (indicators && indicators.length > 0) {
            indicators.forEach((indicator, index) => {
                if (indicator && typeof indicator.addEventListener === 'function') {
                    indicator.addEventListener('click', () => {
                        currentSlide = index;
                        showSlide(currentSlide);
                        stopSlider();
                        startSlider();
                    });
                }
            });
        }

        // Pause on hover
        const testimonialsSection = document.querySelector('.testimonials');
        if (testimonialsSection && typeof testimonialsSection.addEventListener === 'function') {
            testimonialsSection.addEventListener('mouseenter', stopSlider);
            testimonialsSection.addEventListener('mouseleave', startSlider);
        }

        // Start the slider
        startSlider();
    } catch (error) {
        // Silently fail if testimonials slider can't initialize (e.g., on shop page)
        console.debug('Testimonials slider not available on this page:', error);
        }
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSlider);
    } else {
        // DOM already loaded, initialize immediately
        initSlider();
    }
})();

// Accordion functionality
document.addEventListener('DOMContentLoaded', function() {
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all items
            accordionItems.forEach(accItem => {
                accItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
});

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('#main-nav');
    const navOverlay = document.querySelector('#nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const body = document.body;

    function closeMenu() {
        menuToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('active');
        if (navOverlay) navOverlay.classList.remove('active');
        body.classList.remove('menu-open');
    }

    function openMenu() {
        menuToggle.setAttribute('aria-expanded', 'true');
        nav.classList.add('active');
        if (navOverlay) navOverlay.classList.add('active');
        body.classList.add('menu-open');
    }

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close menu when clicking on overlay
        if (navOverlay) {
            navOverlay.addEventListener('click', closeMenu);
        }

        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('active')) {
                closeMenu();
            }
        });
    }
});

// Floating CTA Button - Show after scrolling past hero
document.addEventListener('DOMContentLoaded', function() {
    const floatingCta = document.getElementById('floatingCta');
    const hero = document.querySelector('.hero');
    
    if (!floatingCta || !hero) return;
    
    // Cache hero dimensions to avoid forced reflows
    let heroBottom = null;
    function cacheHeroDimensions() {
        if (heroBottom === null) {
            heroBottom = hero.offsetTop + hero.offsetHeight;
        }
    }
    
    // Cache on load and resize
    cacheHeroDimensions();
    window.addEventListener('resize', () => {
        heroBottom = null;
        cacheHeroDimensions();
    }, { passive: true });
    
    let ticking = false;
    function handleScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                cacheHeroDimensions();
                // Show floating CTA after scrolling past hero
                if (window.scrollY > heroBottom - 200) {
                    floatingCta.classList.add('visible');
                } else {
                    floatingCta.classList.remove('visible');
                }
                ticking = false;
            });
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on page load
});

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Scroll Progress Indicator
document.addEventListener('DOMContentLoaded', function() {
    const scrollProgress = document.getElementById('scrollProgress');
    if (!scrollProgress) return;
    
    let scrollTicking = false;
    function updateScrollProgress() {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const scrolled = (window.scrollY / windowHeight) * 100;
                scrollProgress.style.width = scrolled + '%';
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }
    
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
});


// Intersection Observer for Scroll Reveal Animations
// Initialize immediately (works even if script loads async late)
(function initScrollReveal() {
    function initAnimations() {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            // If reduced motion, just show everything immediately
            document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .section-title').forEach(el => {
                el.classList.add('animate-in');
            });
            return;
        }
        
        // Function to check if element is partially visible
        // Cached to avoid forced reflows
        let cachedWindowHeight = null;
        function getWindowHeight() {
            if (cachedWindowHeight === null) {
                cachedWindowHeight = window.innerHeight || document.documentElement.clientHeight;
            }
            return cachedWindowHeight;
        }
        
        function isPartiallyVisible(element) {
            const rect = element.getBoundingClientRect();
            const windowHeight = getWindowHeight();
            return rect.top < windowHeight && rect.bottom > 0;
        }
        
        // Update cached window height on resize
        window.addEventListener('resize', () => {
            cachedWindowHeight = null;
        }, { passive: true });
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Get all elements that need animation
        const animatedElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .section-title');
        
        if (animatedElements.length === 0) {
            return;
        }
        
        // Check elements that are already in viewport on load
        animatedElements.forEach((el) => {
            if (isPartiallyVisible(el)) {
                // Add a small delay for elements already visible to allow CSS to apply
                setTimeout(() => {
                    el.classList.add('animate-in');
                }, 100);
            } else {
                // Observe elements not yet visible
                observer.observe(el);
            }
        });
        
        // Also observe on scroll for elements that come into view
        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    animatedElements.forEach((el) => {
                        if (!el.classList.contains('animate-in') && isPartiallyVisible(el)) {
                            el.classList.add('animate-in');
                            observer.unobserve(el);
                        }
                    });
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        // DOM already loaded, initialize immediately
        initAnimations();
    }
})();

// Count-up Animation for Trust Indicators - Deferred for performance
(function initCountUp() {
    function initCountUpAnimation() {
        // Delay count-up initialization
        setTimeout(function() {
        const trustNumbers = document.querySelectorAll('.trust-number[data-count]');
        
        const countUpObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    const target = parseInt(entry.target.getAttribute('data-count'));
                    const suffix = entry.target.getAttribute('data-suffix') || '';
                    const duration = 2000; // 2 seconds
                    const steps = 60;
                    const increment = target / steps;
                    let current = 0;
                    
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            entry.target.textContent = target + suffix;
                            clearInterval(timer);
                        } else {
                            entry.target.textContent = Math.floor(current) + suffix;
                        }
                    }, duration / steps);
                    
                    countUpObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
            trustNumbers.forEach(num => {
                countUpObserver.observe(num);
            });
        }, 400);
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCountUpAnimation);
    } else {
        // DOM already loaded, initialize immediately
        initCountUpAnimation();
    }
})();

// Parallax Effect for Hero Video - Deferred for performance
// Use DOMContentLoaded or immediate execution depending on script load timing
(function() {
    // Load hero video after initial render to improve LCP
    // Only load video after page is interactive
    function loadHeroVideo() {
        const heroVideo = document.getElementById('heroVideo');
        if (!heroVideo) return;
        
        // On mobile, ensure we only load the preview video
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // Remove desktop source on mobile to prevent loading 10MB file
            const desktopSource = document.getElementById('heroVideoSourceDesktop');
            if (desktopSource) {
                desktopSource.remove();
            }
        }
        
        // Load video after a delay to prioritize LCP
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                heroVideo.load();
                heroVideo.addEventListener('loadeddata', () => {
                    heroVideo.classList.add('ready');
                }, { once: true });
            }, { timeout: 3000 });
        } else {
            setTimeout(() => {
                heroVideo.load();
                heroVideo.addEventListener('loadeddata', () => {
                    heroVideo.classList.add('ready');
                }, { once: true });
            }, 2000);
        }
    }
    
    // Start loading video after DOM is ready or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeroVideo);
    } else {
        // DOM already loaded, wait a bit for LCP
        setTimeout(loadHeroVideo, 1000);
    }
    
    // Delay parallax initialization
    setTimeout(function() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;
        
        // Cache hero height to avoid forced reflows
        let cachedHeroHeight = null;
        function getHeroHeight() {
            if (cachedHeroHeight === null) {
                cachedHeroHeight = hero.offsetHeight;
            }
            return cachedHeroHeight;
        }
        
        window.addEventListener('resize', () => {
            cachedHeroHeight = null;
        }, { passive: true });
        
        let parallaxTicking = false;
        function updateParallax() {
            if (!parallaxTicking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    const heroHeight = getHeroHeight();
                    
                    if (scrollY < heroHeight) {
                        const offset = scrollY * 0.3; // Parallax speed
                        hero.style.setProperty('--scroll-offset', offset);
                        hero.classList.add('parallax-active');
                    } else {
                        hero.classList.remove('parallax-active');
                    }
                    parallaxTicking = false;
                });
                parallaxTicking = true;
            }
        }
        
        window.addEventListener('scroll', function() {
            updateParallax();
        }, { passive: true });
    }, 500);
})();

// Typewriter Effect for Hero Tagline
// Disabled on mobile to improve LCP performance
// Wrapped in IIFE to prevent blocking if script loads early
(function() {
    function initTypewriter() {
        const heroTagline = document.querySelector('.hero-tagline');
        if (!heroTagline) return;
        
        // Tagline is already visible via critical CSS, just add typewriter effect on desktop
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Disable typewriter on mobile devices (improves LCP significantly)
        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (prefersReducedMotion || isMobile) {
            // On mobile or reduced motion, text is already visible via CSS
            // No JavaScript manipulation needed
            return;
        }
    
        // Desktop: Get text and clear it for typewriter effect
        const text = heroTagline.textContent.trim();
        if (!text) return;
        
        heroTagline.textContent = '';
        heroTagline.style.opacity = '1';
        heroTagline.style.whiteSpace = 'nowrap';
        heroTagline.style.overflow = 'hidden';
        heroTagline.classList.add('typewriter');
        
        let index = 0;
        const speed = 50; // milliseconds per character
        
        function typeWriter() {
            if (index < text.length) {
                heroTagline.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, speed);
            } else {
                // Keep cursor visible (don't remove it)
                // The cursor will blink via CSS animation
            }
        }
        
        // Start typing after a short delay
        setTimeout(typeWriter, 500);
    }
    
    // Initialize typewriter when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTypewriter);
    } else {
        // DOM already loaded, defer slightly to ensure LCP
        setTimeout(initTypewriter, 100);
    }
})();

