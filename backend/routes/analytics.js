import express from "express"
import { analyzeTrending } from "../utils/trending.js"
import { getSentimentDistribution, analyzeBatchSentiment } from "../utils/sentimentAnalysis.js"
import { getSourcePerformanceMetrics } from "../utils/advancedFilters.js"
import { getCachedData, setCachedData } from "../utils/cache.js"
import {
  getTechCrunchNews,
  getBBCNews,
  getHackerNews,
  getRedditNews,
  getCNNNews,
  getReutersNews,
  getGuardianNews,
} from "../scrapers/index.js"

const router = express.Router()

// Trending analysis with enhanced metrics
router.get("/trending", async (req, res, next) => {
  try {
    const { timeframe = "24h", sources = "all" } = req.query
    const cacheKey = `trending_${timeframe}_${sources}`

    let trendingData = getCachedData(cacheKey)

    if (!trendingData) {
      // Fetch from all sources
      const sourcePromises = [
        getTechCrunchNews(),
        getBBCNews(),
        getHackerNews(),
        getRedditNews(),
        getCNNNews(),
        getReutersNews(),
        getGuardianNews(),
      ]

      const results = await Promise.allSettled(sourcePromises)
      const allArticles = []

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const sourceName = ["TechCrunch", "BBC", "Hacker News", "Reddit", "CNN", "Reuters", "The Guardian"][index]
          allArticles.push(...result.value.map((article) => ({ ...article, source: sourceName })))
        }
      })

      // Enhanced trending analysis
      const trending = analyzeTrending(allArticles)
      const sentiment = getSentimentDistribution(allArticles)

      trendingData = {
        ...trending,
        sentiment,
        timeframe,
        sources: results.map((r, i) => ({
          name: ["TechCrunch", "BBC", "Hacker News", "Reddit", "CNN", "Reuters", "The Guardian"][i],
          status: r.status,
          articleCount: r.status === "fulfilled" ? r.value.length : 0,
        })),
        metadata: {
          totalSources: 7,
          successfulSources: results.filter((r) => r.status === "fulfilled").length,
          analysisDepth: "comprehensive",
        },
      }

      setCachedData(cacheKey, trendingData, 20 * 60 * 1000) // 20 minutes cache
    }

    res.json(trendingData)
  } catch (error) {
    next(error)
  }
})

// Sentiment analysis endpoint
router.get("/sentiment", async (req, res, next) => {
  try {
    const { source = "all", limit = 50 } = req.query
    const cacheKey = `sentiment_${source}_${limit}`

    let sentimentData = getCachedData(cacheKey)

    if (!sentimentData) {
      let articles = []

      if (source === "all") {
        const results = await Promise.allSettled([
          getTechCrunchNews(),
          getBBCNews(),
          getHackerNews(),
          getRedditNews(),
          getCNNNews(),
          getReutersNews(),
          getGuardianNews(),
        ])

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const sourceName = ["TechCrunch", "BBC", "Hacker News", "Reddit", "CNN", "Reuters", "The Guardian"][index]
            articles.push(...result.value.map((article) => ({ ...article, source: sourceName })))
          }
        })
      } else {
        // Fetch specific source (implementation would go here)
        articles = await getTechCrunchNews() // Placeholder
      }

      articles = articles.slice(0, Number.parseInt(limit))
      const articlesWithSentiment = analyzeBatchSentiment(articles)
      const distribution = getSentimentDistribution(articlesWithSentiment)

      sentimentData = {
        articles: articlesWithSentiment,
        distribution,
        insights: generateSentimentInsights(distribution),
        timestamp: new Date().toISOString(),
      }

      setCachedData(cacheKey, sentimentData, 15 * 60 * 1000)
    }

    res.json(sentimentData)
  } catch (error) {
    next(error)
  }
})

