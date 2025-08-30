// Toggle menu icon and navbar
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');



menuIcon.onclick = () => {
    navbar.classList.toggle('active');
    menuIcon.classList.toggle('bx-x');
    document.body.classList.toggle('menu-open');
};




// Scroll sticky header and highlight nav links
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    let top = window.scrollY;

    // Sticky header logic
    let header = document.querySelector('header');
    header.classList.toggle('sticky', top > 100);

    // Remove 'active' class from all nav links first
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    sections.forEach(sec => {
        let offset = sec.offsetTop - 150; // Adjusted offset for better activation
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            // Add 'active' class to the corresponding nav link
            const activeLink = document.querySelector('header nav a[href*=' + id + ']');
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    });

    // Close navbar and reset menu icon on scroll (for mobile view)
    // This ensures the menu closes if the user scrolls instead of clicking the icon
    if (navbar.classList.contains('active')) {
        navbar.classList.remove('active');
        if (menuIcon.classList.contains('bx-x')) {
            menuIcon.classList.remove('bx-x');
            menuIcon.classList.add('bx-menu');
        }
    }
};

// Smooth scroll to contact section via "Hire Me" button
// It's good practice to wrap such listeners to ensure the element exists
const hireBtn = document.querySelector('.btn-box .btn[href="#contact"]');
if (hireBtn) {
    hireBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default anchor link behavior
        document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' });
        // Optionally, close the navbar if it's open after clicking the button on mobile
        if (navbar.classList.contains('active')) {
            navbar.classList.remove('active');
            if (menuIcon.classList.contains('bx-x')) {
                menuIcon.classList.remove('bx-x');
                menuIcon.classList.add('bx-menu');

            }
        }
    });
}

const typingElement = document.querySelector(".typing-text");
const roles = ["Frontend Developer", "Web Developer", "UI/UX Designer", "Coder"];
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
    const currentRole = roles[roleIndex];
    if (!isDeleting) {
        typingElement.textContent = currentRole.substring(0, charIndex++);
        if (charIndex > currentRole.length) {
            isDeleting = true;
            setTimeout(type, 1000);
            return;
        }
    } else {
        typingElement.textContent = currentRole.substring(0, charIndex--);
        if (charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
        }
    }
    setTimeout(type, isDeleting ? 50 : 100);
}

document.addEventListener("DOMContentLoaded", type);

document.addEventListener("DOMContentLoaded", () => {
    const typedTextSpan = document.getElementById("typed-text");
    const words = ["a Frontend Developer", "a Tech Explorer", "a UI Designer"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeLoop() {
        const currentWord = words[wordIndex];

        if (!isDeleting && charIndex <= currentWord.length) {
            typedTextSpan.textContent = currentWord.substring(0, charIndex++);
            setTimeout(typeLoop, 100);
        } else if (isDeleting && charIndex >= 0) {
            typedTextSpan.textContent = currentWord.substring(0, charIndex--);
            setTimeout(typeLoop, 60);
        } else {
            isDeleting = !isDeleting;
            if (!isDeleting) wordIndex = (wordIndex + 1) % words.length;
            setTimeout(typeLoop, 800);
        }
    }

    typeLoop();
});


