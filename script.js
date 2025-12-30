// Optimized animations and responsive touch handlers
(function() {
  'use strict';

  // Configuration
  const config = {
    animation: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      useGPU: true
    },
    touch: {
      threshold: 10,
      maxVelocity: 10,
      damping: 0.95
    },
    responsive: {
      breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024
      }
    }
  };

  // Utility functions
  const utils = {
    /**
     * Detect if device supports touch
     */
    isTouchDevice() {
      return (('ontouchstart' in window) ||
              (navigator.maxTouchPoints > 0) ||
              (navigator.msMaxTouchPoints > 0));
    },

    /**
     * Get current viewport width
     */
    getViewportWidth() {
      return Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
      );
    },

    /**
     * Get breakpoint based on viewport width
     */
    getBreakpoint() {
      const width = utils.getViewportWidth();
      if (width < config.responsive.breakpoints.mobile) return 'small';
      if (width < config.responsive.breakpoints.tablet) return 'mobile';
      if (width < config.responsive.breakpoints.desktop) return 'tablet';
      return 'desktop';
    },

    /**
     * Safely request animation frame with fallback
     */
    requestFrame(callback) {
      return requestAnimationFrame(callback);
    },

    /**
     * Cancel animation frame
     */
    cancelFrame(id) {
      cancelAnimationFrame(id);
    },

    /**
     * Debounce function
     */
    debounce(func, delay) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, delay);
      };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  };

  // Animation controller with GPU acceleration
  class AnimationController {
    constructor(element, options = {}) {
      this.element = element;
      this.options = { ...config.animation, ...options };
      this.animationFrame = null;
      this.startTime = null;
      this.duration = this.options.duration;

      if (this.options.useGPU) {
        this.enableGPUAcceleration();
      }
    }

    /**
     * Enable GPU acceleration using transform3d
     */
    enableGPUAcceleration() {
      this.element.style.willChange = 'transform';
      this.element.style.transform = 'translate3d(0, 0, 0)';
    }

    /**
     * Animate element with easing
     */
    animate(from, to, onUpdate, onComplete) {
      if (this.animationFrame) {
        utils.cancelFrame(this.animationFrame);
      }

      this.startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // Easing function
        const easeProgress = this.getEasedProgress(progress);
        const current = from + (to - from) * easeProgress;

        onUpdate(current, progress);

        if (progress < 1) {
          this.animationFrame = utils.requestFrame(animate);
        } else {
          onUpdate(to, 1);
          onComplete && onComplete();
          this.cleanup();
        }
      };

      this.animationFrame = utils.requestFrame(animate);
    }

    /**
     * Cubic-bezier easing function
     */
    getEasedProgress(t) {
      // cubic-bezier(0.4, 0, 0.2, 1)
      const p1x = 0.4, p1y = 0, p2x = 0.2, p2y = 1;
      return this.bezier(t, p1x, p1y, p2x, p2y);
    }

    /**
     * Cubic Bezier curve calculation
     */
    bezier(t, p1x, p1y, p2x, p2y) {
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const t2 = t * t;
      const t3 = t2 * t;

      const y = mt3 * 0 + 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3 * 1;
      return y;
    }

    /**
     * Cleanup animation resources
     */
    cleanup() {
      if (this.animationFrame) {
        utils.cancelFrame(this.animationFrame);
        this.animationFrame = null;
      }
      this.element.style.willChange = 'auto';
    }

    /**
     * Animate property with CSS transitions
     */
    animateProperty(property, from, to, onComplete) {
      this.animate(from, to, (value) => {
        this.element.style[property] = value;
      }, onComplete);
    }

    /**
     * Fade in animation
     */
    fadeIn(duration = this.duration) {
      this.duration = duration;
      this.element.style.opacity = '0';
      return new Promise((resolve) => {
        this.animate(0, 1, (value) => {
          this.element.style.opacity = value;
        }, resolve);
      });
    }

    /**
     * Fade out animation
     */
    fadeOut(duration = this.duration) {
      this.duration = duration;
      return new Promise((resolve) => {
        this.animate(1, 0, (value) => {
          this.element.style.opacity = value;
        }, resolve);
      });
    }

    /**
     * Slide animation
     */
    slide(direction = 'left', distance = 100) {
      const translateValue = direction === 'left' ? -distance : distance;
      this.element.style.transform = `translate3d(${translateValue}px, 0, 0)`;
      return new Promise((resolve) => {
        this.animate(translateValue, 0, (value) => {
          this.element.style.transform = `translate3d(${value}px, 0, 0)`;
        }, resolve);
      });
    }
  }

  // Touch handler controller
  class TouchHandler {
    constructor(element, options = {}) {
      this.element = element;
      this.options = { ...config.touch, ...options };
      this.touchStart = { x: 0, y: 0, time: 0 };
      this.touchCurrent = { x: 0, y: 0 };
      this.isDragging = false;
      this.velocity = { x: 0, y: 0 };
      this.callbacks = {};

      this.setupListeners();
    }

    /**
     * Setup touch event listeners
     */
    setupListeners() {
      const passiveOption = { passive: true };

      this.element.addEventListener('touchstart', (e) => this.onTouchStart(e), passiveOption);
      this.element.addEventListener('touchmove', (e) => this.onTouchMove(e), passiveOption);
      this.element.addEventListener('touchend', (e) => this.onTouchEnd(e), passiveOption);

      // Mouse equivalents for desktop testing
      this.element.addEventListener('mousedown', (e) => this.onMouseDown(e), passiveOption);
      this.element.addEventListener('mousemove', (e) => this.onMouseMove(e), passiveOption);
      this.element.addEventListener('mouseup', (e) => this.onMouseUp(e), passiveOption);
    }

    /**
     * Handle touch start
     */
    onTouchStart(e) {
      const touch = e.touches[0];
      this.touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now()
      };
      this.touchCurrent = { ...this.touchStart };
      this.isDragging = false;

      this.trigger('touchstart', { x: this.touchStart.x, y: this.touchStart.y });
    }

    /**
     * Handle touch move
     */
    onTouchMove(e) {
      if (e.touches.length === 0) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - this.touchStart.x;
      const deltaY = touch.clientY - this.touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > this.options.threshold) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
        
        // Calculate velocity
        const timeDelta = performance.now() - this.touchStart.time;
        if (timeDelta > 0) {
          this.velocity.x = deltaX / timeDelta;
          this.velocity.y = deltaY / timeDelta;
        }

        this.trigger('touchmove', {
          x: touch.clientX,
          y: touch.clientY,
          deltaX,
          deltaY,
          distance
        });
      }
    }

    /**
     * Handle touch end
     */
    onTouchEnd(e) {
      if (!this.isDragging) {
        this.trigger('tap', { x: this.touchStart.x, y: this.touchStart.y });
      } else {
        this.trigger('swipe', {
          x: this.touchCurrent.x,
          y: this.touchCurrent.y,
          velocityX: Math.min(this.velocity.x, this.options.maxVelocity),
          velocityY: Math.min(this.velocity.y, this.options.maxVelocity)
        });
      }

      this.isDragging = false;
      this.velocity = { x: 0, y: 0 };
      this.trigger('touchend', {});
    }

    /**
     * Mouse event handlers for desktop
     */
    onMouseDown(e) {
      this.onTouchStart({ touches: [{ clientX: e.clientX, clientY: e.clientY }] });
    }

    onMouseMove(e) {
      if (!this.isDragging) return;
      this.onTouchMove({ touches: [{ clientX: e.clientX, clientY: e.clientY }] });
    }

    onMouseUp(e) {
      this.onTouchEnd({});
    }

    /**
     * Register callback for touch event
     */
    on(event, callback) {
      if (!this.callbacks[event]) {
        this.callbacks[event] = [];
      }
      this.callbacks[event].push(callback);
      return this;
    }

    /**
     * Trigger callback for touch event
     */
    trigger(event, data) {
      if (this.callbacks[event]) {
        this.callbacks[event].forEach(callback => callback(data));
      }
    }

    /**
     * Destroy touch handler
     */
    destroy() {
      this.element.removeEventListener('touchstart', (e) => this.onTouchStart(e));
      this.element.removeEventListener('touchmove', (e) => this.onTouchMove(e));
      this.element.removeEventListener('touchend', (e) => this.onTouchEnd(e));
      this.callbacks = {};
    }
  }

  // Responsive handler
  class ResponsiveHandler {
    constructor(callbacks = {}) {
      this.callbacks = callbacks;
      this.currentBreakpoint = utils.getBreakpoint();
      this.setupListener();
    }

    /**
     * Setup resize listener with debounce
     */
    setupListener() {
      const debouncedResize = utils.debounce(() => {
        const newBreakpoint = utils.getBreakpoint();
        if (newBreakpoint !== this.currentBreakpoint) {
          this.currentBreakpoint = newBreakpoint;
          this.trigger('change', { breakpoint: newBreakpoint });
        }
      }, 250);

      window.addEventListener('resize', debouncedResize);
    }

    /**
     * Trigger callback
     */
    trigger(event, data) {
      if (this.callbacks[event]) {
        this.callbacks[event](data);
      }
    }

    /**
     * Get current breakpoint
     */
    getBreakpoint() {
      return this.currentBreakpoint;
    }
  }

  // Public API
  window.AnimationAPI = {
    utils,
    AnimationController,
    TouchHandler,
    ResponsiveHandler,
    config,

    /**
     * Initialize animation on element
     */
    createAnimation(selector) {
      const element = document.querySelector(selector);
      if (!element) return null;
      return new AnimationController(element);
    },

    /**
     * Initialize touch handler on element
     */
    createTouchHandler(selector, callbacks = {}) {
      const element = document.querySelector(selector);
      if (!element) return null;
      const handler = new TouchHandler(element);
      
      Object.keys(callbacks).forEach(event => {
        handler.on(event, callbacks[event]);
      });

      return handler;
    },

    /**
     * Initialize responsive handler
     */
    createResponsiveHandler(callbacks = {}) {
      return new ResponsiveHandler(callbacks);
    },

    /**
     * Batch animate multiple elements
     */
    animateBatch(selector, animationFn) {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map(element => {
        const controller = new AnimationController(element);
        return animationFn(controller);
      });
    }
  };

  // Auto-initialize data-animation elements
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-animation]').forEach(element => {
      const animation = element.getAttribute('data-animation');
      const controller = new AnimationController(element);

      if (animation === 'fade-in') {
        controller.fadeIn();
      } else if (animation === 'slide-in') {
        controller.slide('left', 100);
      }
    });

    // Auto-initialize touch handlers
    document.querySelectorAll('[data-touch]').forEach(element => {
      new TouchHandler(element);
    });
  });

  console.log('AnimationAPI loaded successfully');
})();
