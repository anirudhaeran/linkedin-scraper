# Use official Node.js image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libexpat1 \
    libgbm-dev \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies (including puppeteer)
RUN npm install

# Copy rest of the app
COPY . .

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
