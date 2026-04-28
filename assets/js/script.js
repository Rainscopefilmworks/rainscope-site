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

// Multi-step Form
(function() {
    function initMultiStepForm(form) {
        const steps = Array.from(form.querySelectorAll('.form-step'));
        if (!steps.length) return;

        const progressSteps = Array.from(form.querySelectorAll('.form-progress-step'));
        const nextButton = form.querySelector('.form-next');
        const backButton = form.querySelector('.form-back');
        const submitButton = form.querySelector('.form-submit');
        const statusEl = form.querySelector('.form-status');
        let currentStepIndex = 0;

        function setStep(index) {
            steps.forEach((step, stepIndex) => {
                const isActive = stepIndex === index;
                step.classList.toggle('is-active', isActive);
                step.toggleAttribute('hidden', !isActive);
            });

            progressSteps.forEach((step, stepIndex) => {
                const isActive = stepIndex === index;
                step.classList.toggle('is-active', isActive);
                if (isActive) {
                    step.setAttribute('aria-current', 'step');
                } else {
                    step.removeAttribute('aria-current');
                }
            });

            if (backButton) {
                backButton.hidden = index === 0;
                backButton.disabled = index === 0;
            }
            if (nextButton) {
                nextButton.hidden = index >= steps.length - 1;
            }
            if (submitButton) {
                submitButton.hidden = index < steps.length - 1;
            }
        }

        function validateGroupInputs(step) {
            let isValid = true;
            const groupInputs = step.querySelectorAll('[data-required-group]');
            if (!groupInputs.length) return isValid;

            const groupedInputs = {};
            groupInputs.forEach((input) => {
                const key = input.dataset.requiredGroup;
                if (!groupedInputs[key]) groupedInputs[key] = [];
                groupedInputs[key].push(input);
            });

            Object.keys(groupedInputs).forEach((groupName) => {
                const inputs = groupedInputs[groupName];
                const hasSelection = inputs.some((input) => input.checked);
                const errorEl = step.querySelector(`[data-group-error="${groupName}"]`);
                if (!hasSelection) {
                    isValid = false;
                    if (errorEl) {
                        errorEl.textContent = 'Select at least one option.';
                    }
                } else if (errorEl) {
                    errorEl.textContent = '';
                }
            });

            return isValid;
        }

        function validateStep(index) {
            const step = steps[index];
            let isValid = true;

            if (!validateGroupInputs(step)) {
                isValid = false;
            }

            const fields = step.querySelectorAll('input, textarea, select');
            fields.forEach((field) => {
                if (field.dataset.requiredGroup) return;
                if (!field.checkValidity()) {
                    isValid = false;
                    field.reportValidity();
                }
            });

            return isValid;
        }

        function findFirstInvalidStep() {
            for (let index = 0; index < steps.length; index++) {
                const step = steps[index];
                const groupValid = validateGroupInputs(step);
                const fields = step.querySelectorAll('input, textarea, select');
                let fieldValid = true;
                fields.forEach((field) => {
                    if (field.dataset.requiredGroup) return;
                    if (!field.checkValidity()) {
                        fieldValid = false;
                    }
                });
                if (!groupValid || !fieldValid) {
                    return index;
                }
            }
            return -1;
        }

        function setStatus(message, isError) {
            if (!statusEl) return;
            statusEl.textContent = message;
            statusEl.classList.remove('is-error', 'is-success');
            if (message) {
                statusEl.classList.add(isError ? 'is-error' : 'is-success');
            }
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (!validateStep(currentStepIndex)) return;
                currentStepIndex = Math.min(currentStepIndex + 1, steps.length - 1);
                setStep(currentStepIndex);
            });
        }

        if (backButton) {
            backButton.addEventListener('click', () => {
                currentStepIndex = Math.max(currentStepIndex - 1, 0);
                setStep(currentStepIndex);
            });
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            setStatus('', false);

            const firstInvalid = findFirstInvalidStep();
            if (firstInvalid !== -1) {
                setStep(firstInvalid);
                validateStep(firstInvalid);
                return;
            }

            const endpoint = form.dataset.endpoint;
            if (!endpoint || endpoint === 'YOUR_APPS_SCRIPT_URL') {
                setStatus('Form endpoint is not configured yet.', true);
                return;
            }

            const formData = new FormData(form);
            function pad2(value) {
                return String(value).padStart(2, '0');
            }

            function formatTimestamp(date) {
                const year = date.getFullYear();
                const month = pad2(date.getMonth() + 1);
                const day = pad2(date.getDate());
                const hours = pad2(date.getHours());
                const minutes = pad2(date.getMinutes());
                return `${year}-${month}-${day} ${hours}:${minutes}`;
            }

            formData.append('source', window.location.pathname || 'unknown');
            formData.append('submitted_at', formatTimestamp(new Date()));

            if (submitButton) submitButton.disabled = true;
            if (nextButton) nextButton.disabled = true;
            if (backButton) backButton.disabled = true;
            setStatus('Sending...', false);

            try {
                await fetch(endpoint, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData,
                });

                form.reset();
                currentStepIndex = 0;
                setStep(currentStepIndex);
                setStatus('Thanks. We received your inquiry and usually reply within one business day.', false);
                if (typeof window.rainscopeTrack === 'function') {
                    window.rainscopeTrack('generate_lead', {
                        form_name: form.closest('#lead-form') ? 'homepage_lead_form' : 'contact_form',
                        page_path: window.location.pathname,
                    });
                }
            } catch (error) {
                setStatus('Something went wrong. Please try again.', true);
            } finally {
                if (submitButton) submitButton.disabled = false;
                if (nextButton) nextButton.disabled = false;
                if (backButton) backButton.disabled = false;
            }
        });

        setStep(currentStepIndex);
    }

    function initForms() {
        document.querySelectorAll('.multi-step-form').forEach(initMultiStepForm);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initForms);
    } else {
        initForms();
    }
})();

