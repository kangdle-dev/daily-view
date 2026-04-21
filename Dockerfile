FROM node:20-alpine

WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm install

# 소스 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

EXPOSE 3001

ENV NODE_ENV=production
CMD ["npm", "start"]
