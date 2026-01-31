#!/bin/bash

# Backup PostgreSQL database

set -e

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "📦 Starting PostgreSQL backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
docker exec crm-postgres pg_dump -U crm_user -Fc crm_db > "$BACKUP_DIR/crm_db_$DATE.dump"

echo "✅ Backup created: crm_db_$DATE.dump"

# Compress backup
gzip "$BACKUP_DIR/crm_db_$DATE.dump"

echo "✅ Backup compressed: crm_db_$DATE.dump.gz"

# Delete old backups
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "🧹 Cleaned up backups older than $RETENTION_DAYS days"

# Verify backup
if pg_restore --list "$BACKUP_DIR/crm_db_$DATE.dump.gz" > /dev/null 2>&1; then
    echo "✅ Backup verification successful"
else
    echo "❌ Backup verification failed"
    exit 1
fi

echo "🎉 Backup complete!"
