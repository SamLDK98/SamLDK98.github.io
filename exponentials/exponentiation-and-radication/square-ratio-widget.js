(() => {
  'use strict';
  document.documentElement.classList.toggle('standalone', window.parent === window);
  const shrinking = new URLSearchParams(window.location.search).get('mode') === 'shrink';
  const square = document.getElementById('square');
  const copies = [...document.querySelectorAll('.copy')];
  const frame = document.getElementById('frame');
  const outline = document.getElementById('frame-outline');
  const cross = document.getElementById('frame-cross');
  const explanation = document.getElementById('explanation');
  const comparison = document.getElementById('comparison');
  const back = document.getElementById('back');
  const next = document.getElementById('next');
  const reset = document.getElementById('reset');
  const sideLabel = document.getElementById('side-label');
  const journey = document.querySelector('.journey');
  const areas = shrinking ? [256, 64, 16, 4, 1] : [1, 4, 16, 64, 256];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let step = 0;
  let busy = false;
  journey.innerHTML = areas.map(area => `<li>${area}</li>`).join('');
  if (shrinking) {
    document.title = 'One quarter at each step';
    document.getElementById('scene-title').textContent = 'A square shrinking to one quarter of its area at each step';
  }
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : milliseconds));
  const sizeAt = n => Math.sqrt(areas[n]) * 16;
  const attrs = (element, values) => Object.entries(values).forEach(([name, value]) => element.setAttribute(name, value));
  function position(element, x, y, size) {
    attrs(element, { x, y, width: size, height: size });
  }
  function grid(x, y, size) {
    position(outline, x, y, size);
    cross.setAttribute('d', `M${x + size / 2} ${y}v${size} M${x} ${y + size / 2}h${size}`);
  }
  function updateButtons() {
    back.disabled = busy || step === 0;
    next.disabled = busy || step === 4;
    reset.disabled = busy || step === 0;
    next.textContent = step === 4 ? 'Four steps complete' : shrinking ? 'Keep one quarter →' : 'Make four copies →';
  }
  function reportHeight() { window.postWidgetHeight?.(); }
  function render() {
    const side = Math.sqrt(areas[step]);
    const size = sizeAt(step);
    position(square, 180 - size / 2, 144 - size / 2, size);
    square.style.opacity = '1';
    copies.forEach(copy => { copy.style.opacity = '0'; });
    frame.style.opacity = '0';
    sideLabel.style.opacity = '1';
    attrs(sideLabel, { x: 180, y: 144 + size / 2 + 23 });
    sideLabel.textContent = `${side} × ${side}`;
    document.getElementById('step').textContent = `Step ${step} / 4`;
    document.getElementById('area').textContent = areas[step];
    document.getElementById('side').textContent = side;
    document.getElementById('scene-desc').textContent = `Step ${step} of four. Side length ${side}, area ${areas[step]}. All squares use the same scale. ${shrinking ? 'Each step halves both sides and quarters the area.' : 'Each step doubles both sides and quadruples the area.'}`;
    [...journey.children].forEach((item, index) => {
      if (index === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    if (step === 0) {
      explanation.textContent = shrinking ? 'Start with a 16 × 16 square. Its area is 256.' : 'Start with one square of area 1. Make four copies to see the first enlargement.';
      comparison.textContent = 'Every square uses the same scale.';
    } else {
      const previous = areas[step - 1];
      const current = areas[step];
      explanation.textContent = step === 4
        ? shrinking ? 'Four quarterings return 256 to 1. Reverse them: four factors of 4 make 256. So ∜256 = 4.' : 'Four enlargements reach 256: 4 × 4 × 4 × 4 = 256. So ∜256 = 4: the factor at each step is 4.'
        : shrinking ? `Keep one of four equal squares. The area is ${current}; each side is now ${side}.` : `Four copies of area ${previous} make one square of area ${current}. Its side length is ${side}.`;
      comparison.textContent = shrinking
        ? `${current} / ${previous} = ¼ each time · area removed this step: ${previous - current}`
        : `${current} / ${previous} = 4 each time · area added this step: ${current - previous}`;
    }
    updateButtons();
    reportHeight();
  }
  async function grow() {
    const size = sizeAt(step);
    const x = 180 - size;
    const y = 144 - size;
    // The frame is four times the area of the current square, on a fixed scale.
    grid(x, y, size * 2);
    copies.forEach((copy, i) => {
      const [dx, dy] = [[1, 0], [0, 1], [1, 1]][i];
      position(copy, x + dx * size, y + dy * size, size);
    });
    sideLabel.style.opacity = '0';
    explanation.textContent = 'A 2 × 2 frame: four spaces, each the size of the current square.';
    frame.style.opacity = '1';
    position(square, x, y, size);
    await wait(650);
    explanation.textContent = 'Place one identical copy in each space.';
    for (const copy of copies) {
      copy.style.opacity = '1';
      await wait(280);
    }
    await wait(450);
    // Cover the seams before hiding the copies: the four squares become one.
    position(square, x, y, size * 2);
    await wait(400);
    frame.style.opacity = '0';
    copies.forEach(copy => { copy.style.opacity = '0'; });
    await wait(350);
  }
  async function shrink() {
    const size = sizeAt(step);
    const x = 180 - size / 2;
    const y = 144 - size / 2;
    grid(x, y, size);
    frame.style.opacity = '1';
    sideLabel.style.opacity = '0';
    explanation.textContent = 'Halve both side lengths. The dividing lines make four equal squares.';
    const half = size / 2;
    // Position the hidden quarters while the grid is being revealed.
    copies.forEach((copy, i) => {
      const [dx, dy] = [[1, 0], [0, 1], [1, 1]][i];
      position(copy, x + dx * half, y + dy * half, half);
    });
    await wait(800);
    // Replace the solid square with four quarters, then let three fade away.
    copies.forEach(copy => { copy.style.opacity = '1'; });
    position(square, x, y, half);
    await wait(400);
    explanation.textContent = 'Keep one quarter. The amount removed changes; the fraction kept is always ¼.';
    copies.forEach(copy => { copy.style.opacity = '0'; });
    await wait(650);
    frame.style.opacity = '0';
    await wait(350);
  }
  next.addEventListener('click', async () => {
    if (busy || step === 4) return;
    busy = true;
    updateButtons();
    try {
      if (shrinking) await shrink();
      else await grow();
      step++;
    } finally {
      busy = false;
      render();
    }
  });
  back.addEventListener('click', () => { if (!busy && step > 0) { step--; render(); } });
  reset.addEventListener('click', () => { if (!busy) { step = 0; render(); } });
  new ResizeObserver(reportHeight).observe(document.querySelector('.widget'));
  render();
})();
