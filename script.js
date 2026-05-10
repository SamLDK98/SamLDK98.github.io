document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');

  const sections = document.querySelectorAll('.essay-section');

  if (!('IntersectionObserver' in window)) {
    sections.forEach(section => section.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Slight stagger based on position in viewport batch
        entry.target.style.animationDelay = `${i * 0.07}s`;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
  });

  sections.forEach(section => {
    observer.observe(section);
  });
});
