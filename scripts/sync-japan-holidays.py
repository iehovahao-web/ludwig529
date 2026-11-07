#!/usr/bin/env python3
"""Build the site's deterministic Japanese holiday data from the Cabinet Office CSV."""

from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import urllib.request
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path


DEFAULT_URL = "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv"
SOURCE_PAGE = "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html"
DEFAULT_OUTPUT = Path("assets/data/japan-holidays-official.json")

NAME_TO_ID = {
    "元日": "newyear",
    "成人の日": "comingage",
    "建国記念の日": "foundation",
    "天皇誕生日": "emperor",
    "春分の日": "vernal",
    "昭和の日": "showa",
    "憲法記念日": "constitution",
    "みどりの日": "greenery",
    "こどもの日": "children",
    "海の日": "marine",
    "山の日": "mountain",
    "敬老の日": "respect",
    "秋分の日": "autumnal",
    "スポーツの日": "sports",
    "文化の日": "culture",
    "勤労感謝の日": "labor",
}
DAY_OFF_NAMES = {"休日", "振替休日", "国民の休日"}


@dataclass(frozen=True)
class SourceRow:
    day: date
    name: str


def decode_csv(payload: bytes) -> str:
    for encoding in ("cp932", "shift_jis", "utf-8-sig"):
        try:
            return payload.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("CSV is not valid Shift_JIS/CP932 or UTF-8")


def parse_date(value: str) -> date:
    normalized = value.strip().replace("-", "/")
    pieces = normalized.split("/")
    if len(pieces) != 3:
        raise ValueError(f"Unsupported date in Cabinet Office CSV: {value!r}")
    return date(*(int(piece) for piece in pieces))


def parse_rows(payload: bytes) -> list[SourceRow]:
    reader = csv.reader(io.StringIO(decode_csv(payload)))
    rows: list[SourceRow] = []
    for line_number, columns in enumerate(reader, start=1):
        if not columns or not any(column.strip() for column in columns):
            continue
        first = columns[0].lstrip("\ufeff").strip()
        if line_number == 1 and not first[:1].isdigit():
            continue
        if len(columns) < 2:
            raise ValueError(f"CSV row {line_number} has fewer than two columns")
        name = columns[1].strip()
        if not name:
            raise ValueError(f"CSV row {line_number} has an empty holiday name")
        rows.append(SourceRow(parse_date(first), name))
    if not rows:
        raise ValueError("Cabinet Office CSV contained no holiday rows")
    return rows


def classify_day_off(day: date, name: str, national_days: set[date]) -> tuple[str, str]:
    if name == "振替休日":
        return "substitute", "国民の祝日に関する法律第3条第2項"
    if name == "国民の休日":
        return "citizens", "国民の祝日に関する法律第3条第3項"
    if day - timedelta(days=1) in national_days and day + timedelta(days=1) in national_days:
        return "citizens", "国民の祝日に関する法律第3条第3項"

    cursor = day - timedelta(days=1)
    while cursor in national_days:
        if cursor.weekday() == 6:
            return "substitute", "国民の祝日に関する法律第3条第2項"
        cursor -= timedelta(days=1)
    raise ValueError(f"Could not classify statutory day off {day.isoformat()} ({name})")


def build_document(rows: list[SourceRow], from_year: int) -> dict:
    national_days = {row.day for row in rows if row.name not in DAY_OFF_NAMES}
    selected = [row for row in rows if row.day.year >= from_year]
    if not selected:
        raise ValueError(f"CSV has no rows from {from_year} onward")

    holidays = []
    for row in selected:
        if row.name in DAY_OFF_NAMES:
            holiday_id, basis = classify_day_off(row.day, row.name, national_days)
            kind = "statutory-day-off"
            official_name = "休日"
        else:
            try:
                holiday_id = NAME_TO_ID[row.name]
            except KeyError as error:
                raise ValueError(f"Unknown national holiday name {row.name!r} on {row.day}") from error
            basis = "国民の祝日に関する法律第2条"
            kind = "national-holiday"
            official_name = row.name
        holidays.append(
            {
                "date": row.day.isoformat(),
                "nameJa": official_name,
                "id": holiday_id,
                "kind": kind,
                "legalBasis": basis,
            }
        )

    holidays.sort(key=lambda item: item["date"])
    years = sorted({int(item["date"][:4]) for item in holidays})
    expected_ids = set(NAME_TO_ID.values())
    for year in years:
        actual_ids = {
            item["id"]
            for item in holidays
            if item["date"].startswith(f"{year}-") and item["kind"] == "national-holiday"
        }
        if actual_ids != expected_ids:
            missing = sorted(expected_ids - actual_ids)
            extra = sorted(actual_ids - expected_ids)
            raise ValueError(f"Year {year} is not a complete 16-holiday year; missing={missing}, extra={extra}")

    return {
        "schemaVersion": 1,
        "source": DEFAULT_URL,
        "sourcePage": SOURCE_PAGE,
        "sourceEncoding": "Shift_JIS / CP932",
        "coverage": {
            "from": f"{years[0]}-01-01",
            "through": f"{years[-1]}-12-31",
            "years": years,
        },
        "holidays": holidays,
    }


def read_source(input_path: Path | None, url: str) -> bytes:
    if input_path:
        return input_path.read_bytes()
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "ludwig529-holiday-sync/1.0 (+https://github.com/iehovahao-web/ludwig529)"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def write_if_changed(output: Path, document: dict) -> bool:
    rendered = json.dumps(document, ensure_ascii=False, indent=2) + "\n"
    if output.exists() and output.read_text(encoding="utf-8") == rendered:
        return False
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    temporary.write_text(rendered, encoding="utf-8", newline="\n")
    temporary.replace(output)
    return True


def arguments(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="Read a local Cabinet Office CSV instead of downloading")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--from-year", type=int, default=2026)
    parser.add_argument("--url", default=DEFAULT_URL)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = arguments(argv or sys.argv[1:])
    document = build_document(parse_rows(read_source(args.input, args.url)), args.from_year)
    changed = write_if_changed(args.output, document)
    state = "updated" if changed else "unchanged"
    print(f"{state}: {args.output} ({len(document['holidays'])} dates, {document['coverage']['years']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
