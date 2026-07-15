#!/usr/bin/env python3
"""
Download open-access PDFs for PubMed/DOI records from a literature review CSV.

Default input:
  C:/Users/samki/Downloads/literature-review-decisions-2026-06-25.csv

The script does not bypass paywalls. It tries open/legal routes first:
  - PubMed PMID -> PMC open-access PDF via the NCBI ID converter
  - DOI landing pages where a public PDF link is exposed
  - direct PDF URLs if present in the input

It writes downloaded PDFs plus a CSV manifest describing successes/failures.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, urljoin, urlparse
from urllib.request import Request, urlopen

try:
    import openpyxl
except ImportError:  # Optional; CSV input does not need it.
    openpyxl = None


DEFAULT_INPUT = Path("C:/Users/samki/Downloads/literature-review-decisions-2026-06-25.csv")
DEFAULT_OUTPUT_DIR = Path("C:/Users/samki/literature/eeg_meg_gaba/medline")
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 literature-review-pdf-downloader/1.0 "
    "(open-access scholarly PDF resolver)"
)

PMID_RE = re.compile(r"\bPMID:?\s*(\d{6,9})\b", re.IGNORECASE)
PMCID_RE = re.compile(r"\bPMC\d+\b", re.IGNORECASE)
DOI_RE = re.compile(r"\b10\.\d{4,9}/[^\s\"'<>]+", re.IGNORECASE)
HREF_RE = re.compile(r"""href=["']([^"']+)["']""", re.IGNORECASE)
PDF_HREF_RE = re.compile(r"""href=["']([^"']+\.pdf(?:\?[^"']*)?)["']""", re.IGNORECASE)


@dataclass
class Record:
    row_number: int
    pmid: str = ""
    doi: str = ""
    decision: str = ""
    title: str = ""
    urls: list[str] = field(default_factory=list)
    pmcids: list[str] = field(default_factory=list)


@dataclass
class DownloadResult:
    record: Record
    status: str
    pdf_path: str = ""
    source_url: str = ""
    notes: str = ""


def main() -> int:
    args = parse_args()
    records = load_records(args.input, args.sheet)
    records = filter_records(records, args.decisions)
    if args.limit:
        records = records[: args.limit]

    args.output.mkdir(parents=True, exist_ok=True)
    results: list[DownloadResult] = []

    for index, record in enumerate(records, start=1):
        label = record.pmid or record.doi or record.title[:80]
        print(f"[{index}/{len(records)}] {label} ({record.decision or 'no decision'})")
        result = process_record(record, args)
        results.append(result)
        print(f"  {result.status}: {result.notes or result.source_url}")
        if args.sleep:
            time.sleep(args.sleep)

    manifest_path = args.output / "download_manifest.csv"
    write_manifest(manifest_path, results)
    print(f"\nWrote manifest: {manifest_path}")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download open-access PDFs for rows with PMID/DOI identifiers."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="CSV or XLSX file to read.")
    parser.add_argument("--sheet", default="", help="XLSX sheet name. Defaults to the active sheet.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument(
        "--decisions",
        nargs="*",
        default=None,
        help="Optional decision filter, e.g. --decisions keep maybe. Defaults to all rows.",
    )
    parser.add_argument("--limit", type=int, default=0, help="Process only the first N matching rows.")
    parser.add_argument("--dry-run", action="store_true", help="Resolve candidates without writing PDFs.")
    parser.add_argument("--overwrite", action="store_true", help="Replace existing PDFs.")
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--sleep", type=float, default=0.3, help="Seconds to wait between records.")
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    return parser.parse_args()


def load_records(input_path: Path, sheet_name: str = "") -> list[Record]:
    suffix = input_path.suffix.lower()
    if suffix == ".csv":
        return load_csv_records(input_path)
    if suffix in {".xlsx", ".xlsm"}:
        return load_xlsx_records(input_path, sheet_name)
    raise SystemExit(f"Unsupported input type: {input_path.suffix}. Use .csv or .xlsx.")


def load_csv_records(input_path: Path) -> list[Record]:
    with input_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        return [record_from_mapping(row, row_number=index) for index, row in enumerate(reader, start=2)]


