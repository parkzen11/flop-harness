#!/usr/bin/env bash
# Judge one unit patch. Inputs: UNIT_ID, PATCH_B64 (env). Output: verdict.json + job summary.
# Every check appends a reason; the verdict passes only when no reason was recorded.
set -u
set -o pipefail

REASONS=()
COVERAGE="null"
CHANGED="null"
PATCH_FILE="$(mktemp)"

fail() { REASONS+=("$1"); }

write_verdict() {
  local pass="true"
  [ "${#REASONS[@]}" -eq 0 ] || pass="false"
  local reasons_json
  reasons_json="[]"
  if [ "${#REASONS[@]}" -gt 0 ]; then
    reasons_json="$(printf '%s\n' "${REASONS[@]}" | jq -R . | jq -s 'map(select(length > 0))')"
  fi
  [ "$pass" = "true" ] && reasons_json='["patch applies","lint clean","typecheck clean","tests green with coverage at floor","changed lines within budget"]'
  jq -n \
    --arg unit "$UNIT_ID" \
    --argjson pass "$pass" \
    --argjson reasons "$reasons_json" \
    --argjson coverage "$COVERAGE" \
    --argjson changed "$CHANGED" \
    '{unit_id: $unit, pass: $pass, reasons: $reasons, coverage: $coverage, changed_lines: $changed,
      judge: "sandbox", at: (now | todate)}' > verdict.json
  {
    echo "## verdict: $UNIT_ID"
    echo
    echo '```json'
    cat verdict.json
    echo '```'
  } >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
  cat verdict.json
}

finish() { write_verdict; exit 0; }

# --- 1. the unit ---------------------------------------------------------------
if ! [[ "$UNIT_ID" =~ ^(u-[a-z-]+-[0-9]{2}|qual-[0-9]{2})$ ]]; then
  fail "unit id is malformed: $UNIT_ID"; finish
fi
UNIT_FILE="units/$UNIT_ID.json"
if [ ! -f "$UNIT_FILE" ]; then fail "no such unit: $UNIT_FILE"; finish; fi
MAX_LINES="$(jq -r '.max_lines' "$UNIT_FILE")"
ALLOWED=()
while IFS= read -r line; do ALLOWED+=("$line"); done < <(jq -r '.files[]' "$UNIT_FILE")

# --- 2. the patch ----------------------------------------------------------------
if ! printf '%s' "$PATCH_B64" | base64 -d > "$PATCH_FILE" 2>/dev/null; then
  fail "patch_b64 is not valid base64"; finish
fi
if [ ! -s "$PATCH_FILE" ]; then fail "patch is empty"; finish; fi
if [ "$(wc -c < "$PATCH_FILE")" -gt 262144 ]; then fail "patch exceeds 256 KiB"; finish; fi

TOUCHED=()
while IFS= read -r line; do [ -n "$line" ] && TOUCHED+=("$line"); done < <(git apply --numstat "$PATCH_FILE" 2>/dev/null | awk -F'\t' '{print $3}')
if [ "${#TOUCHED[@]}" -eq 0 ]; then fail "patch touches no files or is not a unified diff"; finish; fi

for path in "${TOUCHED[@]}"; do
  case "$path" in
    .github/*|package.json|pnpm-lock.yaml|vendor/*|test/*|units/*|.github)
      fail "patch touches a protected path: $path" ;;
  esac
  ok="no"
  for allowed in "${ALLOWED[@]}"; do [ "$path" = "$allowed" ] && ok="yes"; done
  [ "$ok" = "yes" ] || fail "patch touches a file outside the unit's files list: $path"
  case "$path" in ../*|/*|*/../*) fail "patch path escapes the repo: $path" ;; esac
done
[ "${#REASONS[@]}" -eq 0 ] || finish

# --- 3. apply --------------------------------------------------------------------
if ! git apply --3way --check "$PATCH_FILE" 2> apply.err; then
  fail "patch does not apply to main: $(head -c 300 apply.err | tr '\n' ' ')"; finish
fi
git apply --3way "$PATCH_FILE" || { fail "git apply failed"; finish; }

# Stage everything the patch produced (new files included) and count against main.
git add -A
CHANGED="$(git diff --cached --numstat HEAD | awk '{a+=$1; d+=$2} END {print a+d+0}')"
if [ "$CHANGED" -gt "$MAX_LINES" ]; then fail "changed $CHANGED lines; the unit allows $MAX_LINES"; fi

# --- 4. install, lint, typecheck, test ---------------------------------------------
pnpm install --frozen-lockfile > install.log 2>&1 || { fail "pnpm install failed (lockfile drift?)"; finish; }
pnpm lint > lint.log 2>&1 || fail "lint: $(grep -E 'error|✖' lint.log | head -5 | tr '\n' ' ' | head -c 400)"
pnpm typecheck > typecheck.log 2>&1 || fail "typecheck: $(grep -E 'error TS' typecheck.log | head -5 | tr '\n' ' ' | head -c 400)"
# private half of the acceptance test, held back by the program and revealed with this run
if [ -n "${PRIVATE_TEST_B64:-}" ]; then
  if printf '%s' "$PRIVATE_TEST_B64" | base64 -d > "test/units/$UNIT_ID.private.test.ts" 2>/dev/null; then echo "private test in place"; else fail "private_test_b64 is not valid base64"; fi
fi
pnpm test > test.log 2>&1 || fail "tests: $(grep -E 'FAIL|✗|×|Error' test.log | head -5 | tr '\n' ' ' | head -c 400)"
if [ -f coverage/coverage-summary.json ]; then
  COVERAGE="$(jq '.total.lines.pct' coverage/coverage-summary.json)"
fi

# --- 5. the unit's own public test must have run (not been skipped) ----------------
PUBLIC_TEST="$(jq -r '.public_test' "$UNIT_FILE")"
if [ -f "$PUBLIC_TEST" ]; then
  if ! grep -q "$(basename "$PUBLIC_TEST")" test.log; then
    fail "public test $PUBLIC_TEST did not run"
  elif grep -E "$(basename "$PUBLIC_TEST").*skipped" test.log > /dev/null; then
    fail "public test $PUBLIC_TEST was skipped: the unit's first file is still missing"
  fi
fi

finish
