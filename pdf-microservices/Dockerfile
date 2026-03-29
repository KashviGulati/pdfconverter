FROM node:18

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    fonts-liberation \
    fonts-freefont-ttf \
    fontconfig \
    wget \
    cabextract \
    xfonts-utils \
    && echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
    && apt-get install -y ttf-mscorefonts-installer \
    && fc-cache -f -v \
    && apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads output

EXPOSE 5000

CMD ["node", "server.js"]