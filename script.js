document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');

  const isTrigonometryChapter = document.body.classList.contains('chapter-page')
    && /^trigonometry-.*\.html$/.test(window.location.pathname.split('/').pop() || '');

  if (isTrigonometryChapter) {
    const trigChapters = [
      { href: 'trigonometry-what-is-an-angle.html', kicker: 'Chapter 1', title: 'Measuring Angles' },
      { href: 'trigonometry-overview.html', kicker: 'Chapter 2', title: 'Why Triangles?' },
      { href: 'trigonometry-right-angled-triangles.html', kicker: 'Chapter 3', title: 'Deriving Angle-Ratio Correspondences' },
      { href: 'trigonometry-computing-sine-and-cosine.html', kicker: 'Chapter 4', title: 'How to Think About Sine and Cosine' },
      { href: 'trigonometry-unit-circle.html', kicker: 'Chapter 5', title: 'Sine and Cosine as Coordinates' },
      { href: 'trigonometry-oscillations.html', kicker: 'Chapter 6', title: 'Oscillations' },
      { href: 'trigonometry-waves.html', kicker: 'Chapter 7', title: 'Waves' },
      { href: 'trigonometry-algebra-branch.html', kicker: 'Chapter 8', title: 'Algebra Branch' },
      { href: 'trigonometry-complex-numbers.html', kicker: 'Chapter 9', title: 'Complex Numbers' },
      { href: 'trigonometry-polar-form.html', kicker: 'Chapter 10', title: 'Polar Form' },
      { href: 'trigonometry-eulers-formula.html', kicker: 'Chapter 11', title: "Euler's Formula" },
      { href: 'trigonometry-coordinates-on-the-unit-circle.html', kicker: 'Archive', title: 'Misc' },
    ];
    const currentPage = window.location.pathname.split('/').pop();
    const nav = document.createElement('nav');
    nav.className = 'trig-floating-nav';
    nav.setAttribute('aria-label', 'Trigonometry chapter navigation');
    nav.innerHTML = `
      <button class="trig-floating-nav-tab" type="button" aria-expanded="false" aria-label="Open trigonometry chapter navigation">
        <span class="trig-floating-nav-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      <div class="trig-floating-nav-panel">
        <div class="trig-floating-nav-home-row">
          <a class="trig-floating-nav-home-link${currentPage === 'trigonometry.html' ? ' is-current' : ''}" href="trigonometry.html">Trigonometry</a>
          <a class="trig-floating-nav-home-link${currentPage === 'index.html' ? ' is-current' : ''}" href="index.html">Home</a>
        </div>
        ${trigChapters.map((chapter) => `
          <a class="trig-floating-nav-link${chapter.href === currentPage ? ' is-current' : ''}" href="${chapter.href}">
            <span>${chapter.kicker}</span>
            <strong>${chapter.title}</strong>
          </a>
        `).join('')}
      </div>
    `;
    document.body.appendChild(nav);

    const tab = nav.querySelector('.trig-floating-nav-tab');
    const setExpanded = (expanded) => {
      tab?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    nav.addEventListener('mouseenter', () => setExpanded(true));
    nav.addEventListener('mouseleave', () => setExpanded(false));
    tab?.addEventListener('click', () => {
      const expanded = tab.getAttribute('aria-expanded') === 'true';
      setExpanded(!expanded);
      nav.classList.toggle('is-open', !expanded);
    });
    nav.addEventListener('focusin', () => setExpanded(true));
    nav.addEventListener('focusout', (event) => {
      if (!nav.contains(event.relatedTarget)) {
        setExpanded(false);
        nav.classList.remove('is-open');
      }
    });
  }

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

  const rightTriangleLabels = document.querySelector('[data-right-triangle-labels]');

  if (rightTriangleLabels) {
    const button = rightTriangleLabels.querySelector('[data-trig-switch]');
    const base = rightTriangleLabels.querySelector('[data-trig-base]');
    const vertical = rightTriangleLabels.querySelector('[data-trig-vertical]');
    const baseLabel = rightTriangleLabels.querySelector('[data-trig-base-label]');
    const verticalLabel = rightTriangleLabels.querySelector('[data-trig-vertical-label]');
    const arc = rightTriangleLabels.querySelector('[data-trig-arc]');
    const theta = rightTriangleLabels.querySelector('[data-trig-theta]');
    let activeCorner = 'left';

    const setMode = (mode) => {
      const left = mode === 'left';
      base.setAttribute('class', `trig-line ${left ? 'trig-line-leg-green' : 'trig-line-leg-gold'}`);
      vertical.setAttribute('class', `trig-line ${left ? 'trig-line-leg-gold' : 'trig-line-leg-green'}`);
      baseLabel.setAttribute('class', `trig-small-label ${left ? 'trig-adjacent-text' : 'trig-opposite-text'}`);
      verticalLabel.setAttribute('class', `trig-small-label ${left ? 'trig-opposite-text' : 'trig-adjacent-text'}`);
      baseLabel.textContent = left ? 'adjacent' : 'opposite';
      verticalLabel.textContent = left ? 'opposite' : 'adjacent';
      arc.setAttribute('d', left ? 'M 148 250 A 60 60 0 0 0 141 219' : 'M 416 130 A 60 60 0 0 1 363 99');
      theta.setAttribute('x', left ? '157' : '390');
      theta.setAttribute('y', left ? '241' : '115');
    };

    button?.addEventListener('click', () => {
      activeCorner = activeCorner === 'left' ? 'top' : 'left';
      setMode(activeCorner);
    });
  }

  const questionCarousels = document.querySelectorAll('[data-question-carousel]');

  questionCarousels.forEach((carousel) => {
    const cards = Array.from(carousel.querySelectorAll('[data-question-card]'));
    const prevButton = carousel.querySelector('[data-question-prev]');
    const nextButton = carousel.querySelector('[data-question-next]');
    const status = carousel.querySelector('[data-question-status]');
    let activeIndex = cards.findIndex((card) => card.classList.contains('is-active'));

    if (!cards.length) return;
    if (activeIndex < 0) activeIndex = 0;

    const render = () => {
      cards.forEach((card, index) => {
        const isActive = index === activeIndex;
        const isFlipped = card.classList.contains('is-flipped');

        card.classList.toggle('is-active', isActive);
        card.classList.toggle('is-before', index < activeIndex);

        card.querySelectorAll('.question-card-face').forEach((face) => {
          const isVisibleFace = face.classList.contains(isFlipped ? 'question-card-back' : 'question-card-front');

          face.tabIndex = isActive && isVisibleFace ? 0 : -1;
          face.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');
        });
      });

      if (status) {
        status.textContent = `${activeIndex + 1} / ${cards.length}`;
      }
    };

    const goTo = (index) => {
      activeIndex = (index + cards.length) % cards.length;
      cards[activeIndex].classList.remove('is-flipped');
      render();
    };

    cards.forEach((card) => {
      const flipCard = () => {
        card.classList.toggle('is-flipped');
        render();
      };

      card.querySelectorAll('.question-card-face').forEach((face) => {
        face.addEventListener('click', flipCard);
        face.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          flipCard();
        });
      });
    });

    prevButton?.addEventListener('click', () => goTo(activeIndex - 1));
    nextButton?.addEventListener('click', () => goTo(activeIndex + 1));

    render();
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