def load_xlsx_records(input_path: Path, sheet_name: str) -> list[Record]:
    if openpyxl is None:
        raise SystemExit("openpyxl is required for .xlsx input. Install it or export the sheet to CSV.")

    workbook = openpyxl.load_workbook(input_path, read_only=True, data_only=True)
    sheet = workbook[sheet_name] if sheet_name else workbook.active
    rows = sheet.iter_rows(values_only=True)
    headers = [str(value or "").strip() for value in next(rows)]

    records: list[Record] = []
    for row_number, values in enumerate(rows, start=2):
        mapping = {header: values[index] if index < len(values) else "" for index, header in enumerate(headers)}
        records.append(record_from_mapping(mapping, row_number=row_number))
    return records


def record_from_mapping(mapping: dict[str, object], row_number: int) -> Record:
    normalized = {normalize_header(key): stringify(value) for key, value in mapping.items()}
    pmid = first_value(normalized, "pmid", "pubmed id", "pubmed_id")
    doi = clean_doi(first_value(normalized, "doi", "article doi", "digital object identifier"))
    decision = first_value(normalized, "decision", "screening decision", "status").lower()
    title = first_value(normalized, "title", "article title", "paper title")

    text_blob = "\n".join(value for value in normalized.values() if value)
    urls = unique(extract_urls(text_blob))
    pmcids = unique(extract_pmcids(text_blob))

    if not pmid:
        pmids = extract_pmids(text_blob)
        pmid = pmids[0] if pmids else ""
    if not doi:
        dois = extract_dois(text_blob)
        doi = dois[0] if dois else ""

    return Record(row_number=row_number, pmid=pmid, doi=doi, decision=decision, title=title, urls=urls, pmcids=pmcids)


def filter_records(records: list[Record], decisions: list[str] | None) -> list[Record]:
    if decisions is None:
        return records
    allowed = {decision.lower() for decision in decisions}
    return [record for record in records if record.decision.lower() in allowed]


def process_record(record: Record, args: argparse.Namespace) -> DownloadResult:
    output_path = args.output / f"{safe_filename(record.pmid or record.doi or record.title)}.pdf"
    if output_path.exists() and not args.overwrite:
        return DownloadResult(record, "exists", str(output_path), notes="PDF already exists.")

    candidates = discover_pdf_candidates(record, args)
    if not candidates:
        return DownloadResult(record, "not_found", notes="No open-access PDF candidate found.")

    if args.dry_run:
        return DownloadResult(record, "dry_run", source_url=candidates[0], notes=f"{len(candidates)} candidate(s)")

    for candidate in candidates:
        try:
            if download_pdf(candidate, output_path, args):
                return DownloadResult(record, "downloaded", str(output_path), candidate)
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            print(f"  candidate failed: {candidate} ({error})")

    return DownloadResult(
        record,
        "failed",
        notes=f"Tried {len(candidates)} candidate(s), but none returned a valid PDF.",
    )


def discover_pdf_candidates(record: Record, args: argparse.Namespace) -> list[str]:
    candidates: list[str] = []

    for pmcid in record.pmcids:
        candidates.extend(pmc_pdf_candidates(pmcid))

    if record.pmid:
        for pmcid in pmids_to_pmcids([record.pmid], args):
            candidates.extend(pmc_pdf_candidates(pmcid))

    if record.doi:
        candidates.extend(url_pdf_candidates(f"https://doi.org/{quote(record.doi, safe='/')}", args))

    for url in record.urls:
        candidates.extend(url_pdf_candidates(url, args))

    return unique(candidates)


def pmids_to_pmcids(pmids: Iterable[str], args: argparse.Namespace) -> list[str]:
    ids = ",".join(pmid for pmid in pmids if pmid)
    if not ids:
        return []

    url = f"https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids={quote(ids)}&format=json"
    try:
        payload = json.loads(fetch_text(url, args))
    except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError):
        return []
    return unique(record.get("pmcid", "") for record in payload.get("records", []) if record.get("pmcid"))


def pmc_pdf_candidates(pmcid: str) -> list[str]:
    pmcid = pmcid.upper()
    return [
        f"https://europepmc.org/articles/{pmcid}?pdf=render",
        f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/pdf/",
        f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/pdf/",
    ]


