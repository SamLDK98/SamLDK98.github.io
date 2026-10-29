/* Buildless, dependency-free explorations. All charts use the same fixed scale. */
(() => {
  'use strict';
  const specs = {
    base: [['x', -3, 3, .25, 1]],
    constant: [['c', -6, 6, .25, 0]],
    scale: [['a', -3, 3, .25, 1]],
    linear: [['b', -6, 6, .25, 0]],
    general: [['a', -3, 3, .25, 1], ['b', -6, 6, .25, 0], ['c', -6, 6, .25, 0]],
    vertex: [['a', -3, 3, .25, 1], ['h', -5, 5, .25, 0], ['k', -6, 6, .25, 0]]
  };
  const fmt = n => Math.abs(n) < .0000001 ? '0' : String(Number(n.toFixed(3))).replace('-', '−');
  const term = (n, suffix, first = false) => {
    if (!n) return '';
    return (n < 0 ? (first ? '−' : ' − ') : (first ? '' : ' + ')) + (Math.abs(n) === 1 && suffix ? '' : fmt(Math.abs(n))) + suffix;
  };
  const polynomial = (a, b, c) => (term(a, 'x²', true) + term(b, 'x', !a) + term(c, '', !a && !b)) || '0';
  const colors = { a: '#7aa7ff', b: '#64c8a0', c: '#e8a33d', h: '#64c8a0', k: '#e8a33d', x: '#e8a33d' };
  document.querySelectorAll('.explorer').forEach((host, index) => {
    const kind = host.dataset.kind;
    const parameters = specs[kind];
    const state = Object.fromEntries(parameters.map(([key, , , , initial]) => [key, initial]));
    let center = null;
    host.innerHTML = `<div class="widget-head"><div class="equation"></div><div class="widget-actions">${kind === 'base' ? '' : `<label><input type="checkbox" class="compare">Compare with x²</label>`}<button type="button" class="reset">Reset</button></div></div>
      <svg class="chart" viewBox="0 0 680 420" role="img" aria-labelledby="chart-title-${index} chart-desc-${index}"><title id="chart-title-${index}"></title><desc id="chart-desc-${index}"></desc></svg>
      <div class="controls">${parameters.map(([key, min, max, step, initial]) => `<div class="control" style="--accent:${colors[key]}"><label for="parameter-${index}-${key}"><span>${key}</span><output for="parameter-${index}-${key}">${fmt(initial)}</output></label><input id="parameter-${index}-${key}" data-key="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${initial}"></div>`).join('')}</div>
      <p class="feedback" aria-live="polite"></p>
      <details class="graph-details"><summary>Graph details</summary><div class="readout" aria-live="polite" aria-atomic="true"></div>
      <div class="view-tools"><button type="button" class="recenter">Centre on vertex</button><button type="button" class="origin">Original view</button></div></details>`;
    const svg = host.querySelector('svg');
    const coefficients = () => {
      const a = state.a ?? 1;
      return kind === 'vertex' ? { a, b: -2 * a * state.h, c: a * state.h ** 2 + state.k } : { a, b: state.b ?? 0, c: state.c ?? 0 };
    };
    function render() {
      const { a, b, c } = coefficients();
      const f = x => a * x * x + b * x + c;
      const vx = a ? -b / (2 * a) : null;
      const vy = a ? f(vx) : null;
      const equation = kind === 'vertex' && a ? `${a === 1 ? '' : a === -1 ? '−' : fmt(a)}(x ${state.h < 0 ? '+' : '−'} ${fmt(Math.abs(state.h))})²${term(state.k, '')}` : polynomial(a, b, c);
      host.querySelector('.equation').textContent = `f(x) = ${equation}`;
      const cx = center ? center[0] : 0, cy = center ? center[1] : 2;
      const xmin = cx - 8, xmax = cx + 8, ymin = cy - 14, ymax = cy + 14;
      const left = 48, top = 20, width = 608, height = 360;
      const X = x => left + (x - xmin) / 16 * width;
      const Y = y => top + (ymax - y) / 28 * height;
      const inside = (x, y) => x >= xmin && x <= xmax && y >= ymin && y <= ymax;
      const path = fn => Array.from({ length: 641 }, (_, i) => {
        const x = xmin + i / 640 * 16;
        return `${i ? 'L' : 'M'}${X(x).toFixed(2)},${Y(fn(x)).toFixed(2)}`;
      }).join(' ');
      let grid = '';
      for (let x = Math.ceil(xmin / 2) * 2; x <= xmax; x += 2) {
        grid += `<path d="M${X(x)},${top}V${top + height}" stroke="#1c1f26"/><text x="${X(x)}" y="400" text-anchor="middle">${fmt(x)}</text>`;
      }
      for (let y = Math.ceil(ymin / 4) * 4; y <= ymax; y += 4) {
        grid += `<path d="M${left},${Y(y)}H${left + width}" stroke="#1c1f26"/><text x="38" y="${Y(y) + 4}" text-anchor="end">${fmt(y)}</text>`;
      }
      const axes = `<path d="M${X(0)},${top}V${top + height}M${left},${Y(0)}H${left + width}" stroke="#414754"/>`;
      let marks = '';
      if (a && kind !== 'base') marks += `<circle cx="${X(vx)}" cy="${Y(vy)}" r="5" fill="#e8a33d"/>`;
      if (kind === 'base') {
        const x = state.x, y = f(x);
        marks += `<path d="M${X(x)},${Y(0)}V${Y(y)}H${X(0)}" fill="none" stroke="#e8a33d" stroke-dasharray="4 4"/><circle cx="${X(x)}" cy="${Y(y)}" r="6" fill="#e8a33d"/><circle cx="${X(-x)}" cy="${Y(y)}" r="6" fill="none" stroke="#e8a33d" stroke-width="2"/>`;
      }
      const disc = b * b - 4 * a * c;
      let roots;
      if (!a) {
        roots = b ? `x-intercept: ${fmt(-c / b)}` : c ? 'No x-intercepts' : 'Every x is an x-intercept';

      }
      else if (disc < -1e-9) roots = 'No real x-intercepts';
      else {
        const xs = Math.abs(disc) < 1e-9 ? [vx] : [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)].sort((u, v) => u - v);
        roots = `x-intercept${xs.length > 1 ? 's' : ''}: ${xs.map(fmt).join(', ')}`;

      }
      svg.innerHTML = `<title id="chart-title-${index}">Graph of f(x) = ${equation}</title><desc id="chart-desc-${index}">${a ? `Vertex (${fmt(vx)}, ${fmt(vy)}).` : 'Not a quadratic.'} ${roots}. Horizontal range ${fmt(xmin)} to ${fmt(xmax)}, vertical range ${fmt(ymin)} to ${fmt(ymax)}.</desc><defs><clipPath id="plot-${index}"><rect x="${left}" y="${top}" width="${width}" height="${height}"/></clipPath></defs>${grid}<g clip-path="url(#plot-${index})">${axes}${!host.querySelector('.compare')?.checked ? '' : `<path d="${path(x => x * x)}" fill="none" stroke="#8993a8" stroke-width="2" stroke-dasharray="5 6" opacity=".7"/>`}<path d="${path(f)}" fill="none" stroke="#64c8a0" stroke-width="3"/>${marks}</g><text x="660" y="401">x</text><text x="17" y="14">y</text>`;
      const values = kind === 'base' ? [`x = ${fmt(state.x)}`, `f(x) = ${fmt(f(state.x))}`, `f(−x) = ${fmt(f(-state.x))}`] : [a ? `Vertex: (${fmt(vx)}, ${fmt(vy)})` : b ? 'Straight line · not quadratic' : 'Constant function · not quadratic', `y-intercept: (0, ${fmt(c)})`, roots];
      host.querySelector('.readout').replaceChildren(...values.map(value => Object.assign(document.createElement('span'), { textContent: value })));
      let feedback = '';
      if (!a) feedback = b ? 'a = 0: the curve becomes a straight line.' : 'a = 0: every input gives the same height.';
      else if (!inside(vx, vy)) feedback = 'Vertex outside the view. Centre it in Graph details.';
      else if (kind === 'base') feedback = `f(${fmt(state.x)}) = ${fmt(f(state.x))} · f(${fmt(-state.x)}) = ${fmt(f(-state.x))}`;
      host.querySelector('.feedback').textContent = feedback;
      host.querySelector('.recenter').disabled = !a;
      host.querySelectorAll('input[type=range]').forEach(input => { input.value = state[input.dataset.key]; input.previousElementSibling.querySelector('output').textContent = fmt(state[input.dataset.key]); });
    }
    host.addEventListener('input', event => { if (event.target.matches('.compare')) { render(); return; } if (!event.target.matches('input[type=range]')) return; state[event.target.dataset.key] = Number(event.target.value); render(); });
    host.querySelector('.reset').addEventListener('click', () => { parameters.forEach(([key, , , , initial]) => { state[key] = initial; }); center = null; const compare = host.querySelector('.compare'); if (compare) compare.checked = false; render(); });
    host.querySelector('.recenter').addEventListener('click', () => { const { a, b, c } = coefficients(); if (a) { const x = -b / (2 * a); center = [x, a * x * x + b * x + c]; render(); } });
    host.querySelector('.origin').addEventListener('click', () => { center = null; render(); });
    render();
  });

  const tabs = [...document.querySelectorAll('[role=tab]')];
  const panels = [...document.querySelectorAll('[role=tabpanel]')];
  const nextLabels = ['Add a constant', 'Multiply the square', 'Add a linear term', 'Combine the parameters', 'Try vertex form', 'Start again'];
  let current = 0;
  function selectStep(index, focus = false) {
    current = index;
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
    document.querySelector('.previous').disabled = index === 0;
    document.querySelector('.next').textContent = `${nextLabels[index]} →`;
    document.querySelector('.step-count').textContent = `0${index + 1} / 06`;
    if (focus) tabs[index].focus({ preventScroll: true });
    tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    history.replaceState(null, '', `#${panels[index].id}`);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectStep(index));
    tab.addEventListener('keydown', event => {
      let destination;
      if (event.key === 'ArrowRight') destination = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') destination = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') destination = 0;
      if (event.key === 'End') destination = tabs.length - 1;
      if (destination !== undefined) { event.preventDefault(); selectStep(destination, true); }
    });
  });
  document.querySelector('.previous').addEventListener('click', () => selectStep(Math.max(0, current - 1), true));
  document.querySelector('.next').addEventListener('click', () => selectStep((current + 1) % tabs.length, true));
  const initial = panels.findIndex(panel => `#${panel.id}` === location.hash);
  // Preserve the reader's scroll position on first load.
  if (initial > 0) selectStep(initial);
  else document.querySelector('.previous').disabled = true;
})();
