#!/usr/bin/env bash
set -euo pipefail
PROJECT=/home/soyer/projects/pizza-truck-campus
cd "$PROJECT"
exec npx -y next-devtools-mcp@latest
