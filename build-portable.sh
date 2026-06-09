#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== ai-query-runner portable build ===${NC}"

# 1. Check bun
if ! command -v bun &> /dev/null; then
    echo -e "${RED}Error: bun is not installed. Install from https://bun.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✓ bun $(bun --version)${NC}"

# 2. Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
bun install

# 3. Download Chromium via Playwright
echo -e "${YELLOW}Downloading Chromium (this may take a while)...${NC}"
npx playwright install chromium

# 4. Prepare output directory
rm -rf dist/portable
mkdir -p dist/portable/public

# 5. Compile binaries
# playwright/playwright-core are marked external (dynamic requires can't be bundled)
# — they are copied to dist/portable/node_modules/ below
echo -e "${YELLOW}Compiling Linux binary...${NC}"
bun build src/index.ts --compile --target=bun-linux-x64 \
  --external playwright --external playwright-core --external chromium-bidi \
  --outfile=dist/portable/ai-query-runner

echo -e "${YELLOW}Compiling macOS binary...${NC}"
bun build src/index.ts --compile --target=bun-darwin-x64 \
  --external playwright --external playwright-core --external chromium-bidi \
  --outfile=dist/portable/ai-query-runner-macos

# 6. Copy static assets
echo -e "${YELLOW}Copying public assets...${NC}"
cp -r src/public/* dist/portable/public/

# 7. Create portable marker file
touch dist/portable/.portable

# 8. Copy playwright node_modules (needed at runtime — marked external in bundle)
echo -e "${YELLOW}Copying playwright runtime...${NC}"
mkdir -p dist/portable/node_modules
for pkg in playwright playwright-core; do
  [ -d "node_modules/$pkg" ] && cp -r "node_modules/$pkg" dist/portable/node_modules/
done

# 9. Copy bundled Chromium
echo -e "${YELLOW}Copying Chromium...${NC}"
CHROMIUM_DIR=$(node -e "
const {chromium} = require('playwright');
chromium.executablePath().then(p => {
  const path = require('path');
  console.log(path.dirname(path.dirname(p)));
});
")
echo -e "  Chromium source: $CHROMIUM_DIR"
cp -r "$CHROMIUM_DIR" dist/portable/chromium

# 10. Create ZIPs
echo -e "${YELLOW}Creating ZIPs...${NC}"
mkdir -p dist

# Linux ZIP
cd dist/portable
zip -r ../ai-query-runner-portable-linux.zip \
  ai-query-runner public chromium node_modules .portable
cd ../..

# macOS ZIP (rename binary inside the zip)
cd dist/portable
mv ai-query-runner-macos ai-query-runner-tmp-macos
cp ai-query-runner-tmp-macos ai-query-runner
zip -r ../ai-query-runner-portable-macos.zip \
  ai-query-runner public chromium node_modules .portable
mv ai-query-runner ai-query-runner-macos
rm ai-query-runner-tmp-macos
cd ../..

# 11. Summary
echo -e "${GREEN}=== Build complete ===${NC}"
ls -lh dist/*.zip
