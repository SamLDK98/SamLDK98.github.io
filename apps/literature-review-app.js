(function () {
  const papers = window.literatureReviewPapers || [];
  const storageKey = 'literature-review-keep-reject:manual-core:v1';
  const validDecisions = new Set(['keep', 'reject', 'maybe']);

  const titleEl = document.getElementById('paper-title');
  const metaEl = document.getElementById('paperMeta');
  const abstractEl = document.getElementById('abstractBox');
  const progressTextEl = document.getElementById('progressText');
  const decisionSummaryEl = document.getElementById('decisionSummary');
  const progressBarEl = document.getElementById('progressBar');
  const keepButton = document.getElementById('keepButton');
  const maybeButton = document.getElementById('maybeButton');
  const rejectButton = document.getElementById('rejectButton');
  const undoButton = document.getElementById('undoButton');
  const exportButton = document.getElementById('exportButton');
  const resetButton = document.getElementById('resetButton');

  let state = loadState();

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const decisions = {};
      Object.entries(parsed.decisions || {}).forEach(([id, decision]) => {
        if (validDecisions.has(decision) && papers.some((paper) => paper.id === id)) {
          decisions[id] = decision;
        }
      });

      const history = (parsed.history || []).filter((id) => decisions[id] && papers.some((paper) => paper.id === id));
      const currentId = papers.some((paper) => paper.id === parsed.currentId) ? parsed.currentId : null;

      return { decisions, history, currentId };
    } catch {
      return { decisions: {}, history: [], currentId: null };
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function getCurrentPaper() {
    const current = papers.find((paper) => paper.id === state.currentId && !state.decisions[paper.id]);
    if (current) return current;

    return papers.find((paper) => !state.decisions[paper.id]) || null;
  }

  function getNextPaperAfter(paper) {
    if (!paper) return null;
    const startIndex = papers.findIndex((candidate) => candidate.id === paper.id);
    const later = papers.slice(startIndex + 1).find((candidate) => !state.decisions[candidate.id]);
    return later || papers.find((candidate) => !state.decisions[candidate.id]) || null;
  }

  function summarizeDecisions() {
    const counts = { keep: 0, maybe: 0, reject: 0 };
    Object.values(state.decisions).forEach((decision) => {
      counts[decision] += 1;
    });
    return `Keep ${counts.keep} · Maybe ${counts.maybe} · Reject ${counts.reject}`;
  }

  function render() {
    const paper = getCurrentPaper();
    const decidedCount = Object.keys(state.decisions).length;
    const total = papers.length;
    const displayedProgress = paper ? Math.min(decidedCount + 1, total) : total;

    progressTextEl.textContent = `${displayedProgress} / ${total}`;
    decisionSummaryEl.textContent = total ? summarizeDecisions() : 'No papers loaded';
    progressBarEl.style.width = total ? `${(decidedCount / total) * 100}%` : '0%';

    undoButton.disabled = state.history.length === 0;
    exportButton.disabled = total === 0;
    resetButton.disabled = decidedCount === 0;
    keepButton.disabled = !paper;
    maybeButton.disabled = !paper;
    rejectButton.disabled = !paper;

    if (!paper) {
      titleEl.textContent = total ? 'Screening complete' : 'No papers loaded';
      metaEl.textContent = total ? 'All available core candidates have a decision.' : '';
      abstractEl.textContent = total
        ? 'Use Export CSV to download the decisions, Back / Undo to revisit the last paper, or Reset to start over.'
        : 'The paper data module did not load.';
      abstractEl.classList.add('empty-state');
      return;
    }

    state.currentId = paper.id;
    saveState();

    titleEl.textContent = paper.title || 'Untitled paper';
    metaEl.textContent = [paper.journal, paper.year].filter(Boolean).join(' · ');
    abstractEl.textContent = paper.abstract || 'No abstract available.';
    abstractEl.classList.remove('empty-state');
    abstractEl.scrollTop = 0;
  }

  function decide(decision) {
    const paper = getCurrentPaper();
    if (!paper) return;

    state.decisions[paper.id] = decision;
    state.history = state.history.filter((id) => id !== paper.id);
    state.history.push(paper.id);

    const nextPaper = getNextPaperAfter(paper);
    state.currentId = nextPaper ? nextPaper.id : null;
    saveState();
    render();
  }

  function undoLastDecision() {
    const previousId = state.history.pop();
    if (!previousId) return;

    delete state.decisions[previousId];
    state.currentId = previousId;
    saveState();
    render();
  }

  function resetDecisions() {
    if (!confirm('Reset all literature-review decisions?')) return;
    state = { decisions: {}, history: [], currentId: papers[0]?.id || null };
    saveState();
    render();
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function exportCsv() {
    const rows = papers
      .filter((paper) => state.decisions[paper.id])
      .map((paper) => [paper.pmid, paper.doi, state.decisions[paper.id]]);
    const csv = [['PMID', 'DOI', 'Decision'], ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `literature-review-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  keepButton.addEventListener('click', () => decide('keep'));
  maybeButton.addEventListener('click', () => decide('maybe'));
  rejectButton.addEventListener('click', () => decide('reject'));
  undoButton.addEventListener('click', undoLastDecision);
  resetButton.addEventListener('click', resetDecisions);
  exportButton.addEventListener('click', exportCsv);

  render();
})();
