#!/bin/bash

# Wait for server
until curl -s http://localhost:3000 > /dev/null; do
  echo "Waiting for server..."
  sleep 2
done

echo "Seeding..."
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Authorization: Bearer secret" \
  -v
