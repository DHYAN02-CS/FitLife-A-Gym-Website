
// ===== CART MANAGEMENT =====
class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.updateCartCount();
    }

    loadCart() {
        try {
            const saved = localStorage.getItem('fitlife_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading cart:', e);
            return [];
        }
    }

    addItem(item) {
        const existingItem = this.cart.find(i => i.id === item.id);
        if (existingItem) {
            return false; // Item already in cart
        }

        this.cart.push({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            originalPrice: parseFloat(item.originalPrice)
        });

        this.saveCart();
        this.updateCartCount();
        return true;
    }

    removeItem(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartCount();
    }

    getCart() {
        return this.cart;
    }

    getTotal() {
        return this.cart.reduce((sum, item) => sum + item.price, 0);
    }

    getOriginalTotal() {
        return this.cart.reduce((sum, item) => sum + item.originalPrice, 0);
    }

    getSavings() {
        return this.getOriginalTotal() - this.getTotal();
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
    }

    saveCart() {
        try {
            localStorage.setItem('fitlife_cart', JSON.stringify(this.cart));
        } catch (e) {
            console.error('Error saving cart:', e);
        }
    }

    updateCartCount() {
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(el => {
            el.textContent = this.cart.length;
            if (this.cart.length > 0) {
                el.style.display = 'flex';
            } else {
                el.style.display = 'none';
            }
        });
    }

    applyDiscount(code, percentage) {
        return percentage;
    }
}

// Format number as Indian Rupees
function formatINR(amount) {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
}

const cartManager = new CartManager();

// Discount State
let discountApplied = false;
let currentDiscount = 0;

function calculateCartTotals() {
    const total = cartManager.getTotal();
    let finalTotal = total;
    let autoDiscount = 0;
    let manualDiscountAmount = 0;


    // Manual Discount
    // Apply on top of auto-discounted price
    if (discountApplied) {
        manualDiscountAmount = (finalTotal * currentDiscount) / 100;
        finalTotal -= manualDiscountAmount;
    }

    return {
        total,
        autoDiscount,
        manualDiscountAmount,
        finalTotal
    };
}


// ===== MOBILE MENU =====
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('show');
        hamburger.classList.toggle('active');
    });

    // Close menu when clicking on a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('show');
            hamburger.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('show');
            hamburger.classList.remove('active');
        }
    });
}

// ===== ADD TO CART FUNCTIONALITY =====
function initializeAddToCart() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
        // Remove any existing listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', (e) => {
            e.preventDefault();

            const item = {
                id: newButton.dataset.id,
                name: newButton.dataset.name,
                price: newButton.dataset.price,
                originalPrice: newButton.dataset.originalPrice
            };

            const added = cartManager.addItem(item);

            if (added) {
                showToast('✓ ' + item.name + ' added to cart!', 'success');

                // Animation effect
                const originalHTML = newButton.innerHTML;
                newButton.innerHTML = '<i class="fas fa-check"></i><span>Added!</span>';
                newButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                setTimeout(() => {
                    newButton.innerHTML = originalHTML;
                    newButton.style.background = '';
                }, 2000);
            } else {
                showToast('⚠ Item already in cart!', 'error');
            }
        });
    });
}

// Initialize on page load
initializeAddToCart();

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;

    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;

    // Remove existing classes
    toast.classList.remove('show', 'success', 'error');

    // Add new classes
    toast.classList.add('show', type);

    setTimeout(() => {
        toast.classList.remove('show', type);
    }, 3000);
}

// ===== CART PAGE FUNCTIONALITY =====
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.querySelector('.cart-summary');
    const cart = cartManager.getCart();

    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'none';
    } else {
        cartItems.style.display = 'flex';
        if (emptyCart) emptyCart.style.display = 'none';
        if (cartSummary) cartSummary.style.display = 'block';


     // Cart changes 
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item fade-in-up">
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <div class="cart-item-price">
                       
                        <span class="price-new">${formatINR(item.price)}</span>
                       

                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        updateCartSummary();

        // Add remove functionality
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemName = cart.find(item => item.id === btn.dataset.id)?.name;
                cartManager.removeItem(btn.dataset.id);
                renderCart();
                showToast('✓ ' + (itemName || 'Item') + ' removed from cart!', 'success');
            });
        });
    }
}

