#!/bin/sh

# Make start.sh executable
chmod +x scripts/start.sh

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from env_example..."
    cp env_example .env
    echo "Please edit the .env file with your configuration before starting the application."
else
    echo ".env file already exists."
fi

# Build and start Docker containers
docker-compose up --build 