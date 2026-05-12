document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');

  const autoHeightFrames = document.querySelectorAll('.essay-widget-microstates, .essay-widget-autosize');

  const resizeFrame = (frame) => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      const height = Math.max(
        doc.body.scrollHeight,
        doc.body.offsetHeight,
        doc.documentElement.scrollHeight,
        doc.documentElement.offsetHeight
      );
      frame.style.height = `${height + 4}px`;
    } catch {
      // Keep the CSS fallback height if the frame cannot be measured.
    }
  };

  autoHeightFrames.forEach((frame) => {
    frame.addEventListener('load', () => resizeFrame(frame));
    if (frame.contentDocument?.readyState === 'complete') {
      resizeFrame(frame);
    }
  });

  window.addEventListener('resize', () => {
    autoHeightFrames.forEach(resizeFrame);
  });

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
