document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.essay-section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Slight stagger based on position in viewport batch
        entry.target.style.animationDelay = `${i * 0.07}s`;
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
  });

  sections.forEach(section => {
    section.style.animationPlayState = 'paused';
    observer.observe(section);
  });
});
