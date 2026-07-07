#!/usr/bin/env bash
set -euo pipefail

# Usage: restore.sh <chemin/vers/backup.db.gz>
if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <chemin/vers/backup.db.gz>" >&2
  echo "" >&2
  echo "Exemple : $0 backups/daily/dev-20260707-115456.db.gz" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Erreur : fichier introuvable — $BACKUP_FILE" >&2
  exit 1
fi

if [[ "$BACKUP_FILE" != *.db.gz ]]; then
  echo "Erreur : le fichier doit être un .db.gz" >&2
  exit 1
fi

echo "[restore] Fichier : $BACKUP_FILE"
echo "[restore] Arrêt du serveur..."
docker compose stop p7-server

TMP_DB="/tmp/restore-$(date +%Y%m%d-%H%M%S).db"

echo "[restore] Décompression..."
gunzip -c "$BACKUP_FILE" > "$TMP_DB"

echo "[restore] Restauration dans le container..."
docker compose start p7-server
docker compose cp "$TMP_DB" p7-server:/app/data/dev.db

rm -f "$TMP_DB"

echo "[restore] Redémarrage..."
docker compose restart p7-server

echo "[restore] Application des migrations Prisma..."
docker compose exec p7-server npx prisma migrate deploy

echo "[restore] Terminé — base restaurée depuis $(basename "$BACKUP_FILE")"
