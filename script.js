/**
 * MMM Transport Moving - Main JavaScript
 * Professional moving services website
 */

'use strict';

// ===================================
// STATE MANAGEMENT
// ===================================
const state = {
  scrollUnlocked: false,
  currentLightboxIndex: 0,
  isBookingOpen: false,
  isMobileMenuOpen: false
};

// ===================================
// UTILITY FUNCTIONS
// ===================================
const utils = {
  /**
   * Debounce function to limit function calls
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Smooth scroll to element
   */
  smoothScrollTo(element) {
    if (!element) return;
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

// ===================================
// SCROLL LOCK MANAGEMENT
// ===================================
const scrollManager = {
  scrollPosition: 0,
  
  unlock() {
    if (!state.scrollUnlocked) {
      document.body.classList.remove('locked');
      state.scrollUnlocked = true;
    }
  },

  lock() {
    // Save current scroll position
    this.scrollPosition = window.pageYOffset;
    document.body.classList.add('locked');
    document.body.style.top = `-${this.scrollPosition}px`;
    state.scrollUnlocked = false;
  },
  
  restore() {
    document.body.classList.remove('locked');
    document.body.style.top = '';
    window.scrollTo(0, this.scrollPosition);
    state.scrollUnlocked = true;
  }
};

// ===================================
// MOBILE MENU
// ===================================
const mobileMenu = {
  init() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!toggle || !menu) return;

    // Toggle menu
    toggle.addEventListener('click', () => {
      this.toggle(toggle, menu);
    });

    // Close menu when clicking nav links
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (state.isMobileMenuOpen) {
          this.close(toggle, menu);
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (state.isMobileMenuOpen && 
          !menu.contains(e.target) && 
          !toggle.contains(e.target)) {
        this.close(toggle, menu);
      }
    });
  },

  toggle(toggle, menu) {
    state.isMobileMenuOpen = !state.isMobileMenuOpen;
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    toggle.setAttribute('aria-expanded', state.isMobileMenuOpen);
  },

  close(toggle, menu) {
    state.isMobileMenuOpen = false;
    toggle.classList.remove('active');
    menu.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
  }
};

// ===================================
// NAVIGATION
// ===================================
const navigation = {
  init() {
    // Explore button
    const exploreBtn = document.getElementById('exploreBtn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        scrollManager.unlock();
        const aboutSection = document.getElementById('about');
        utils.smoothScrollTo(aboutSection);
      });
    }

    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Only prevent default and smooth scroll for internal anchor links (starting with #)
        if (href && href.startsWith('#')) {
          e.preventDefault();
          scrollManager.unlock();
          const targetElement = document.querySelector(href);
          if (targetElement) {
            utils.smoothScrollTo(targetElement);
          }
        }
        // External links (like blog.html) will work normally without preventDefault
      });
    });

    // Active link highlighting
    this.setupActiveLinks();
  },

  setupActiveLinks() {
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-link');

    const updateActiveLink = () => {
      let currentSection = '';

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 100) {
          currentSection = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
          link.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', utils.debounce(updateActiveLink, 100));
  }
};

// ===================================
// BLOG NAVIGATION
// ===================================
const blogNavigation = {
  init() {
    const backToHomeBtn = document.getElementById('backToHome');
    if (!backToHomeBtn) return;

    // Navigate back to home page
    backToHomeBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
};

// ===================================
// GALLERY SYSTEM
// ===================================
const gallery = {
  thumbnails: [],
  lightbox: null,
  lightboxImg: null,
  caption: null,

  init() {
    this.lightbox = document.getElementById('galleryLightbox');
    this.lightboxImg = document.getElementById('lightboxImg');
    this.caption = document.getElementById('caption');
    this.thumbnails = Array.from(document.querySelectorAll('.thumb'));

    const openBtn = document.getElementById('openGallery');
    const thumbnailsContainer = document.getElementById('thumbnails');
    const closeBtn = document.querySelector('.close');
    const prevBtn = document.querySelector('.lightbox-nav.prev');
    const nextBtn = document.querySelector('.lightbox-nav.next');

    if (!openBtn || !thumbnailsContainer) return;

    // Toggle thumbnails visibility
    openBtn.addEventListener('click', () => {
      this.toggleThumbnails(thumbnailsContainer);
    });

    // Setup thumbnail clicks
    this.thumbnails.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        state.currentLightboxIndex = index;
        this.openLightbox();
      });
    });

    // Close lightbox
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeLightbox());
    }

    // Navigation buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevImage());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextImage());
    }

    // Click outside to close
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) {
        this.closeLightbox();
      }
    });

    // Keyboard navigation
    this.setupKeyboardNav();

    // Touch swipe navigation
    this.setupSwipeNav();
  },

  toggleThumbnails(container) {
    const isHidden = window.getComputedStyle(container).display === 'none';
    container.style.display = isHidden ? 'grid' : 'none';
  },

  openLightbox() {
    this.lightbox.style.display = 'block';
    this.updateLightboxImage();
    scrollManager.lock();
    
    // Focus management for accessibility
    this.lightbox.focus();
  },

  closeLightbox() {
    this.lightbox.style.display = 'none';
    scrollManager.restore();
  },

  updateLightboxImage() {
    const currentThumb = this.thumbnails[state.currentLightboxIndex];
    if (currentThumb) {
      this.lightboxImg.src = currentThumb.src;
      this.lightboxImg.alt = currentThumb.alt;
      this.caption.textContent = currentThumb.alt;
    }
  },

  nextImage() {
    state.currentLightboxIndex = (state.currentLightboxIndex + 1) % this.thumbnails.length;
    this.updateLightboxImage();
  },

  prevImage() {
    state.currentLightboxIndex = 
      (state.currentLightboxIndex - 1 + this.thumbnails.length) % this.thumbnails.length;
    this.updateLightboxImage();
  },

  setupKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      if (this.lightbox.style.display === 'block') {
        switch(e.key) {
          case 'ArrowRight':
            this.nextImage();
            break;
          case 'ArrowLeft':
            this.prevImage();
            break;
          case 'Escape':
            this.closeLightbox();
            break;
        }
      }
    });
  },

  setupSwipeNav() {
    let startX = 0;
    let endX = 0;
    const swipeThreshold = 50;

    this.lightbox.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    this.lightbox.addEventListener('touchmove', (e) => {
      endX = e.touches[0].clientX;
    }, { passive: true });

    this.lightbox.addEventListener('touchend', () => {
      const swipeDistance = startX - endX;
      
      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          this.nextImage(); // Swipe left
        } else {
          this.prevImage(); // Swipe right
        }
      }
    });
  }
};

