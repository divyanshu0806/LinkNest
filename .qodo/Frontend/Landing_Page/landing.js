        // Mobile Menu Toggle
        document.getElementById('mobile-menu-btn').addEventListener('click', function () {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        });

        // Smooth Scroll Function
        function scrollToSection(id) {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Toggle FAQ
        function toggleFaq(button) {
            const answer = button.nextElementSibling;
            const icon = button.querySelector('svg');

            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
                icon.style.transform = 'rotate(0deg)';
            } else {
                // Close all other FAQs
                document.querySelectorAll('.faq-answer').forEach(item => {
                    item.style.maxHeight = null;
                });
                document.querySelectorAll('.faq-question svg').forEach(item => {
                    item.style.transform = 'rotate(0deg)';
                });

                // Open clicked FAQ
                answer.style.maxHeight = answer.scrollHeight + 'px';
                icon.style.transform = 'rotate(180deg)';
            }
        }

        // Counter Animation
        function animateCounter() {
            const counters = document.querySelectorAll('.counter');

            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 16); // 60fps
                let current = 0;

                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current).toLocaleString();
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target.toLocaleString();
                    }
                };

                updateCounter();
            });
        }

        // Intersection Observer for Counter Animation
        const observerOptions = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe stats section
        const statsSection = document.querySelector('.counter').closest('section');
        if (statsSection) {
            observer.observe(statsSection);
        }

        // Dynamic Demo Links
        function updateDemoLinks() {
            const demoLinksContainer = document.getElementById('demo-links');
            const currentHour = new Date().getHours();
            const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);

            let links = [
                { title: '📺 Latest YouTube Video', url: '#', priority: 1 },
                { title: '📷 Follow on Instagram', url: '#', priority: 2 },
                { title: '📰 Subscribe to Newsletter', url: '#', priority: 3 },
            ];

            // Time-based rule: Show "Book a Call" only during business hours
            if (currentHour >= 9 && currentHour < 17) {
                links.splice(2, 0, { title: '📅 Book a Consultation', url: '#', priority: 2.5 });
            }

            // Device-based rule: Show app download only on mobile
            if (isMobile) {
                links.push({ title: '📱 Download Our App', url: '#', priority: 4 });
            }

           demoLinksContainer.innerHTML = links.map(link => `
        <a href="${link.url}" 
           class="block p-4 bg-[#050505] border border-[#1a1a1a] rounded-lg transition duration-300 text-white hover:border-[#22c55e]">
            ${link.title}
        </a>
    `).join('');
}
        // Update visitor info
        function updateVisitorInfo() {
            const infoContainer = document.getElementById('visitor-info');
            const currentHour = new Date().getHours();
            const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
            const device = isMobile ? '📱 Mobile' : '💻 Desktop';
            const timeOfDay = currentHour < 12 ? '🌅 Morning' : currentHour < 17 ? '☀️ Afternoon' : '🌙 Evening';

            infoContainer.innerHTML = `${device} • ${timeOfDay}`;
        }

        // Play Demo
        function playDemo() {
            alert('Demo video would play here! 🎥\n\nIn production, this would open a video modal showing:\n- Hub creation process\n- Rule builder in action\n- Analytics dashboard\n- Public hub adapting to different contexts');
        }

        // Handle Signup Form
        function handleSignup(event) {
            event.preventDefault();
            const email = event.target.querySelector('input[type="email"]').value;
            alert(`Thank you for signing up! 🎉\n\nWe've sent a verification email to:\n${email}\n\nIn production, this would:\n1. Create your account\n2. Send verification email\n3. Redirect to dashboard`);
            event.target.reset();
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function () {
            updateDemoLinks();
            updateVisitorInfo();

            // Update demo every minute to show time-based changes
            setInterval(updateDemoLinks, 60000);
        });

        // Scroll animations for feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    cardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        featureCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease-out';
            cardObserver.observe(card);
        });
