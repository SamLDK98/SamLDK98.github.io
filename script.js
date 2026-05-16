document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');

  const shelfArt = document.querySelector('.shelf-art');

  if (shelfArt) {
    const updateShelfZoom = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const eased = 1 - Math.pow(1 - progress, 3);

      shelfArt.style.setProperty('--shelf-zoom', (1 + eased * 0.78).toFixed(3));
      shelfArt.style.setProperty('--shelf-x', `${(-18 * eased).toFixed(2)}vw`);
      shelfArt.style.setProperty('--shelf-y', `${(3.5 * eased).toFixed(2)}vh`);
    };

    const books = document.querySelectorAll('.shelf-book');

    books.forEach((book) => {
      book.addEventListener('click', (event) => {
        if (!book.classList.contains('is-open')) {
          event.preventDefault();
          books.forEach((otherBook) => otherBook.classList.remove('is-open', 'is-selected'));
          book.classList.add('is-open', 'is-selected');
        }
      });
    });

    updateShelfZoom();
    window.addEventListener('scroll', updateShelfZoom, { passive: true });
    window.addEventListener('resize', updateShelfZoom);
  }

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
    frame.addEventListener('load', () => {
      resizeFrame(frame);
      setTimeout(() => resizeFrame(frame), 120);
      setTimeout(() => resizeFrame(frame), 400);
    });
    if (frame.contentDocument?.readyState === 'complete') {
      resizeFrame(frame);
      setTimeout(() => resizeFrame(frame), 120);
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
