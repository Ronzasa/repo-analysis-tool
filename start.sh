#!/bin/bash

echo "Repository Analysis Tool - Quick Start"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "Error: docker-compose is not installed."
  exit 1
fi

echo "Starting services..."
echo ""

# Create data directory
mkdir -p data

# Build and start services
docker-compose up --build

echo ""
echo "Services are running!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:3000"
echo "Git Service: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"
