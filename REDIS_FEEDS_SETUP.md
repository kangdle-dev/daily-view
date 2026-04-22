# Redis Feeds 데이터 설정 가이드

Redis에 피드 데이터를 저장하는 방법입니다.

## 📋 JSON 데이터

다음 JSON을 Redis `feeds:all` 키에 저장하세요:

```json
{
  "sources": [
    {
      "id": "1",
      "key": "khan",
      "name": "경향신문",
      "feeds": [
        {
          "url": "https://www.khan.co.kr/rss/rssdata/politic_news.xml",
          "mainCategory": "정치"
        },
        {
          "url": "https://www.khan.co.kr/rss/rssdata/economy_news.xml",
          "mainCategory": "경제"
        },
        {
          "url": "https://www.khan.co.kr/rss/rssdata/society_news.xml",
          "mainCategory": "사회"
        },
        {
          "url": "https://www.khan.co.kr/rss/rssdata/kh_world.xml",
          "mainCategory": "국제"
        },
        {
          "url": "https://www.khan.co.kr/rss/rssdata/kh_sports.xml",
          "mainCategory": "스포츠"
        },
        {
          "url": "https://www.khan.co.kr/rss/rssdata/culture_news.xml",
          "mainCategory": "문화"
        }
      ],
      "createdAt": "2026-04-22T00:00:00.000Z"
    },
    {
      "id": "2",
      "key": "chosun",
      "name": "조선일보",
      "feeds": [
        {
          "url": "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml",
          "mainCategory": "정치"
        },
        {
          "url": "https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml",
          "mainCategory": "경제"
        },
        {
          "url": "https://www.chosun.com/arc/outboundfeeds/rss/category/national/?outputType=xml",
          "mainCategory": "사회"
        },
        {
          "url": "https://www.chosun.com/arc/outboundfeeds/rss/category/international/?outputType=xml",
          "mainCategory": "국제"
        },
        {
          "url": "https://www.chosun.com/arc/outboundfeeds/rss/category/culture-life/?outputType=xml",
          "mainCategory": "문화"
        },
        {
          "url": "https://www.chosun.com/arc/outboundfeeds/rss/category/sports/?outputType=xml",
          "mainCategory": "스포츠"
        }
      ],
      "createdAt": "2026-04-22T00:00:00.000Z"
    },
    {
      "id": "4",
      "key": "yonhap",
      "name": "연합뉴스",
      "feeds": [
        {
          "url": "https://www.yna.co.kr/rss/politics.xml",
          "mainCategory": "정치"
        },
        {
          "url": "https://www.yna.co.kr/rss/northkorea.xml",
          "mainCategory": "북한"
        },
        {
          "url": "https://www.yna.co.kr/rss/economy.xml",
          "mainCategory": "경제"
        },
        {
          "url": "https://www.yna.co.kr/rss/market.xml",
          "mainCategory": "증권.금융"
        },
        {
          "url": "https://www.yna.co.kr/rss/industry.xml",
          "mainCategory": "산업"
        },
        {
          "url": "https://www.yna.co.kr/rss/society.xml",
          "mainCategory": "사회"
        },
        {
          "url": "https://www.yna.co.kr/rss/international.xml",
          "mainCategory": "국제"
        },
        {
          "url": "https://www.yna.co.kr/rss/entertainment.xml",
          "mainCategory": "문화"
        },
        {
          "url": "https://www.yna.co.kr/rss/sports.xml",
          "mainCategory": "스포츠"
        }
      ],
      "createdAt": "2026-04-22T00:00:00.000Z"
    },
    {
      "id": "hk",
      "key": "hankyung",
      "name": "한국경제",
      "feeds": [
        {
          "url": "https://www.hankyung.com/feed/finance",
          "mainCategory": "증권.금융"
        },
        {
          "url": "https://www.hankyung.com/feed/economy",
          "mainCategory": "경제"
        },
        {
          "url": "https://www.hankyung.com/feed/realestate",
          "mainCategory": "부동산"
        },
        {
          "url": "https://www.hankyung.com/feed/politics",
          "mainCategory": "정치"
        },
        {
          "url": "https://www.hankyung.com/feed/international",
          "mainCategory": "국제"
        },
        {
          "url": "https://www.hankyung.com/feed/society",
          "mainCategory": "사회"
        },
        {
          "url": "https://www.hankyung.com/feed/entertainment",
          "mainCategory": "문화"
        },
        {
          "url": "https://www.hankyung.com/feed/sports",
          "mainCategory": "스포츠"
        },
        {
          "url": "https://www.hankyung.com/feed/it",
          "mainCategory": "산업"
        }
      ],
      "createdAt": "2026-04-22T00:00:00.000Z"
    }
  ]
}
```

---

## 🚀 Redis에 저장하는 방법

### **방법 1: Redis CLI (터미널)**

```bash
redis-cli -h redis-18336.crce284.ap-neast-2-1.ec2.cloud.redislabs.com -p 18336
SET feeds:all '{"sources":[...]}'  # 위의 JSON 전체 붙여넣기
```

### **방법 2: Node.js 스크립트**

```javascript
import redis from "redis";

const client = redis.createClient({
  url: "redis-18336.crce284.ap-neast-2-1.ec2.cloud.redislabs.com:18336"
});

await client.connect();

const feedsData = {
  "sources": [
    // 위의 JSON 소스 배열
  ]
};

await client.set("feeds:all", JSON.stringify(feedsData));
console.log("✅ Feeds loaded to Redis");
await client.disconnect();
```

### **방법 3: 애플리케이션 시작 시 자동 로드**

현재 구현: 서버 시작 시 Redis가 비어있으면 자동으로 기본 feeds를 로드합니다.

```bash
npm install
npm run server
# Redis에 자동으로 기본 feeds 로드됨
```

---

## ✅ 확인 방법

```bash
redis-cli -h redis-18336.crce284.ap-neast-2-1.ec2.cloud.redislabs.com -p 18336
GET feeds:all
# JSON 데이터 반환됨
```

또는 애플리케이션 시작:
```bash
curl http://localhost:3001/api/feeds
# 저장된 피드 목록 반환
```

---

## 📝 추가 피드 추가

웹 UI에서 `/feeds` 페이지로 이동하여:
1. 새 피드 추가 버튼 클릭
2. 언론사 이름, 키, RSS URL 입력
3. 저장 → Redis에 자동 저장

모든 변경사항은 Redis에 실시간 저장됩니다.