function updateCartSummary() {
    const subtotal = cartManager.getOriginalTotal();
    const savings = cartManager.getSavings();

    // Use centralized calculation
    const totals = calculateCartTotals();

    const subtotalEl = document.getElementById('subtotal');
    const savingsEl = document.getElementById('savings');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);
    if (savingsEl) savingsEl.textContent = `-${formatINR(savings)}`;
    if (totalEl) totalEl.textContent = formatINR(totals.finalTotal);

    // Handle Discount Rows
    const summaryContainer = document.querySelector('.cart-summary');
    const totalRow = document.querySelector('.summary-row.total');

    // Auto Discount Row
    let autoDiscountRow = document.getElementById('autoDiscountRow');
    if (totals.autoDiscount > 0) {
        if (!autoDiscountRow) {
            autoDiscountRow = document.createElement('div');
            autoDiscountRow.id = 'autoDiscountRow';
            autoDiscountRow.className = 'summary-row';
            autoDiscountRow.style.color = 'var(--accent-color)'; // Or similar
            if (totalRow && summaryContainer) {
                summaryContainer.insertBefore(autoDiscountRow, totalRow);
            }
        }
        autoDiscountRow.innerHTML = `
            <span>Bulk Discount (10%):</span>
            <span>-${formatINR(totals.autoDiscount)}</span>
        `;
    } else {
        if (autoDiscountRow) autoDiscountRow.remove();
    }

    // Manual Discount Row (recreate or update)
    let manualDiscountRow = document.getElementById('manualDiscountRow');
    if (totals.manualDiscountAmount > 0) {
        if (!manualDiscountRow) {
            manualDiscountRow = document.createElement('div');
            manualDiscountRow.id = 'manualDiscountRow';
            manualDiscountRow.className = 'summary-row';
            manualDiscountRow.style.color = 'var(--success-color)';
            if (totalRow && summaryContainer) {
                summaryContainer.insertBefore(manualDiscountRow, totalRow);
            }
        }
        manualDiscountRow.innerHTML = `
            <span>Discount Code (${currentDiscount}%):</span>
            <span>-${formatINR(totals.manualDiscountAmount)}</span>
        `;
    } else {
        if (manualDiscountRow) manualDiscountRow.remove();
    }
}

// Load cart on cart page
if (window.location.pathname.includes('cart.html')) {
    renderCart();
}

// ===== CHECKOUT BUTTON =====
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cartManager.getCart().length === 0) {
            showToast('⚠ Your cart is empty!', 'error');
            return;
        }

        const totals = calculateCartTotals();
        const itemCount = cartManager.getCart().length;

        if (confirm(`Proceed to checkout?\n\nTotal Items: ${itemCount}\nTotal Amount: ${formatINR(totals.finalTotal)}`)) {
            showToast('Order placed successfully! Thank you for choosing FitLife!', 'success');

            // Clear cart after 2 seconds
            setTimeout(() => {
                cartManager.clearCart();
                renderCart();
            }, 2000);
        }
    });
}

// ===== DISCOUNT CODE FUNCTIONALITY =====
const applyDiscountBtn = document.getElementById('applyDiscount');
// Variables moved to top of file
// check calculateCartTotals() for logic

if (applyDiscountBtn) {
    applyDiscountBtn.addEventListener('click', () => {
        const discountInput = document.getElementById('discountCode');
        const discountCode = discountInput.value.toUpperCase().trim();

        const validCodes = {
            'FITLIFE10': 10,
            'SUMMER20': 20,
            'NEWYEAR25': 25,
            'SAVE15': 15,
            'WELCOME30': 30,
            'ZONE15': 15
        };

        if (!discountCode) {
            showToast('⚠ Please enter a discount code!', 'error');
            return;
        }

        if (validCodes[discountCode]) {
            if (discountApplied) {
                showToast(' Discount already applied!', 'error');
                return;
            }

            const discount = validCodes[discountCode];
            currentDiscount = discount;
            discountApplied = true;

            // Update UI by recalculating totals
            updateCartSummary();

            showToast(` ${discount}% discount applied successfully!`, 'success');
            discountInput.value = '';
            applyDiscountBtn.textContent = 'Applied ✓';
            applyDiscountBtn.disabled = true;
            applyDiscountBtn.style.opacity = '0.6';
        } else {
            showToast(' Invalid discount code! Try: FITLIFE10, SUMMER20, NEWYEAR25', 'error');
        }
    });

    // Allow Enter key to apply discount
    const discountInput = document.getElementById('discountCode');
    if (discountInput) {
        discountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyDiscountBtn.click();
            }
        });
    }
}

