#!/usr/bin/env bash
set -euo pipefail

# Usage: backup.sh [daily|weekly]
# Default: daily
MODE="${1:-daily}"

if [[ "$MODE" != "daily" && "$MODE" != "weekly" ]]; then
  echo "Usage: $0 [daily|weekly]" >&2
  exit 1
fi

STAMP=$(date +%Y%m%d-%H%M%S)
ROOT="$(cd "$(dirname "$0")/.." && pwd)/backups"
DEST="$ROOT/$MODE"
mkdir -p "$DEST"

# Rétention selon le mode
if [[ "$MODE" == "daily" ]]; then
  KEEP=7
else
  KEEP=4
fi

echo "[backup:$MODE] $(date) — début sauvegarde"

# Copie cohérente du fichier SQLite depuis le container
docker compose cp p7-server:/app/data/dev.db "$DEST/dev-$STAMP.db"

gzip -f "$DEST/dev-$STAMP.db"

echo "[backup:$MODE] Fichier créé : $DEST/dev-$STAMP.db.gz"

# Rétention : supprimer les plus anciens au-delà de $KEEP
ls -1t "$DEST"/dev-*.db.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm --

echo "[backup:$MODE] Terminé — $(ls "$DEST"/dev-*.db.gz 2>/dev/null | wc -l | tr -d ' ') fichier(s) conservé(s)"