// Source performance metrics
router.get("/sources", async (req, res, next) => {
  try {
    const cacheKey = "source_performance"
    let metrics = getCachedData(cacheKey)

    if (!metrics) {
      metrics = await getSourcePerformanceMetrics()
      setCachedData(cacheKey, metrics, 30 * 60 * 1000) // 30 minutes cache
    }

    // Calculate additional insights
    const insights = {
      fastestSource: metrics.reduce((fastest, current) =>
        current.responseTime < fastest.responseTime ? current : fastest,
      ),
      mostArticles: metrics.reduce((most, current) => (current.articleCount > most.articleCount ? current : most)),
      averageResponseTime: Math.round(
        metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.filter((m) => m.status === "success").length,
      ),
      successRate: Math.round((metrics.filter((m) => m.status === "success").length / metrics.length) * 100),
    }

    res.json({
      metrics,
      insights,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// Keyword frequency analysis
router.get("/keywords", async (req, res, next) => {
  try {
    const { timeframe = "24h", minFrequency = 2 } = req.query
    const cacheKey = `keywords_${timeframe}_${minFrequency}`

    let keywordData = getCachedData(cacheKey)

    if (!keywordData) {
      // Fetch all articles
      const results = await Promise.allSettled([
        getTechCrunchNews(),
        getBBCNews(),
        getHackerNews(),
        getRedditNews(),
        getCNNNews(),
        getReutersNews(),
        getGuardianNews(),
      ])

      const allArticles = []
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          allArticles.push(...result.value)
        }
      })

      keywordData = analyzeKeywordFrequency(allArticles, Number.parseInt(minFrequency))
      setCachedData(cacheKey, keywordData, 25 * 60 * 1000)
    }

    res.json(keywordData)
  } catch (error) {
    next(error)
  }
})

function generateSentimentInsights(distribution) {
  const { percentages } = distribution
  const insights = []

  if (percentages.positive > 60) {
    insights.push("News sentiment is predominantly positive today")
  } else if (percentages.negative > 60) {
    insights.push("News sentiment is predominantly negative today")
  } else {
    insights.push("News sentiment is balanced today")
  }

  if (Math.abs(percentages.positive - percentages.negative) < 10) {
    insights.push("Sentiment distribution is very balanced")
  }

  return insights
}

function analyzeKeywordFrequency(articles, minFrequency) {
  const keywords = new Map()
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "are",
    "but",
    "not",
    "you",
    "all",
    "can",
    "had",
    "her",
    "was",
    "one",
    "our",
    "out",
    "day",
    "get",
    "has",
    "him",
    "his",
    "how",
    "man",
    "new",
    "now",
    "old",
    "see",
    "two",
    "way",
    "who",
    "says",
    "said",
    "will",
    "from",
    "they",
    "know",
    "want",
    "been",
    "good",
    "much",
    "some",
    "time",
    "very",
    "when",
    "come",
    "here",
    "just",
    "like",
    "long",
    "make",
    "many",
    "over",
    "such",
    "take",
    "than",
    "them",
    "well",
    "were",
    "with",
    "have",
    "this",
    "that",
    "what",
    "your",
    "about",
    "after",
    "again",
    "before",
    "being",
    "could",
    "every",
    "first",
    "found",
    "great",
    "group",
    "large",
    "last",
    "little",
    "most",
    "never",
    "other",
    "place",
    "right",
    "same",
    "seem",
    "small",
    "still",
    "system",
    "those",
    "through",
    "under",
    "where",
    "while",
    "work",
    "world",
    "year",
    "years",
    "young",
  ])

  articles.forEach((article) => {
    const text = `${article.title} ${article.summary}`.toLowerCase()
    const words = text.match(/\b[a-z]{3,}\b/g) || []

    words.forEach((word) => {
      if (!stopWords.has(word)) {
        keywords.set(word, (keywords.get(word) || 0) + 1)
      }
    })
  })

  const filteredKeywords = Array.from(keywords.entries())
    .filter(([word, count]) => count >= minFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)

  return {
    keywords: filteredKeywords.map(([word, count]) => ({
      word,
      frequency: count,
      percentage: Math.round((count / articles.length) * 100 * 10) / 10,
    })),
    totalArticles: articles.length,
    uniqueKeywords: keywords.size,
    timestamp: new Date().toISOString(),
  }
}

export default router
