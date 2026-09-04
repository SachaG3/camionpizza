#!/usr/bin/env bash
set -euo pipefail
PROJECT=/home/soyer/projects/pizza-truck-campus
cd "$PROJECT"
exec npx -y shadcn@4.21.0 mcp --cwd "$PROJECT"
