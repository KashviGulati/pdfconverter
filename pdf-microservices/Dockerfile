FROM node:18

# Install LibreOffice
RUN apt-get update && \
    apt-get install -y libreoffice && \
    apt-get clean

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