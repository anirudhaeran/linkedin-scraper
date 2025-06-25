FROM node:18-slim

# Install all required libraries to run Chromium (headless) in Docker
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxshmfence1 \
    libxkbcommon0 \
    libx11-xcb1 \
    libxfixes3 \
    libxrender1 \
    libxext6 \
    libx11-6 \
    libx11-data \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libxft2 \
    libharfbuzz0b \
    xdg-utils \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