// Accordion functionality
// Initialize immediately (works even if script loads async late)
(function initAccordion() {
    function initAccordionFunctionality() {
        const accordionItems = document.querySelectorAll('.accordion-item');
        
        if (!accordionItems || accordionItems.length === 0) {
            return; // Exit if no accordion items on this page
        }

        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            
            if (!header) return;
            
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
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccordionFunctionality);
    } else {
        // DOM already loaded, initialize immediately
        initAccordionFunctionality();
    }
})();

// Mobile Menu Toggle
// Initialize immediately (works even if script loads async late)
(function initMobileMenu() {
    function initMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('#main-nav');
        const navOverlay = document.querySelector('#nav-overlay');
        const navLinks = document.querySelectorAll('.nav-link');
        const body = document.body;

        function closeMenu() {
            if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            if (nav) nav.classList.remove('active');
            if (navOverlay) navOverlay.classList.remove('active');
            if (body) body.classList.remove('menu-open');
        }

        function openMenu() {
            if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
            if (nav) nav.classList.add('active');
            if (navOverlay) navOverlay.classList.add('active');
            if (body) body.classList.add('menu-open');
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
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMenu);
    } else {
        // DOM already loaded, initialize immediately
        initMenu();
    }
})();

// Floating CTA Button - Show after scrolling past hero
(function initFloatingCta() {
    function setupFloatingCta() {
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
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFloatingCta);
    } else {
        setupFloatingCta();
    }
})();