// ===== TESTIMONIAL SLIDER =====
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.testimonial-card');

function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
        testimonial.classList.remove('active');
        if (i === index) {
            testimonial.classList.add('active');
        }
    });

    // Update dots
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function nextTestimonial() {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    showTestimonial(currentTestimonial);
}

function prevTestimonial() {
    currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
    showTestimonial(currentTestimonial);
}

// Initialize testimonial slider
if (testimonials.length > 0) {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.slider-dots');

    if (prevBtn) prevBtn.addEventListener('click', prevTestimonial);
    if (nextBtn) nextBtn.addEventListener('click', nextTestimonial);

    // Create dots
    if (dotsContainer) {
        testimonials.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'slider-dot';
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentTestimonial = index;
                showTestimonial(index);
            });
            dotsContainer.appendChild(dot);
        });
    }

    // Auto-advance every 5 seconds
    setInterval(nextTestimonial, 5000);
}

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone')?.value || 'Not provided',
            program: document.getElementById('program')?.value || 'Not specified',
            message: document.getElementById('message').value,
            date: new Date().toLocaleString()
        };

        // Validate
        if (!formData.name || !formData.email) {
            showToast(' Please fill in all required fields!', 'error');
            return;
        }

        // Save to localStorage
        try {
            const submissions = JSON.parse(localStorage.getItem('fitlife_submissions')) || [];
            submissions.push(formData);
            localStorage.setItem('fitlife_submissions', JSON.stringify(submissions));
        } catch (e) {
            console.error('Error saving submission:', e);
        }

        showToast(' Message sent successfully! We\'ll contact you soon.', 'success');
        contactForm.reset();
    });
}

// ===== DOWNLOAD CONTACT INFO =====
const downloadBtn = document.getElementById('downloadBtn');

if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const nameEl = document.getElementById('name');
        const emailEl = document.getElementById('email');
        const phoneEl = document.getElementById('phone');
        const programEl = document.getElementById('program');
        const messageEl = document.getElementById('message');

        const formData = {
            name: nameEl?.value || '',
            email: emailEl?.value || '',
            phone: phoneEl?.value || '',
            program: programEl?.value || '',
            message: messageEl?.value || ''
        };

        if (!formData.name || !formData.email) {
            showToast('⚠ Please fill in at least name and email!', 'error');
            return;
        }

        // Create text content
        const content = `
FitLife Trainer - Contact Information
=====================================

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}
Interested Program: ${formData.program || 'Not specified'}
Message: ${formData.message || 'No message'}

Date: ${new Date().toLocaleString()}

=====================================
Thank you for your interest in FitLife Trainer!
We will get back to you soon.

Contact us:
Phone: +1 (555) 123-4567
Email: info@fitlife.com
Website: www.fitlife.com
        `.trim();

        // Create and download file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FitLife_Contact_${formData.name.replace(/\s+/g, '_')}_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('✓ Contact info downloaded successfully!', 'success');
    });
}



// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right').forEach(el => {
    observer.observe(el);
});

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== SCROLL INDICATOR HIDE ON SCROLL =====
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            scrollIndicator.style.opacity = '0';
        } else {
            scrollIndicator.style.opacity = '1';
        }
    });
}

// ===== HEADER SHADOW ON SCROLL =====
const header = document.querySelector('header');
if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        }
    });
}

// ===== PAGE LOAD ANIMATIONS =====
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    // Update cart count
    cartManager.updateCartCount();

    // Render cart if on cart page
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }

    // Initialize all add to cart buttons
    initializeAddToCart();

    console.log('%cFitLife Trainer', 'font-size: 24px; font-weight: bold; color: #ff6b35;');
    console.log('%cTransform Your Body & Life', 'font-size: 14px; color: #2c3e50;');
    console.log('%cAll features are now fully functional!', 'font-size: 12px; color: #10b981;');
});


