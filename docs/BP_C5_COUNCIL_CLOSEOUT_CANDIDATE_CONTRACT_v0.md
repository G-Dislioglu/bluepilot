# BP-C5 Council Closeout Candidate Contract v0

Datum: 2026-05-29
Status: BP-119 implementation contract
Phase: BP-C5

## Ziel

Council Closeout Candidate bewertet einen BP-116 Session Report als Abschlussvorschlag.

## Input

Erlaubt:

- `--report <path>` liest einen Council Session Report.
- `--out <path>` schreibt optional ein JSON Candidate-Artefakt.

## Output

Das Tool gibt JSON aus:

- `tool`: `council-closeout-candidate`
- `candidate_status`
- `can_auto_close`: false
- `blocking_reasons`
- `review_reasons`
- `next_actions`

## Harte Grenze

Das Tool schliesst keine Session. Es schreibt weder `session.json` noch `events.jsonl`.

## Naechster Schritt

BP-120 kann daraus ein Operator Handoff rendern.
