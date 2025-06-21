import express from "express"
import { getTechCrunchNews, getBBCNews, getHackerNews, getRedditNews, getCNNNews } from "../scrapers/index.js"
import { filterByKeyword, limitResults, searchAllSources, sortArticles, addRelevanceScore } from "../utils/filters.js"
import { getCachedData, setCachedData, getCacheStats, cleanExpiredCache } from "../utils/cache.js"
import { extractArticleContent } from "../utils/contentExtractor.js"
import { analyzeTrending } from "../utils/trending.js"

const router = express.Router()

// TechCrunch endpoint
router.get("/techcrunch", async (req, res, next) => {
  try {
    const { keyword, limit = 10 } = req.query
    const cacheKey = `techcrunch_${keyword || "all"}_${limit}`

    // Check cache first
    let articles = getCachedData(cacheKey)

    if (!articles) {
      articles = await getTechCrunchNews()
      setCachedData(cacheKey, articles, 15 * 60 * 1000) // Cache for 15 minutes
    }

    // Apply filters
    if (keyword) {
      articles = filterByKeyword(articles, keyword)
    }

    articles = limitResults(articles, Number.parseInt(limit))

    res.json({
      source: "TechCrunch",
      count: articles.length,
      articles,
      cached: getCachedData(cacheKey) !== null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// BBC endpoint
router.get("/bbc", async (req, res, next) => {
  try {
    const { keyword, limit = 10 } = req.query
    const cacheKey = `bbc_${keyword || "all"}_${limit}`

    let articles = getCachedData(cacheKey)

    if (!articles) {
      articles = await getBBCNews()
      setCachedData(cacheKey, articles, 15 * 60 * 1000)
    }

    if (keyword) {
      articles = filterByKeyword(articles, keyword)
    }

    articles = limitResults(articles, Number.parseInt(limit))

    res.json({
      source: "BBC",
      count: articles.length,
      articles,
      cached: getCachedData(cacheKey) !== null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// Hacker News endpoint
router.get("/hackernews", async (req, res, next) => {
  try {
    const { keyword, limit = 10 } = req.query
    const cacheKey = `hackernews_${keyword || "all"}_${limit}`

    let articles = getCachedData(cacheKey)

    if (!articles) {
      articles = await getHackerNews()
      setCachedData(cacheKey, articles, 15 * 60 * 1000)
    }

    if (keyword) {
      articles = filterByKeyword(articles, keyword)
    }

    articles = limitResults(articles, Number.parseInt(limit))

    res.json({
      source: "Hacker News",
      count: articles.length,
      articles,
      cached: getCachedData(cacheKey) !== null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// All sources aggregator endpoint
router.get("/all", async (req, res, next) => {
  try {
    const { keyword, limit = 30 } = req.query
    const cacheKey = `all_sources_${keyword || "all"}_${limit}`

    let allArticles = getCachedData(cacheKey)

    if (!allArticles) {
      const [techcrunch, bbc, hackernews, reddit, cnn] = await Promise.allSettled([
        getTechCrunchNews(),
        getBBCNews(),
        getHackerNews(),
        getRedditNews(),
        getCNNNews(),
      ])

      allArticles = []

      if (techcrunch.status === "fulfilled") {
        allArticles.push(...techcrunch.value.map((article) => ({ ...article, source: "TechCrunch" })))
      }

      if (bbc.status === "fulfilled") {
        allArticles.push(...bbc.value.map((article) => ({ ...article, source: "BBC" })))
      }

      if (hackernews.status === "fulfilled") {
        allArticles.push(...hackernews.value.map((article) => ({ ...article, source: "Hacker News" })))
      }

      if (reddit.status === "fulfilled") {
        allArticles.push(...reddit.value.map((article) => ({ ...article, source: "Reddit" })))
      }

      if (cnn.status === "fulfilled") {
        allArticles.push(...cnn.value.map((article) => ({ ...article, source: "CNN" })))
      }

      setCachedData(cacheKey, allArticles, 15 * 60 * 1000)
    }

    if (keyword) {
      allArticles = filterByKeyword(allArticles, keyword)
    }

    allArticles = limitResults(allArticles, Number.parseInt(limit))

    res.json({
      sources: ["TechCrunch", "BBC", "Hacker News", "Reddit", "CNN"],
      count: allArticles.length,
      articles: allArticles,
      cached: getCachedData(cacheKey) !== null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// Search endpoint
router.get("/search", async (req, res, next) => {
  try {
    const { q: query, limit = 20 } = req.query

    if (!query) {
      return res.status(400).json({
        error: "Missing search query",
        message: "Please provide a search query using ?q=keyword",
      })
    }

    const results = await searchAllSources(query, Number.parseInt(limit))

    res.json({
      query,
      count: results.length,
      articles: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// Reddit endpoint
router.get("/reddit", async (req, res, next) => {
  try {
    const { keyword, limit = 10, sort = "date", content = "false", images = "false" } = req.query
    const cacheKey = `reddit_${keyword || "all"}_${limit}_${sort}_${content}_${images}`

    let articles = getCachedData(cacheKey)

    if (!articles) {
      articles = await getRedditNews()
      setCachedData(cacheKey, articles, 15 * 60 * 1000)
    }

    // Apply filters and sorting
    if (keyword) {
      articles = addRelevanceScore(articles, keyword)
      articles = filterByKeyword(articles, keyword)
    }

    articles = sortArticles(articles, sort)
    articles = limitResults(articles, Number.parseInt(limit))

    // Extract content if requested
    if (content === "true" && articles.length > 0) {
      const contentPromises = articles.slice(0, 3).map(async (article) => {
        const extracted = await extractArticleContent(article.url, article.source)
        return { ...article, extracted }
      })

      const articlesWithContent = await Promise.all(contentPromises)
      articles = [...articlesWithContent, ...articles.slice(3)]
    }

    res.json({
      source: "Reddit",
      count: articles.length,
      articles,
      cached: getCachedData(cacheKey) !== null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// CNN endpoint
router.get("/cnn", async (req, res, next) => {
  try {
    const { keyword, limit = 10, sort = "date", content = "false" } = req.query
    const cacheKey = `cnn_${keyword || "all"}_${limit}_${sort}_${content}`

    let articles = getCachedData(cacheKey)

    if (!articles) {
      articles = await getCNNNews()
      setCachedData(cacheKey, articles, 15 * 60 * 1000)
    }

    if (keyword) {
      articles = addRelevanceScore(articles, keyword)
      articles = filterByKeyword(articles, keyword)
    }

    articles = sortArticles(articles, sort)
    articles = limitResults(articles, Number.parseInt(limit))

    res.json({
      source: "CNN",
      count: articles.length,
      articles,
      cached: getCachedData(cacheKey) !== null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// Trending analysis endpoint
router.get("/trending", async (req, res, next) => {
  try {
    const cacheKey = "trending_analysis"
    let trendingData = getCachedData(cacheKey)

    if (!trendingData) {
      // Get articles from all sources
      const [techcrunch, bbc, hackernews, reddit, cnn] = await Promise.allSettled([
        getTechCrunchNews(),
        getBBCNews(),
        getHackerNews(),
        getRedditNews(),
        getCNNNews(),
      ])

      const allArticles = []

      if (techcrunch.status === "fulfilled") allArticles.push(...techcrunch.value)
      if (bbc.status === "fulfilled") allArticles.push(...bbc.value)
      if (hackernews.status === "fulfilled") allArticles.push(...hackernews.value)
      if (reddit.status === "fulfilled") allArticles.push(...reddit.value)
      if (cnn.status === "fulfilled") allArticles.push(...cnn.value)

      trendingData = analyzeTrending(allArticles)
      setCachedData(cacheKey, trendingData, 30 * 60 * 1000) // Cache for 30 minutes
    }

    res.json(trendingData)
  } catch (error) {
    next(error)
  }
})

// Cache statistics endpoint
router.get("/cache/stats", (req, res) => {
  const stats = getCacheStats()
  const cleaned = cleanExpiredCache()

  res.json({
    ...stats,
    cleanedEntries: cleaned,
    timestamp: new Date().toISOString(),
  })
})

export default router