def url_pdf_candidates(url: str, args: argparse.Namespace) -> list[str]:
    if is_blocked_source(url):
        return []
    if looks_like_pdf_url(url):
        return [url]

    parsed = urlparse(url)
    if parsed.netloc.endswith("pubmed.ncbi.nlm.nih.gov"):
        pmid = parsed.path.strip("/").split("/")[0]
        if pmid.isdigit():
            return [candidate for pmcid in pmids_to_pmcids([pmid], args) for candidate in pmc_pdf_candidates(pmcid)]

    try:
        html = fetch_text(url, args, max_bytes=2_000_000)
    except (HTTPError, URLError, TimeoutError, OSError, UnicodeDecodeError):
        return []

    candidates = [urljoin(url, href) for href in PDF_HREF_RE.findall(html)]
    for href in HREF_RE.findall(html):
        absolute = urljoin(url, href)
        if "pdf" in absolute.lower() and not is_blocked_source(absolute):
            candidates.append(absolute)
    return unique(candidates)


def download_pdf(url: str, output_path: Path, args: argparse.Namespace) -> bool:
    if is_blocked_source(url):
        return False

    request = Request(url, headers={"User-Agent": args.user_agent, "Accept": "application/pdf,*/*"})
    with urlopen(request, timeout=args.timeout) as response:
        content_type = response.headers.get("Content-Type", "").lower()
        data = response.read()

    if "pdf" not in content_type and not data.startswith(b"%PDF"):
        return False

    output_path.write_bytes(data)
    return True


def fetch_text(url: str, args: argparse.Namespace, max_bytes: int = 5_000_000) -> str:
    request = Request(url, headers={"User-Agent": args.user_agent, "Accept": "text/html,application/json,*/*"})
    with urlopen(request, timeout=args.timeout) as response:
        data = response.read(max_bytes)
        encoding = response.headers.get_content_charset() or "utf-8"
    return data.decode(encoding, errors="replace")


def write_manifest(path: Path, results: list[DownloadResult]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "status",
                "pmid",
                "doi",
                "decision",
                "title",
                "pdf_path",
                "source_url",
                "pmcids",
                "notes",
            ],
        )
        writer.writeheader()
        for result in results:
            record = result.record
            writer.writerow(
                {
                    "status": result.status,
                    "pmid": record.pmid,
                    "doi": record.doi,
                    "decision": record.decision,
                    "title": record.title,
                    "pdf_path": result.pdf_path,
                    "source_url": result.source_url,
                    "pmcids": "; ".join(record.pmcids),
                    "notes": result.notes,
                }
            )


def normalize_header(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").strip().lower()).strip()


def stringify(value: object) -> str:
    return "" if value is None else str(value).strip()


def first_value(mapping: dict[str, str], *keys: str) -> str:
    for key in keys:
        value = mapping.get(normalize_header(key), "")
        if value:
            return value
    return ""


def extract_pmids(text: str) -> list[str]:
    values = PMID_RE.findall(text or "")
    for url in extract_urls(text):
        parsed = urlparse(url)
        if parsed.netloc.endswith("pubmed.ncbi.nlm.nih.gov"):
            candidate = parsed.path.strip("/").split("/")[0]
            if candidate.isdigit():
                values.append(candidate)
    return unique(values)


def extract_pmcids(text: str) -> list[str]:
    return [match.upper() for match in PMCID_RE.findall(text or "")]


def extract_dois(text: str) -> list[str]:
    return [clean_doi(match) for match in DOI_RE.findall(text or "")]


def clean_doi(value: str) -> str:
    value = (value or "").strip()
    value = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", value, flags=re.IGNORECASE)
    return value.rstrip(").,;]")


def extract_urls(text: str) -> list[str]:
    return re.findall(r"https?://[^\s\"'<>]+", text or "")


def looks_like_pdf_url(url: str) -> bool:
    parsed = urlparse(url)
    path = parsed.path.lower()
    query = parse_qs(parsed.query.lower())
    return path.endswith(".pdf") or "pdf" in query.get("format", [])


def is_blocked_source(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return "sci-hub" in host or "libgen" in host


def safe_filename(value: str) -> str:
    filename = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())[:120]
    return filename.strip("._") or "record"


def unique(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if not value:
            continue
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


if __name__ == "__main__":
    raise SystemExit(main())
