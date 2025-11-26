// Testimonials Slider
// Set a flag to prove script executed
window.testScriptLoaded = true;
console.log('script.js file loaded and executing - line 2');
console.log('Current time:', new Date().toISOString());
console.log('Window object:', typeof window);
console.log('Document object:', typeof document);

// Immediate test - should run right away
(function() {
    console.log('IIFE executing immediately');
    alert('Script.js is executing!');
})();

document.addEventListener('DOMContentLoaded', function() {
    console.log('Testimonials slider DOMContentLoaded fired');
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
});

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
    
    function handleScroll() {
        const heroBottom = hero.offsetTop + hero.offsetHeight;
        const scrollPosition = window.scrollY + window.innerHeight;
        
        // Show floating CTA after scrolling past hero
        if (window.scrollY > heroBottom - 200) {
            floatingCta.classList.add('visible');
        } else {
            floatingCta.classList.remove('visible');
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
    
    function updateScrollProgress() {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrollProgress.style.width = scrolled + '%';
    }
    
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
});


// Intersection Observer for Scroll Reveal Animations
console.log('Scroll animations code reached');
document.addEventListener('DOMContentLoaded', function() {
    console.log('Scroll animations DOMContentLoaded fired');
    
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        console.log('Reduced motion detected - showing all elements');
        // If reduced motion, just show everything immediately
        document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .section-title').forEach(el => {
            el.classList.add('animate-in');
        });
        return;
    }
    
    // Function to check if element is partially visible
    function isPartiallyVisible(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        return rect.top < windowHeight && rect.bottom > 0;
    }
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log('Element intersecting:', entry.target);
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Get all elements that need animation
    const animatedElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .section-title');
    
    console.log('Found', animatedElements.length, 'elements to animate');
    
    if (animatedElements.length === 0) {
        console.warn('No animated elements found - check HTML classes');
        return;
    }
    
    // Check elements that are already in viewport on load
    animatedElements.forEach((el, index) => {
        console.log(`Element ${index}:`, el.className, 'visible:', isPartiallyVisible(el));
        if (isPartiallyVisible(el)) {
            // Add a small delay for elements already visible to allow CSS to apply
            setTimeout(() => {
                el.classList.add('animate-in');
                console.log(`Animated element ${index} (already visible)`);
            }, 100);
        } else {
            // Observe elements not yet visible
            observer.observe(el);
            console.log(`Observing element ${index}`);
        }
    });
    
    // Also observe on scroll for elements that come into view
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                animatedElements.forEach((el, index) => {
                    if (!el.classList.contains('animate-in') && isPartiallyVisible(el)) {
                        el.classList.add('animate-in');
                        observer.unobserve(el);
                        console.log(`Animated element ${index} on scroll`);
                    }
                });
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
});

// Count-up Animation for Trust Indicators - Deferred for performance
document.addEventListener('DOMContentLoaded', function() {
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
});

// Parallax Effect for Hero Video - Deferred for performance
document.addEventListener('DOMContentLoaded', function() {
    // Delay parallax initialization
    setTimeout(function() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;
        
        let ticking = false;
        
        function updateParallax() {
            const scrollY = window.scrollY;
            const heroHeight = hero.offsetHeight;
            
            if (scrollY < heroHeight) {
                const offset = scrollY * 0.3; // Parallax speed
                hero.style.setProperty('--scroll-offset', offset);
                hero.classList.add('parallax-active');
            }
            
            ticking = false;
        }
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    }, 500);
});

// Optimize video loading - start loading video after page is interactive
document.addEventListener('DOMContentLoaded', function() {
    const heroVideo = document.querySelector('.hero video');
    if (!heroVideo) return;
    
    // Change preload to 'auto' after a short delay to start loading video
    // This allows the page to render first, then load the video
    setTimeout(function() {
        if (heroVideo.readyState === 0) { // HAVE_NOTHING
            heroVideo.preload = 'auto';
            // Trigger video load
            heroVideo.load();
        }
    }, 1000);
    
    // Show video when it can play (even partially loaded)
    heroVideo.addEventListener('canplay', function() {
        heroVideo.classList.add('ready');
    }, { once: true });
    
    // Also show on loadeddata (first frame loaded)
    heroVideo.addEventListener('loadeddata', function() {
        heroVideo.classList.add('ready');
    }, { once: true });
    
    // Fallback: show video after 2 seconds even if not ready
    setTimeout(function() {
        heroVideo.classList.add('ready');
    }, 2000);
});

// Typewriter Effect for Hero Tagline
console.log('Typewriter effect code reached');
document.addEventListener('DOMContentLoaded', function() {
    console.log('Typewriter DOMContentLoaded fired');
    const heroTagline = document.querySelector('.hero-tagline');
    
    if (!heroTagline) {
        console.error('Hero tagline not found!');
        return;
    }
    
    console.log('Hero tagline found:', heroTagline);
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        console.log('Reduced motion - showing tagline immediately');
        heroTagline.style.opacity = '1';
        return;
    }
    
    // Get text and clear it
    const text = heroTagline.textContent.trim();
    console.log('Tagline text:', text);
    
    if (!text) {
        console.error('Hero tagline has no text!');
        return;
    }
    
    heroTagline.textContent = '';
    heroTagline.style.opacity = '1';
    heroTagline.style.borderRight = '2px solid rgba(255, 255, 255, 0.8)';
    heroTagline.style.whiteSpace = 'nowrap';
    heroTagline.style.overflow = 'hidden';
    
    let index = 0;
    const speed = 50; // milliseconds per character
    
    function typeWriter() {
        if (index < text.length) {
            heroTagline.textContent += text.charAt(index);
            index++;
            setTimeout(typeWriter, speed);
        } else {
            // Remove cursor after typing is complete
            setTimeout(() => {
                heroTagline.style.borderRight = 'none';
            }, 500);
        }
    }
    
    // Start typing after a short delay
    console.log('Starting typewriter in 500ms');
    setTimeout(typeWriter, 500);
});

