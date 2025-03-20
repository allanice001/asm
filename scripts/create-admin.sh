#!/bin/bash

# Default values
DEFAULT_EMAIL="admin@example.com"
DEFAULT_PASSWORD="Admin123!"
DEFAULT_NAME="System Administrator"

# Get input values or use defaults
read -p "Enter admin email (default: $DEFAULT_EMAIL): " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-$DEFAULT_EMAIL}

read -p "Enter admin name (default: $DEFAULT_NAME): " ADMIN_NAME
ADMIN_NAME=${ADMIN_NAME:-$DEFAULT_NAME}

read -s -p "Enter admin password (default: $DEFAULT_PASSWORD): " ADMIN_PASSWORD
echo
ADMIN_PASSWORD=${ADMIN_PASSWORD:-$DEFAULT_PASSWORD}

# Export as environment variables
export ADMIN_EMAIL=$ADMIN_EMAIL
export ADMIN_NAME=$ADMIN_NAME
export ADMIN_PASSWORD=$ADMIN_PASSWORD

# Run the seed script
echo "Creating admin user..."
npx ts-node scripts/seed-admin.ts

# Clear environment variables
unset ADMIN_EMAIL
unset ADMIN_NAME
unset ADMIN_PASSWORD

echo "Done!"

