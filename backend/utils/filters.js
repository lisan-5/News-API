import { getTechCrunchNews, getBBCNews, getHackerNews } from "../scrapers/index.js"

export function filterByKeyword(articles, keyword) {
  if (!keyword) return articles

  const searchTerm = keyword.toLowerCase()
  return articles.filter(
    (article) => article.title.toLowerCase().includes(searchTerm) || article.summary.toLowerCase().includes(searchTerm),
  )
}

export function limitResults(articles, limit) {
  if (!limit || limit <= 0) return articles
  return articles.slice(0, limit)
}

export function filterByDate(articles, dateString) {
  if (!dateString) return articles

  try {
    const targetDate = new Date(dateString)
    const targetDateString = targetDate.toDateString()

    return articles.filter((article) => {
      const articleDate = new Date(article.publishedAt)
      return articleDate.toDateString() === targetDateString
    })
  } catch (error) {
    console.error("Invalid date format:", dateString)
    return articles
  }
}

export function sortArticles(articles, sortBy = "date") {
  switch (sortBy.toLowerCase()) {
    case "date":
      return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    case "relevance":
      return articles.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    case "source":
      return articles.sort((a, b) => a.source.localeCompare(b.source))
    case "title":
      return articles.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return articles
  }
}

export function filterByCategory(articles, category) {
  if (!category) return articles

  return articles.filter((article) => article.metadata?.category?.toLowerCase() === category.toLowerCase())
}

export function filterBySource(articles, sources) {
  if (!sources || sources.length === 0) return articles

  const sourceArray = Array.isArray(sources) ? sources : [sources]
  return articles.filter((article) =>
    sourceArray.some((source) => article.source.toLowerCase() === source.toLowerCase()),
  )
}

export function addRelevanceScore(articles, query) {
  if (!query) return articles

  return articles.map((article) => {
    const titleMatches = (article.title.toLowerCase().match(new RegExp(query.toLowerCase(), "g")) || []).length
    const summaryMatches = (article.summary.toLowerCase().match(new RegExp(query.toLowerCase(), "g")) || []).length

    return {
      ...article,
      relevanceScore: titleMatches * 3 + summaryMatches * 1,
    }
  })
}

export async function searchAllSources(query, limit = 20) {
  try {
    const [techcrunch, bbc, hackernews] = await Promise.allSettled([getTechCrunchNews(), getBBCNews(), getHackerNews()])

    const allArticles = []

    if (techcrunch.status === "fulfilled") {
      allArticles.push(...techcrunch.value.map((article) => ({ ...article, source: "TechCrunch" })))
    }

    if (bbc.status === "fulfilled") {
      allArticles.push(...bbc.value.map((article) => ({ ...article, source: "BBC" })))
    }

    if (hackernews.status === "fulfilled") {
      allArticles.push(...hackernews.value.map((article) => ({ ...article, source: "Hacker News" })))
    }

    // Filter by search query
    let filteredArticles = filterByKeyword(allArticles, query)

    // Add relevance score
    filteredArticles = addRelevanceScore(filteredArticles, query)

    // Sort by relevance (simple scoring based on keyword frequency)
    // const scoredArticles = filteredArticles.map((article) => {
    //   const titleMatches = (article.title.toLowerCase().match(new RegExp(query.toLowerCase(), "g")) || []).length
    //   const summaryMatches = (article.summary.toLowerCase().match(new RegExp(query.toLowerCase(), "g")) || []).length

    //   return {
    //     ...article,
    //     relevanceScore: titleMatches * 2 + summaryMatches, // Title matches weighted more
    //   }
    // })

    // Sort by relevance score
    // scoredArticles.sort((a, b) => b.relevanceScore - a.relevanceScore)
    const sortedArticles = sortArticles(filteredArticles, "relevance")

    return limitResults(sortedArticles, limit)
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`)
  }
}
