(() => {
  'use strict';
  const root = document.getElementById('laws-quiz');
  if (!root) return;
  const questions = [
    {
      prompt: 'Simplify this expression for a nonzero real number x.',
      math: String.raw`\frac{(x^3)^2\,x^4}{x^5}`,
      options: [String.raw`x^3`, String.raw`x^5`, String.raw`x^9`, String.raw`x^{19}`],
      answer: 1, rule: 'power-power',
      explanation: String.raw`A power of a power multiplies exponents first: \((x^3)^2=x^6\). Then combine the same base: \(x^{6+4-5}=x^5\).`
    },
    {
      prompt: 'Which expression equals the one below for every pair of real numbers a and b?',
      math: String.raw`a^4b^7`,
      options: [String.raw`(ab)^{11}`, String.raw`(ab)^4b^3`, String.raw`(ab)^7a^3`, String.raw`(ab)^{28}`],
      answer: 1, rule: 'power-product',
      explanation: String.raw`Split \(b^7\) into \(b^4b^3\). The matching fourth powers combine to give \(a^4b^4b^3=(ab)^4b^3\). Adding exponents requires identical bases.`
    },
    {
      prompt: 'Raise the entire quotient to the third power. Assume y is nonzero.',
      math: String.raw`\left(\frac{2x^3}{y^2}\right)^3`,
      options: [String.raw`\frac{2x^9}{y^6}`, String.raw`\frac{8x^6}{y^5}`, String.raw`\frac{8x^9}{y^6}`, String.raw`\frac{8x^9}{y^2}`],
      answer: 2, rule: 'power-quotient',
      explanation: String.raw`The outer exponent acts on every factor, including 2, and on the denominator: \(2^3(x^3)^3/(y^2)^3=8x^9/y^6\).`
    },
    {
      prompt: 'Which rewrite is valid for every real number a?',
      math: String.raw`a^3+a^2`,
      options: [String.raw`a^5`, String.raw`2a^5`, String.raw`a^6`, String.raw`a^2(a+1)`],
      answer: 3, rule: 'product',
      explanation: String.raw`The product rule applies to multiplication, not addition. Factor out the two factors of a shared by both terms: \(a^3+a^2=a^2(a+1)\).`
    },
    {
      prompt: 'A learner divides the exponents and gets the result below. Which explanation correctly repairs their reasoning? Assume a is nonzero.',
      math: String.raw`\frac{a^8}{a^3}\;\overset{?}{=}\;a^{8/3}`,
      options: [
        'Cancel three matching pairs of factors; five factors of a remain.',
        'Divide 8 by 3, then round down because exponents must be integers.',
        'Cancel the base a, leaving the fraction 8/3.',
        'Subtract the bases and keep the exponent 8.'
      ],
      textOptions: true, answer: 0, rule: 'quotient',
      explanation: String.raw`The exponents count factors; they are not the numbers being divided. Cancelling three pairs leaves \(a^{8-3}=a^5\). No rounding is involved.`
    },
    {
      prompt: 'Simplify. Both a and b are nonzero real numbers.',
      math: String.raw`\left(\frac{a}{b}\right)^2\left(\frac{b}{a}\right)^3`,
      options: [String.raw`\frac{a}{b}`, String.raw`1`, String.raw`\frac{b}{a}`, String.raw`\left(\frac{ab}{ab}\right)^5`],
      answer: 2, rule: 'power-quotient',
      explanation: String.raw`Expand the powers to get \(a^2b^3/(b^2a^3)\). Two factors of each base cancel, leaving \(b/a\). The reciprocal bases cannot be treated as identical bases.`
    },
    {
      prompt: 'Which expression equals this for every real number x?',
      math: String.raw`(-2x)^4`,
      options: [String.raw`-16x^4`, String.raw`16x^4`, String.raw`-8x^4`, String.raw`16x`],
      answer: 1, rule: 'power-product',
      explanation: String.raw`The parentheses include the negative sign: \((-2x)^4=(-2)^4x^4=16x^4\). Four negative factors have a positive product.`
    },
    {
      prompt: 'Which statement gives both the simplified expression and exactly the domain of the original expression?',
      math: String.raw`\frac{(x^3y)^2}{xy^2}`,
      options: [
        String.raw`\(x^5\), for all real x and y.`,
        String.raw`\(x^5\), provided only that \(x\ne0\).`,
        String.raw`\(x^5\), provided only that \(y\ne0\).`,
        String.raw`\(x^5\), provided that \(x\ne0\) and \(y\ne0\).`
      ],
      textOptions: true, answer: 3, rule: 'quotient',
      explanation: String.raw`The numerator is \(x^6y^2\), so cancellation gives \(x^5\). But the original denominator \(xy^2\) is zero if either variable is zero. Simplifying does not restore excluded inputs.`
    },
    {
      prompt: 'Write the result as a single power of 3.',
      math: String.raw`\frac{9^3\cdot3^4}{27^2}`,
      options: [String.raw`3^4`, String.raw`3^5`, String.raw`3^7`, String.raw`3^{10}`],
      answer: 0, rule: 'product',
      explanation: String.raw`First rewrite every base: \(9^3=(3^2)^3=3^6\) and \(27^2=(3^3)^2=3^6\). Now the bases match: \(3^{6+4-6}=3^4\).`
    },
    {
      prompt: 'Which identity holds for every nonzero real number a and all positive integers m and n?',
      math: String.raw`\frac{(a^m a^n)^2}{(a^m)^2}`,
      options: [String.raw`a^{2n}`, String.raw`a^{n^2}`, String.raw`a^{2m+n}`, String.raw`a^{2n-2m}`],
      answer: 0, rule: 'power-power',
      explanation: String.raw`The numerator is \(a^{2(m+n)}\) and the denominator is \(a^{2m}\). Subtract the entire denominator exponent: \(2(m+n)-2m=2n\).`
    }
  ];
  // Explicit spoken labels keep mathematical choices accessible after SVG typesetting.
  const spokenOptions = [
    ['x cubed', 'x to the fifth power', 'x to the ninth power', 'x to the nineteenth power'],
    ['a times b, to the eleventh power', 'a times b, to the fourth power, times b cubed', 'a times b, to the seventh power, times a cubed', 'a times b, to the twenty-eighth power'],
    ['2 times x to the ninth, over y to the sixth', '8 times x to the sixth, over y to the fifth', '8 times x to the ninth, over y to the sixth', '8 times x to the ninth, over y squared'],
    ['a to the fifth power', '2 times a to the fifth power', 'a to the sixth power', 'a squared times the quantity a plus 1'],
    questions[4].options,
    ['a over b', '1', 'b over a', 'the fraction a b over a b, raised to the fifth power'],
    ['negative 16 times x to the fourth', '16 times x to the fourth', 'negative 8 times x to the fourth', '16 times x'],
    ['x to the fifth, for all real x and y', 'x to the fifth, provided only that x is nonzero', 'x to the fifth, provided only that y is nonzero', 'x to the fifth, provided that both x and y are nonzero'],
    ['3 to the fourth power', '3 to the fifth power', '3 to the seventh power', '3 to the tenth power'],
    ['a to the power 2 n', 'a to the power n squared', 'a to the power 2 m plus n', 'a to the power 2 n minus 2 m']
  ];
  let index = 0;
  let answers = [];
  let typesetting = Promise.resolve();
  const stage = root.querySelector('.quiz-stage');
  const progress = root.querySelector('.quiz-progress');
  const status = root.querySelector('.quiz-status');
  const math = value => `\\(${value}\\)`;
  function typeset() {
    if (!window.MathJax?.typesetPromise) return;
    typesetting = typesetting.then(() => window.MathJax.startup.promise)
      .then(() => window.MathJax.typesetPromise([root])).catch(() => {});
  }
  function clearMath() {
    window.MathJax?.typesetClear?.([stage]);
  }
  function showQuestion(focus = false) {
    clearMath();
    const q = questions[index];
    progress.textContent = `Question ${index + 1} / ${questions.length}`;
    status.textContent = '';
    stage.innerHTML = `
      <form class="quiz-form">
        <fieldset>
          <legend tabindex="-1">${q.prompt}</legend>
          <div class="math">\\[${q.math}\\]</div>
          <div class="quiz-options">${q.options.map((option, i) => `
            <label class="quiz-option">
              <input type="radio" name="answer" value="${i}" aria-label="${spokenOptions[index][i]}" required>
              <span>${q.textOptions ? option : math(option)}</span>
            </label>`).join('')}
          </div>
        </fieldset>
        <button class="quiz-action" type="submit">Check answer</button>
      </form>
      <div class="quiz-feedback" hidden></div>
      <button class="quiz-action quiz-next" type="button" hidden>${index === questions.length - 1 ? 'See results' : 'Next question →'}</button>`;
    stage.querySelector('form').addEventListener('submit', checkAnswer);
    stage.querySelector('.quiz-next').addEventListener('click', () => {
      index++;
      if (index === questions.length) showResults();
      else showQuestion(true);
    });
    typeset();
    if (focus) stage.querySelector('legend').focus();
  }
  function checkAnswer(event) {
    event.preventDefault();
    if (answers[index] !== undefined) return;
    const q = questions[index];
    const form = event.currentTarget;
    const selected = Number(new FormData(form).get('answer'));
    answers[index] = selected;
    const correct = selected === q.answer;
    const feedback = stage.querySelector('.quiz-feedback');
    feedback.innerHTML = `<p><strong>${correct ? 'Correct.' : 'Not quite.'}</strong> ${q.explanation}</p>`;
    feedback.hidden = false;
    form.querySelectorAll('input').forEach(input => { input.disabled = true; });
    const labels = stage.querySelectorAll('.quiz-option');
    labels[q.answer].classList.add('is-correct');
    if (!correct) labels[selected].classList.add('is-incorrect');
    form.querySelector('button').hidden = true;
    stage.querySelector('.quiz-next').hidden = false;
    status.textContent = correct ? 'Correct. Explanation below the answers.' : 'Not quite. The correct answer is marked. Explanation below the answers.';
    typeset();
    stage.querySelector('.quiz-next').focus();
  }
  function showResults() {
    clearMath();
    const missed = questions.map((q, i) => ({ ...q, number: i + 1, selected: answers[i] }))
      .filter(q => q.selected !== q.answer);
    const score = questions.length - missed.length;
    progress.textContent = 'Complete';
    status.textContent = `Quiz complete. ${score} out of ${questions.length} correct.`;
    stage.innerHTML = `<h3 class="quiz-result" tabindex="-1">${score} / ${questions.length}</h3>
      <p>${score === 10 ? 'You handled all five laws, their conditions, and the common traps.' : 'Review the questions you missed, then try the ten questions again.'}</p>
      ${missed.map(q => `<details class="quiz-review"><summary>Question ${q.number} · review</summary>
        <p>${q.prompt}</p><div class="math">\\[${q.math}\\]</div>
        <p>Your answer: ${q.textOptions ? q.options[q.selected] : math(q.options[q.selected])}</p>
        <p>Correct answer: ${q.textOptions ? q.options[q.answer] : math(q.options[q.answer])}</p>
        <p>${q.explanation}</p><a class="inline" href="#${q.rule}">Revisit the law ↑</a></details>`).join('')}
      <button class="quiz-action quiz-restart" type="button">Try again</button>`;
    stage.querySelector('.quiz-restart').addEventListener('click', () => {
      index = 0;
      answers = [];
      showQuestion(true);
    });
    typeset();
    stage.querySelector('.quiz-result').focus();
  }
  showQuestion();
})();
