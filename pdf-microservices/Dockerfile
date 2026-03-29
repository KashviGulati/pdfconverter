FROM node:18

# Install LibreOffice + safe fonts
RUN apt-get update && \
    apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    fonts-liberation \
    fonts-freefont-ttf \
    fontconfig \
    && fc-cache -f -v \
    && apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads output

EXPOSE 5000

CMD ["node", "server.js"]