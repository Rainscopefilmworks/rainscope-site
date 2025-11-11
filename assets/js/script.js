// Testimonials Slider
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.testimonial-slide');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function startSlider() {
        slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    function stopSlider() {
        clearInterval(slideInterval);
    }

    // Indicator click handlers
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            stopSlider();
            startSlider();
        });
    });

    // Pause on hover
    const testimonialsSection = document.querySelector('.testimonials');
    testimonialsSection.addEventListener('mouseenter', stopSlider);
    testimonialsSection.addEventListener('mouseleave', startSlider);

    // Start the slider
    startSlider();
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

