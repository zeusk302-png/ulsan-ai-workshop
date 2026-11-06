"""Independently verify published synthetic large-data files, without importing their generator."""
from pathlib import Path
from collections import Counter
import csv
import json
import math
import time
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public/automation'
ARTIFACTS = ROOT / 'artifacts/automation-volume-2026-11-06'


def evaluate(rows):
    seen = set()
    clean = []
    for seq, round_id, identifier, program, attendance, score in rows:
        identifier = str(identifier or '').strip().upper()
        attendance = str(attendance or '').strip().upper()
        key = (round_id, identifier)
        if not identifier:
            status, reason = '제외', 'ID 누락'
        elif key in seen:
            status, reason = '제외', '후속 중복'
        elif attendance not in ('Y', 'N'):
            status, reason = '보류', '참여여부'
        else:
            status, reason = '채택', '기준 충족'
        if identifier:
            seen.add(key)
        valid = int(status == '채택')
        participated = int(valid and attendance == 'Y')
        response = int(participated and isinstance(score, (int, float)) and not isinstance(score, bool) and 1 <= score <= 5 and score == int(score))
        clean.append([seq, round_id, identifier, program, attendance, score, status, reason, valid, participated, response, score if response else 0])
    valid = sum(row[8] for row in clean)
    participants = sum(row[9] for row in clean)
    responses = sum(row[10] for row in clean)
    points = sum(row[11] for row in clean)
    metrics = dict(rawRows=len(rows), validApplicants=valid, participants=participants,
                   participationRate=participants / valid if valid else None,
                   validResponses=responses, scoreSum=points,
                   satisfactionMean=points / responses if responses else None,
                   excludedRows=sum(row[6] == '제외' for row in clean),
                   heldRows=sum(row[6] == '보류' for row in clean),
                   programParticipants=dict(Counter(row[3] for row in clean if row[9])))
    return metrics, clean


def compare_metrics(actual, expected):
    for key, value in actual.items():
        if isinstance(value, float):
            assert math.isclose(value, expected[key], rel_tol=1e-12), (key, value, expected[key])
        else:
            assert value == expected[key], (key, value, expected[key])


def main():
    started = time.perf_counter()
    expected = json.loads((PUBLIC / 'checks/expected-values.json').read_text(encoding='utf-8'))
    results = []
    cleaned_round_one = None
    for name in ['round-01', 'round-02']:
        book = load_workbook(PUBLIC / f'data/{name}.xlsx', read_only=True, data_only=True)
        rows = list(book['원본'].values)[1:]
        assert len(rows) == 10000, (name, len(rows))
        assert [row[0] for row in rows] == list(range(1, 10001))
        assert len({row[1] for row in rows}) == 1
        metrics, clean = evaluate(rows)
        compare_metrics(metrics, expected[name])
        assert metrics['rawRows'] == metrics['validApplicants'] + metrics['excludedRows'] + metrics['heldRows']
        assert sum(metrics['programParticipants'].values()) == metrics['participants']
        book.close()
        if name == 'round-01':
            cleaned_round_one = clean
        results.append(dict(dataset=name, **metrics, result='PASS'))

    solved = load_workbook(PUBLIC / 'examples/round-01-summary.xlsx', read_only=True, data_only=True)
    actual_clean = list(solved['정리'].values)[1:]
    assert len(actual_clean) == 10000
    for actual, independent in zip(actual_clean, cleaned_round_one):
        identity = list(actual[:5])
        identity[2] = identity[2] or ''  # An empty Excel text cell is read as None.
        assert identity == independent[:5], ('normalized identity', actual[0])
        assert actual[6] == independent[6], ('status', actual[0])
        assert list(actual[8:12]) == independent[8:12], ('cached indicators', actual[0])
    cached = [solved['요약'][f'B{row}'].value for row in [5, 6, 7, 8, 9, 10, 11, 12, 13]]
    metrics = expected['round-01']
    values = [metrics[k] for k in ['rawRows', 'validApplicants', 'participants', 'participationRate', 'validResponses', 'scoreSum', 'satisfactionMean', 'excludedRows', 'heldRows']]
    assert all(a == b or isinstance(a, (int, float)) and isinstance(b, (int, float)) and math.isclose(a, b, rel_tol=1e-12) for a, b in zip(cached, values)), cached
    solved.close()

    grouped = {}
    extension = PUBLIC / 'data/extension-100000.csv'
    assert extension.read_bytes().startswith(b'\xef\xbb\xbf'), 'UTF-8 BOM required for classroom Excel import'
    with extension.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.reader(handle)
        assert len(next(reader)) == 6
        count = 0
        for seq, rnd, identifier, program, attendance, score in reader:
            count += 1
            if not score:
                score = None
            else:
                try:
                    score = float(score)
                except ValueError:
                    pass
            grouped.setdefault(rnd, []).append([int(seq), rnd, identifier, program, attendance, score])
    assert count == 100000 and len(grouped) == 10, (count, len(grouped))
    assert all(len(rows) == 10000 for rows in grouped.values())
    extension_metrics = {rnd: evaluate(rows)[0] for rnd, rows in grouped.items()}
    # The same ID in different rounds must not be discarded by a global-ID deduplication rule.
    combined = [row for rows in grouped.values() for row in rows]
    combined_metrics, _ = evaluate(combined)
    for key in ['validApplicants', 'participants', 'validResponses', 'scoreSum', 'excludedRows', 'heldRows']:
        assert combined_metrics[key] == sum(m[key] for m in extension_metrics.values()), key
    report = dict(status='PASS', datasets=results, solvedRowsCompared=10000,
                  extension=dict(rows=count, rounds=len(grouped), roundMetrics=extension_metrics, compoundKeyCheck='PASS'),
                  verificationSeconds=round(time.perf_counter() - started, 3),
                  scope='Independent local file parsing, full-row accounting and cached-value checks; not an external AI or classroom speed measurement')
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / 'independent-data-checks.json').write_bytes(json.dumps(report, ensure_ascii=False, indent=2).encode('utf-8'))
    print(json.dumps({k: v for k, v in report.items() if k != 'datasets' and k != 'extension'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