// ===================================
// BOOKING SYSTEM
// ===================================
const booking = {
  init() {
    const toggleBtn = document.querySelector('.booking-toggle');
    const bookingBox = document.querySelector('.booking-box');
    const overlay = document.querySelector('.booking-overlay');
    const closeBtn = document.querySelector('.booking-close');
    const form = document.getElementById('bookingForm');

    if (!toggleBtn || !bookingBox) return;

    // Open booking form
    toggleBtn.addEventListener('click', () => {
      this.open(bookingBox, overlay);
    });

    // Close booking form
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close(bookingBox, overlay);
      });
    }

    // Close on overlay click
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.close(bookingBox, overlay);
      });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isBookingOpen) {
        this.close(bookingBox, overlay);
      }
    });

    // Form validation and submission
    if (form) {
      this.setupFormValidation(form);
    }

    // Check for success parameter in URL
    this.checkSuccessMessage();
  },

  open(box, overlay) {
    state.isBookingOpen = true;
    
    // Add active classes
    box.classList.add('active');
    if (overlay) overlay.classList.add('active');
    
    // Lock scroll
    scrollManager.lock();
    
    // Prevent text selection on body when form is open
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    
    // Re-enable text selection inside the form
    box.style.userSelect = 'auto';
    box.style.webkitUserSelect = 'auto';
    
    // Focus first input after animation
    setTimeout(() => {
      const firstInput = box.querySelector('input');
      if (firstInput) {
        firstInput.focus();
      }
    }, 400);
  },

  close(box, overlay) {
    state.isBookingOpen = false;
    
    // Remove active classes
    box.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    
    // Restore scroll
    scrollManager.restore();
    
    // Re-enable text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    
    // Blur any focused input
    if (document.activeElement) {
      document.activeElement.blur();
    }
  },

  setupFormValidation(form) {
    // Set minimum date to today
    const dateInput = form.querySelector('input[type="date"]');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }

    // Phone number formatting
    const phoneInput = form.querySelector('input[type="tel"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        
        if (value.length >= 6) {
          value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
        } else if (value.length >= 3) {
          value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        }
        
        e.target.value = value;
      });
    }

    // Form submission
    form.addEventListener('submit', (e) => {
      if (!form.checkValidity()) {
        e.preventDefault();
        this.showValidationErrors(form);
      }
    });
  },

  showValidationErrors(form) {
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
      if (!input.validity.valid) {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 3000);
      }
    });
  },

  checkSuccessMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === '1') {
      this.showSuccessNotification();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },

  showSuccessNotification() {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>Booking submitted successfully! We'll contact you soon.</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
};

// ===================================
// PERFORMANCE OPTIMIZATIONS
// ===================================
const performance = {
  init() {
    // Lazy load images
    this.lazyLoadImages();
    
    // Optimize animations on scroll
    this.optimizeScrollAnimations();
  },

  lazyLoadImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  },

  optimizeScrollAnimations() {
    // Reduce animations on low-end devices
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.scrollBehavior = 'auto';
    }
  }
};

// ===================================
// INITIALIZATION
// ===================================
const app = {
  init() {
    // Unlock scrolling when page is ready
    window.addEventListener('load', () => {
      scrollManager.unlock();
    });

    // Force page to top on refresh
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // Initialize all modules
    mobileMenu.init();
    navigation.init();
    blogNavigation.init();
    gallery.init();
    booking.init();
    performance.init();

    // Add loaded class for CSS animations
    document.body.classList.add('page-loaded');
  }
};

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// ===================================
// EXPORTS (for potential module usage)
// ===================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { app, utils, scrollManager, gallery, booking };
}