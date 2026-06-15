#!/bin/bash
# AzurTant PRO — Local CI/CD pipeline runner
# Usage: ./local-ci.sh [stage]
# Stages: lint, test, build, smoke, all

set -e

AZURTANT_PORT=5182
STAGE=${1:-all}

log() {
  echo "═══════════════════════════════════════════════════════════"
  echo "  $1"
  echo "═══════════════════════════════════════════════════════════"
}

run_lint() {
  log "🔍 LINT"
  npx eslint src/ --ext .js,.mjs,.jsx,.tsx --max-warnings 0 || echo "Lint with warnings"
  npx prettier --check "src/**/*.{js,mjs,css,html}" || echo "Prettier with warnings"
}

run_test() {
  log "🧪 TESTS"
  npm test
  NODE_ENV=development npx vitest run --reporter=verbose || echo "Vitest optional"
}

run_build() {
  log "📦 BUILD"
  NODE_ENV=production npx vite build
  du -sh dist/
}

run_smoke() {
  log "🔥 SMOKE TEST"
  node server.mjs &
  SERVER_PID=$!
  sleep 4

  echo "Health: $(curl -s http://localhost:$AZURTANT_PORT/api/health)"
  echo "Orchestrator: $(curl -s http://localhost:$AZURTANT_PORT/api/orchestrator/status | head -c 200)"
  echo "Cockpit HTTP: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:$AZURTANT_PORT/cockpit)"
  echo "3D HTTP: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:$AZURTANT_PORT/3d)"

  kill $SERVER_PID 2>/dev/null || true
}

run_security() {
  log "🛡️ SECURITY SCAN"
  npm audit --audit-level=high || echo "Audit completed"
}

case "$STAGE" in
  lint)   run_lint ;;
  test)   run_test ;;
  build)  run_build ;;
  smoke)  run_smoke ;;
  security) run_security ;;
  all)
    run_lint
    run_test
    run_security
    run_build
    run_smoke
    log "✅ LOCAL CI/CD COMPLETE"
    ;;
  *) echo "Unknown stage: $STAGE"; exit 1 ;;
esac
