import {
  getTechCrunchNews,
  getBBCNews,
  getHackerNews,
  getRedditNews,
  getCNNNews,
  getReutersNews,
  getGuardianNews,
} from "../scrapers/index.js"

export function filterByTimeframe(articles, timeframe) {
  if (!timeframe) return articles

  const now = new Date()
  let cutoffTime

  switch (timeframe) {
    case "1h":
      cutoffTime = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case "6h":
      cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
      break
    case "12h":
      cutoffTime = new Date(now.getTime() - 12 * 60 * 60 * 1000)
      break
    case "24h":
      cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case "7d":
      cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    default:
      return articles
  }

  return articles.filter((article) => new Date(article.publishedAt) >= cutoffTime)
}

export function filterByCredibility(articles, minScore = 70) {
  return articles.filter((article) => (article.metadata?.credibilityScore || 75) >= minScore)
}

export function filterByEngagement(articles, minEngagement = 0) {
  return articles.filter((article) => {
    const engagement = article.metadata?.score || article.metadata?.comments || 0
    return engagement >= minEngagement
  })
}

export function advancedSearch(articles, query, options = {}) {
  if (!query) return articles

  const { fuzzy = false, exactPhrase = false, excludeWords = [] } = options

  return articles.filter((article) => {
    const searchText = `${article.title} ${article.summary}`.toLowerCase()
    const queryLower = query.toLowerCase()

    // Exclude words check
    if (excludeWords.length > 0) {
      const hasExcludedWord = excludeWords.some((word) => searchText.includes(word.toLowerCase()))
      if (hasExcludedWord) return false
    }

    // Exact phrase search
    if (exactPhrase) {
      return searchText.includes(queryLower)
    }

    // Fuzzy search (simple implementation)
    if (fuzzy) {
      const queryWords = queryLower.split(/\s+/)
      const matchedWords = queryWords.filter((word) => searchText.includes(word))
      return matchedWords.length >= Math.ceil(queryWords.length * 0.7) // 70% match threshold
    }

    // Default keyword search
    return searchText.includes(queryLower)
  })
}

export function rankByRelevance(articles, query) {
  if (!query) return articles

  return articles
    .map((article) => {
      const titleMatches = (article.title.toLowerCase().match(new RegExp(query.toLowerCase(), "g")) || []).length
      const summaryMatches = (article.summary.toLowerCase().match(new RegExp(query.toLowerCase(), "g")) || []).length

      // Advanced scoring factors
      const titleScore = titleMatches * 5 // Title matches are most important
      const summaryScore = summaryMatches * 2
      const credibilityBonus = (article.metadata?.credibilityScore || 75) / 100
      const freshnessBonus = calculateFreshnessScore(article.publishedAt)
      const engagementBonus = calculateEngagementScore(article)

      const relevanceScore = (titleScore + summaryScore) * credibilityBonus * freshnessBonus * engagementBonus

      return { ...article, relevanceScore }
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
}

function calculateFreshnessScore(publishedAt) {
  const now = new Date()
  const articleDate = new Date(publishedAt)
  const hoursDiff = (now - articleDate) / (1000 * 60 * 60)

  if (hoursDiff <= 1) return 1.5 // Very fresh
  if (hoursDiff <= 6) return 1.3
  if (hoursDiff <= 24) return 1.1
  if (hoursDiff <= 168) return 1.0 // 1 week
  return 0.8 // Older articles
}

function calculateEngagementScore(article) {
  const score = article.metadata?.score || 0
  const comments = article.metadata?.comments || 0

  if (score > 100 || comments > 50) return 1.3
  if (score > 50 || comments > 20) return 1.2
  if (score > 10 || comments > 5) return 1.1
  return 1.0
}

export async function getSourcePerformanceMetrics() {
  const sources = [
    { name: "TechCrunch", fetcher: getTechCrunchNews },
    { name: "BBC", fetcher: getBBCNews },
    { name: "Hacker News", fetcher: getHackerNews },
    { name: "Reddit", fetcher: getRedditNews },
    { name: "CNN", fetcher: getCNNNews },
    { name: "Reuters", fetcher: getReutersNews },
    { name: "The Guardian", fetcher: getGuardianNews },
  ]

  const metrics = []

  for (const source of sources) {
    const startTime = Date.now()
    try {
      const articles = await source.fetcher()
      const endTime = Date.now()

      metrics.push({
        source: source.name,
        status: "success",
        articleCount: articles.length,
        responseTime: endTime - startTime,
        averageCredibility: calculateAverageCredibility(articles),
        categories: getCategoryDistribution(articles),
        lastUpdated: new Date().toISOString(),
      })
    } catch (error) {
      metrics.push({
        source: source.name,
        status: "error",
        error: error.message,
        responseTime: Date.now() - startTime,
        lastUpdated: new Date().toISOString(),
      })
    }
  }

  return metrics
}

function calculateAverageCredibility(articles) {
  const scores = articles.map((a) => a.metadata?.credibilityScore || 75)
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

function getCategoryDistribution(articles) {
  const categories = {}
  articles.forEach((article) => {
    const category = article.metadata?.category || "General"
    categories[category] = (categories[category] || 0) + 1
  })
  return categories
}