// Defer non-hero homepage preview videos until they approach the viewport
(function initDeferredVideos() {
    function setupDeferredVideos() {
        const videos = document.querySelectorAll('video[data-deferred-video]');
        if (!videos.length) return;

        function loadVideo(video) {
            if (video.dataset.videoLoaded === 'true') return;
            const source = video.querySelector('source[data-src]');
            if (!source) return;
            source.src = source.dataset.src;
            source.removeAttribute('data-src');
            video.load();
            video.dataset.videoLoaded = 'true';
        }

        async function playVideo(video) {
            loadVideo(video);
            if (video.dataset.videoPlaying === 'true') return;
            try {
                await video.play();
                video.dataset.videoPlaying = 'true';
            } catch (error) {
                video.dataset.videoPlaying = 'false';
            }
        }

        function pauseVideo(video) {
            video.pause();
            video.dataset.videoPlaying = 'false';
        }

        if (!('IntersectionObserver' in window)) {
            videos.forEach((video) => {
                playVideo(video);
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    playVideo(video);
                } else if (video.dataset.videoLoaded === 'true') {
                    pauseVideo(video);
                }
            });
        }, {
            rootMargin: '240px 0px',
            threshold: 0.2
        });

        videos.forEach((video) => observer.observe(video));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDeferredVideos);
    } else {
        setupDeferredVideos();
    }
})();

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
        const trustNumbers = document.querySelectorAll('.trust-number[data-count]');
        if (!trustNumbers.length) return;

        function animateCount(entryTarget) {
            entryTarget.classList.add('counted');
            const target = parseInt(entryTarget.getAttribute('data-count'), 10);
            const suffix = entryTarget.getAttribute('data-suffix') || '';
            const duration = 2000;
            const steps = 60;
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    entryTarget.textContent = target + suffix;
                    clearInterval(timer);
                } else {
                    entryTarget.textContent = Math.floor(current) + suffix;
                }
            }, duration / steps);
        }
        
        const countUpObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    animateCount(entry.target);
                    countUpObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        trustNumbers.forEach(num => {
            const target = parseInt(num.getAttribute('data-count'), 10);
            const suffix = num.getAttribute('data-suffix') || '';
            if (num.textContent.trim() === `${target}${suffix}`) {
                num.classList.add('counted');
                return;
            }
            if (num.getBoundingClientRect().top < window.innerHeight) {
                animateCount(num);
                return;
            }
                countUpObserver.observe(num);
        });
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCountUpAnimation);
    } else {
        // DOM already loaded, initialize immediately
        initCountUpAnimation();
    }
})();

// Hero video loading
(function() {
    function loadHeroVideo() {
        const heroVideo = document.getElementById('heroVideo');
        if (!heroVideo) return;
        
        const isMobile = window.innerWidth <= 768;
        let hasLoadedSource = heroVideo.dataset.loaded === 'true';

        function markLoaded() {
            heroVideo.dataset.loaded = 'true';
            hasLoadedSource = true;
        }

        function ensureLoaded() {
            if (hasLoadedSource) return;
            heroVideo.preload = isMobile ? 'auto' : 'metadata';
            heroVideo.load();
            hasLoadedSource = true;
        }

        function handleReady() {
            markLoaded();
            heroVideo.classList.add('ready');
            heroVideo.play().catch(() => {
                // Silent fail if autoplay is blocked.
            });
        }

        function stopPlayback() {
            heroVideo.pause();
        }

        heroVideo.addEventListener('loadeddata', handleReady, { once: true });
        heroVideo.addEventListener('error', function() {
            // Show poster image as fallback
            if (!heroVideo.parentElement.querySelector('[data-hero-fallback]')) {
                heroVideo.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.style.cssText = 'width: 100%; height: 100%; background: url(https://media.rainscopefilmworks.com/logo.png) center/cover no-repeat; background-color: #173633;';
                fallback.setAttribute('aria-label', 'Rainscope Filmworks');
                fallback.dataset.heroFallback = 'true';
                heroVideo.parentElement.appendChild(fallback);
            }
        }, { once: true });

        if (!('IntersectionObserver' in window)) {
            ensureLoaded();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    ensureLoaded();
                    if (heroVideo.readyState >= 2) {
                        heroVideo.classList.add('ready');
                        heroVideo.play().catch(() => {});
                    }
                } else {
                    stopPlayback();
                }
            });
        }, {
            threshold: 0.35
        });

        observer.observe(heroVideo);
    }
    
    // Start loading video after DOM is ready or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeroVideo);
    } else {
        loadHeroVideo();
    }
})();
