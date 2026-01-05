document.addEventListener('DOMContentLoaded', () => {
    // This script can be used for interactive elements if needed.
    // For this static dashboard design, no complex JavaScript is required.

    // Example: Highlight active navigation link (already handled by HTML/CSS,
    // but this shows how you'd typically manage it with JS for dynamic pages)
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Prevent default link behavior if you want to handle navigation via JS
            // event.preventDefault();

            // Remove 'active' class from all links
            navLinks.forEach(item => item.classList.remove('active'));

            // Add 'active' class to the clicked link
            this.classList.add('active');

            // In a real application, you'd load content dynamically here
            // console.log(`Navigating to: ${this.textContent.trim()}`);
        });
    });

    // You could also add functionality like:
    // - Dynamic loading of stats or review items
    // - Form submission handling for the search bar
    // - User interaction feedback (e.g., a "Copied!" message if a feature involved copying)
});