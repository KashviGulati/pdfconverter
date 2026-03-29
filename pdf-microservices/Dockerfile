FROM node:18

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fontconfig \
    wget \
    cabextract \
    xfonts-utils \
    && mkdir -p /usr/share/fonts/truetype/msttcorefonts \
    && cd /usr/share/fonts/truetype/msttcorefonts \
    && wget -q https://downloads.sourceforge.net/corefonts/arial32.exe \
    && wget -q https://downloads.sourceforge.net/corefonts/times32.exe \
    && wget -q https://downloads.sourceforge.net/corefonts/courie32.exe \
    && wget -q https://downloads.sourceforge.net/corefonts/verdan32.exe \
    && cabextract *.exe \
    && rm *.exe \
    && fc-cache -f -v \
    && apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads output

EXPOSE 5000

CMD ["node", "server.js"]