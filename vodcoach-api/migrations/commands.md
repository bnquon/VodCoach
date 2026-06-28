# See current migration version
migrate -path migrations -database "$DB_URL" version

# Apply all pending up migrations
migrate -path migrations -database "$DB_URL" up

# Apply only the next 1 up migration
migrate -path migrations -database "$DB_URL" up 1

# Roll back 1 migration
migrate -path migrations -database "$DB_URL" down 1