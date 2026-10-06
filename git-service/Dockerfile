FROM python:3.11-slim

WORKDIR /app

# Install git and build dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libgit2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Start the server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
