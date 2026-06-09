#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  AI Query Runner — Uruchamianie panelu
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d "node_modules" ]; then
  echo -e "${RED}Pakiety nie są zainstalowane! Uruchom najpierw install.sh${NC}"
  exit 1
fi

echo -e "${CYAN}Uruchamianie serwera AI Query Runner...${NC}"

# Otwórz przeglądarkę w tle (dla macOS / Linux)
if command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:3535" &> /dev/null &
elif command -v open &> /dev/null; then
  open "http://localhost:3535" &> /dev/null &
fi

# Uruchom serwer
npm run server
