FROM node:18

# Install LibreOffice + fonts + dependencies
RUN apt-get update && \
    apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    fonts-liberation \
    fonts-freefont-ttf \
    ttf-mscorefonts-installer \
    fontconfig \
    && fc-cache -f -v \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./
RUN npm install

COPY . .

# Create folders
RUN mkdir -p uploads output

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]