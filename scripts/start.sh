#!/bin/sh

# Check if .env file exists
if [ ! -f .env ]; then
    echo "No .env file found. Creating from env_example..."
    cp env_example .env
    echo ".env file created. Please update it with your configuration."
fi

# Start the application
npm start 