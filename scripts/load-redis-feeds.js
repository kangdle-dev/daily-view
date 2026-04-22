#!/usr/bin/env node
import "dotenv/config";
import redis from "redis";

const FEEDS_DATA = {
  sources: [
    {
      id: "1",
      key: "khan",
      name: "경향신문",
      feeds: [
        { url: "https://www.khan.co.kr/rss/rssdata/politic_news.xml", mainCategory: "정치" },
        { url: "https://www.khan.co.kr/rss/rssdata/economy_news.xml", mainCategory: "경제" },
        { url: "https://www.khan.co.kr/rss/rssdata/society_news.xml", mainCategory: "사회" },
        { url: "https://www.khan.co.kr/rss/rssdata/kh_world.xml", mainCategory: "국제" },
        { url: "https://www.khan.co.kr/rss/rssdata/kh_sports.xml", mainCategory: "스포츠" },
        { url: "https://www.khan.co.kr/rss/rssdata/culture_news.xml", mainCategory: "문화" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      key: "chosun",
      name: "조선일보",
      feeds: [
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml", mainCategory: "정치" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml", mainCategory: "경제" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/national/?outputType=xml", mainCategory: "사회" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/international/?outputType=xml", mainCategory: "국제" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/culture-life/?outputType=xml", mainCategory: "문화" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/sports/?outputType=xml", mainCategory: "스포츠" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "4",
      key: "yonhap",
      name: "연합뉴스",
      feeds: [
        { url: "https://www.yna.co.kr/rss/politics.xml", mainCategory: "정치" },
        { url: "https://www.yna.co.kr/rss/northkorea.xml", mainCategory: "북한" },
        { url: "https://www.yna.co.kr/rss/economy.xml", mainCategory: "경제" },
        { url: "https://www.yna.co.kr/rss/market.xml", mainCategory: "증권.금융" },
        { url: "https://www.yna.co.kr/rss/industry.xml", mainCategory: "산업" },
        { url: "https://www.yna.co.kr/rss/society.xml", mainCategory: "사회" },
        { url: "https://www.yna.co.kr/rss/international.xml", mainCategory: "국제" },
        { url: "https://www.yna.co.kr/rss/entertainment.xml", mainCategory: "문화" },
        { url: "https://www.yna.co.kr/rss/sports.xml", mainCategory: "스포츠" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "hk",
      key: "hankyung",
      name: "한국경제",
      feeds: [
        { url: "https://www.hankyung.com/feed/finance", mainCategory: "증권.금융" },
        { url: "https://www.hankyung.com/feed/economy", mainCategory: "경제" },
        { url: "https://www.hankyung.com/feed/realestate", mainCategory: "부동산" },
        { url: "https://www.hankyung.com/feed/politics", mainCategory: "정치" },
        { url: "https://www.hankyung.com/feed/international", mainCategory: "국제" },
        { url: "https://www.hankyung.com/feed/society", mainCategory: "사회" },
        { url: "https://www.hankyung.com/feed/entertainment", mainCategory: "문화" },
        { url: "https://www.hankyung.com/feed/sports", mainCategory: "스포츠" },
        { url: "https://www.hankyung.com/feed/it", mainCategory: "산업" }
      ],
      createdAt: new Date().toISOString()
    }
  ]
};

async function loadFeeds() {
  if (!process.env.REDIS_URL) {
    console.error("❌ REDIS_URL 환경 변수가 설정되지 않았습니다");
    process.exit(1);
  }

  const client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 5000 }
  });

  try {
    await client.connect();
    console.log("✅ Redis 연결 완료");

    await client.set("feeds:all", JSON.stringify(FEEDS_DATA));
    console.log("✅ 피드 데이터가 Redis에 저장되었습니다");

    const count = FEEDS_DATA.sources.length;
    console.log(`   총 ${count}개 언론사, ${FEEDS_DATA.sources.reduce((acc, s) => acc + s.feeds.length, 0)}개 RSS 피드`);

    await client.disconnect();
  } catch (err) {
    console.error("❌ 오류:", err.message);
    process.exit(1);
  }
}

loadFeeds();
