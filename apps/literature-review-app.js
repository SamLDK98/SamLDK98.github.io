(function () {
  const defaultPapers = window.literatureReviewPapers || [];
  const importedPapersKey = 'literature-review-keep-reject:imported-papers:v1';
  const storageKeyPrefix = 'literature-review-keep-reject:decisions:';
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
  const importToggleButton = document.getElementById('importToggleButton');
  const importPanel = document.getElementById('importPanel');
  const importFileInput = document.getElementById('importFileInput');
  const importStatusEl = document.getElementById('importStatus');

  let papers = loadImportedPapers() || defaultPapers;
  let activeStorageKey = getStorageKey(papers);
  let state = loadState();

  function loadImportedPapers() {
    try {
      const parsed = JSON.parse(localStorage.getItem(importedPapersKey) || 'null');
      if (!Array.isArray(parsed?.papers) || parsed.papers.length === 0) return null;
      return parsed.papers;
    } catch {
      return null;
    }
  }

  function getStorageKey(dataset) {
    const signature = dataset.map((paper) => paper.id).join('|');
    return `${storageKeyPrefix}${hashText(signature || 'empty')}`;
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(activeStorageKey) || '{}');
      const paperIds = new Set(papers.map((paper) => paper.id));
      const decisions = {};
      Object.entries(parsed.decisions || {}).forEach(([id, decision]) => {
        if (validDecisions.has(decision) && paperIds.has(id)) {
          decisions[id] = decision;
        }
      });

      const history = (parsed.history || []).filter((id) => decisions[id] && paperIds.has(id));
      const currentId = paperIds.has(parsed.currentId) ? parsed.currentId : null;

      return { decisions, history, currentId };
    } catch {
      return { decisions: {}, history: [], currentId: null };
    }
  }

  function saveState() {
    localStorage.setItem(activeStorageKey, JSON.stringify(state));
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
    return `Keep ${counts.keep} / Maybe ${counts.maybe} / Reject ${counts.reject}`;
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
      metaEl.textContent = total ? 'All available papers have a decision.' : '';
      abstractEl.textContent = total
        ? 'Use Export CSV to download the decisions, Back / Undo to revisit the last paper, or Reset to start over.'
        : 'Import a JSON or CSV file to begin screening.';
      abstractEl.classList.add('empty-state');
      return;
    }

    state.currentId = paper.id;
    saveState();

    titleEl.textContent = paper.title || 'Untitled paper';
    metaEl.textContent = [paper.journal, paper.year].filter(Boolean).join(' / ');
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
      .map((paper) => [
        paper.id,
        paper.title,
        paper.doi,
        paper.pmid,
        paper.nctId,
        paper.journal,
        paper.year,
        state.decisions[paper.id],
      ]);
    const csv = [['id', 'title', 'doi', 'pmid', 'nctId', 'journal', 'year', 'decision'], ...rows]
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

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(field);
        field = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i += 1;
        row.push(field);
        if (row.some((value) => value.trim() !== '')) rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }

    row.push(field);
    if (row.some((value) => value.trim() !== '')) rows.push(row);
    if (inQuotes) throw new Error('CSV has an unclosed quoted field.');
    if (rows.length < 2) throw new Error('CSV needs a header row and at least one data row.');

    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((values) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] ?? '';
      });
      return record;
    });
  }

  function parseJson(text) {
    const parsed = JSON.parse(text);
    const records = Array.isArray(parsed)
      ? parsed
      : parsed.papers || parsed.records || parsed.items || parsed.data;

    if (!Array.isArray(records)) {
      throw new Error('JSON must be an array, or an object with a papers, records, items, or data array.');
    }
    return records;
  }

  function normalizeRecords(records) {
    const usedIds = new Map();
    let skipped = 0;

    const normalized = records.reduce((items, record, index) => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        skipped += 1;
        return items;
      }

      const title = getField(record, ['title', 'paperTitle', 'articleTitle']);
      const doi = getField(record, ['doi', 'digitalObjectIdentifier']);
      const pmid = getField(record, ['pmid', 'pubmedId', 'pubmed']);
      const nctId = getField(record, ['nctId', 'nct', 'clinicalTrialId', 'clinicalTrialsId']);
      const explicitId = getField(record, ['id', 'paperId', 'recordId']);
      const baseId = explicitId || doi || pmid || nctId;

      if (!title || !baseId) {
        skipped += 1;
        return items;
      }

      const id = uniqueId(String(baseId).trim(), usedIds);
      items.push({
        id,
        title,
        abstract: getField(record, ['abstract', 'summary', 'description']),
        journal: getField(record, ['journal', 'source', 'publication', 'status']),
        year: getField(record, ['year', 'publicationYear', 'date']),
        doi,
        pmid,
        nctId,
        clinicalTrialsUrl: getField(record, ['clinicalTrialsUrl', 'clinicalTrialUrl', 'url']),
        importRow: index + 1,
      });
      return items;
    }, []);

    if (normalized.length === 0) {
      throw new Error('No valid records found. Each record needs title and either id, doi, pmid, or nctId.');
    }

    return { papers: normalized, skipped };
  }

  function normalizeKey(key) {
    return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function getField(record, candidates) {
    const entries = Object.entries(record);
    for (const candidate of candidates) {
      const normalizedCandidate = normalizeKey(candidate);
      const match = entries.find(([key]) => normalizeKey(key) === normalizedCandidate);
      if (match) {
        const value = match[1];
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
    }
    return '';
  }

  function uniqueId(baseId, usedIds) {
    const count = usedIds.get(baseId) || 0;
    usedIds.set(baseId, count + 1);
    return count === 0 ? baseId : `${baseId}-${count + 1}`;
  }

  function hashText(text) {
    let hash = 5381;
    for (let i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) + hash) + text.charCodeAt(i);
      hash &= 0xffffffff;
    }
    return Math.abs(hash).toString(36);
  }

  function setImportStatus(message, isError = false) {
    importStatusEl.textContent = message;
    importStatusEl.classList.toggle('error', isError);
  }

  function loadImportedDataset(importedPapers, fileName) {
    papers = importedPapers;
    activeStorageKey = getStorageKey(papers);
    state = loadState();
    if (!state.currentId) state.currentId = papers[0]?.id || null;

    try {
      localStorage.setItem(importedPapersKey, JSON.stringify({
        fileName,
        importedAt: new Date().toISOString(),
        papers,
      }));
    } catch {
      setImportStatus('Imported for this session, but the file was too large to save in this browser.', true);
      render();
      return false;
    }

    render();
    return true;
  }

  function handleImportFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const records = file.name.toLowerCase().endsWith('.json') ? parseJson(text) : parseCsv(text);
        const result = normalizeRecords(records);
        const saved = loadImportedDataset(result.papers, file.name);
        const skippedText = result.skipped ? ` ${result.skipped} invalid record(s) skipped.` : '';
        if (saved) {
          setImportStatus(`Imported ${result.papers.length} paper(s) from ${file.name}.${skippedText}`);
        }
      } catch (error) {
        setImportStatus(error.message || 'Import failed.', true);
      } finally {
        importFileInput.value = '';
      }
    };
    reader.onerror = () => {
      setImportStatus('Could not read that file.', true);
      importFileInput.value = '';
    };
    reader.readAsText(file);
  }

  keepButton.addEventListener('click', () => decide('keep'));
  maybeButton.addEventListener('click', () => decide('maybe'));
  rejectButton.addEventListener('click', () => decide('reject'));
  undoButton.addEventListener('click', undoLastDecision);
  resetButton.addEventListener('click', resetDecisions);
  exportButton.addEventListener('click', exportCsv);
  importToggleButton.addEventListener('click', () => {
    importPanel.hidden = !importPanel.hidden;
    importToggleButton.setAttribute('aria-expanded', String(!importPanel.hidden));
  });
  importFileInput.addEventListener('change', (event) => {
    handleImportFile(event.target.files?.[0]);
  });

  render();
})();
