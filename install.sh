#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  AI Query Runner — Instalator (Linux / macOS)
#  Automatycznie instaluje Node.js jeśli brakuje.
#  Użycie: bash install.sh
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓${NC} $1"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $1"; }
fail() { echo -e "${RED}  ✗${NC} $1"; exit 1; }
info() { echo -e "    → $1"; }
hr()   { echo -e "${CYAN}──────────────────────────────────────────────${NC}"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🤖  AI Query Runner — Instalator           ║${NC}"
echo -e "${CYAN}║  Excel / Sheets → AI → Excel / Sheets       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Przejdź do katalogu skryptu ─────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Funkcja: zainstaluj Node.js przez nvm ───────────────────────────────────
install_node_via_nvm() {
  echo ""
  echo -e "${BOLD}Instalowanie Node.js automatycznie przez nvm...${NC}"
  info "Pobieranie nvm (Node Version Manager)..."

  # Pobierz i uruchom instalator nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

  # Załaduj nvm do bieżącej sesji
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  if ! command -v nvm &>/dev/null && [ -s "$NVM_DIR/nvm.sh" ]; then
    \. "$NVM_DIR/nvm.sh"
  fi

  nvm install 20
  nvm use 20

  ok "Node.js $(node --version) zainstalowany przez nvm"
}

# ── Funkcja: spróbuj zainstalować przez menedżer pakietów ───────────────────
install_node_system() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &>/dev/null; then
      echo ""
      info "Wykryto macOS z Homebrew. Instaluję Node.js..."
      brew install node@20
      brew link node@20 --force --overwrite 2>/dev/null || true
      return 0
    fi
  elif command -v apt-get &>/dev/null; then
    echo ""
    info "Wykryto system z apt. Instaluję Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    return 0
  elif command -v dnf &>/dev/null; then
    info "Wykryto dnf (Fedora/RHEL). Instaluję Node.js..."
    sudo dnf install -y nodejs npm
    return 0
  elif command -v pacman &>/dev/null; then
    info "Wykryto pacman (Arch). Instaluję Node.js..."
    sudo pacman -S --noconfirm nodejs npm
    return 0
  fi
  return 1
}

# ── Krok 1: Sprawdź / zainstaluj Node.js ────────────────────────────────────
hr
echo -e "${BOLD}Krok 1/4: Sprawdzanie Node.js${NC}"
echo ""

NODE_OK=false
if command -v node &>/dev/null; then
  NODE_MAJOR=$(node -e "console.log(parseInt(process.version.slice(1)))")
  if [ "$NODE_MAJOR" -ge 18 ]; then
    ok "Node.js $(node --version) — znaleziony"
    NODE_OK=true
  else
    warn "Node.js $(node --version) jest za stary (wymagana v18+). Aktualizuję..."
  fi
fi

if [ "$NODE_OK" = false ]; then
  # Próba 1: nvm (działa bez sudo, preferowana)
  if install_node_via_nvm 2>/dev/null; then
    NODE_OK=true
  else
    # Próba 2: menedżer pakietów systemu
    if install_node_system 2>/dev/null && command -v node &>/dev/null; then
      ok "Node.js $(node --version) zainstalowany"
      NODE_OK=true
    fi
  fi
fi

if [ "$NODE_OK" = false ]; then
  fail "Nie udało się zainstalować Node.js automatycznie."
  echo ""
  info "Zainstaluj ręcznie z: ${CYAN}https://nodejs.org/en/download${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    info "Lub: ${CYAN}brew install node${NC}"
  fi
  exit 1
fi

# Upewnij się, że npm jest dostępny
if ! command -v npm &>/dev/null; then
  fail "npm nie jest dostępny. Uruchom: node --version i upewnij się, że instalacja jest kompletna."
fi
ok "npm $(npm --version)"

# ── Krok 2: Instalacja pakietów npm ─────────────────────────────────────────
hr
echo -e "${BOLD}Krok 2/4: Instalacja pakietów npm${NC}"
echo ""

if [ ! -d "node_modules" ]; then
  info "Instalowanie zależności (poczekaj chwilę)..."
  npm install
  ok "Pakiety npm zainstalowane"
else
  ok "Pakiety npm — już zainstalowane"
fi

# ── Krok 3: Przeglądarka Chromium ───────────────────────────────────────────
hr
echo -e "${BOLD}Krok 3/4: Instalacja przeglądarki Chromium${NC}"
echo ""
info "Pobieranie Chromium (~150MB, tylko raz)..."
echo ""

if npx playwright install chromium 2>&1; then
  ok "Chromium zainstalowany"
else
  warn "Chromium nie mógł być zainstalowany automatycznie."
  info "Spróbuj ręcznie: ${CYAN}npx playwright install chromium${NC}"
fi

# ── Krok 4: Kreator konfiguracji ─────────────────────────────────────────────
hr
echo -e "${BOLD}Krok 4/4: Konfiguracja${NC}"
echo ""

npx tsx src/wizard.ts

# ── Koniec ──────────────────────────────────────────────────────────────────
hr
echo ""
echo -e "${GREEN}${BOLD}Instalacja zakończona!${NC}"
echo ""
echo -e "Uruchom narzędzie poleceniem:"
echo -e "  ${CYAN}npx tsx src/main.ts --input queries.xlsx${NC}"
echo ""

# Informacja o nvm (jeśli nvm było użyte a PATH nie jest jeszcze ustawiony)
if [ -s "$HOME/.nvm/nvm.sh" ] && ! command -v node &>/dev/null 2>&1; then
  echo -e "${YELLOW}Uwaga:${NC} Uruchom ponownie terminal lub wykonaj:"
  echo -e "  ${CYAN}source ~/.bashrc${NC}  (lub ~/.zshrc na macOS)"
  echo ""
fi
