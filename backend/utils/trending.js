export function analyzeTrending(articles) {
  const keywords = new Map()
  const sources = new Map()
  const categories = new Map()

  articles.forEach((article) => {
    // Extract keywords from titles
    const words = article.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !isStopWord(word))

    words.forEach((word) => {
      keywords.set(word, (keywords.get(word) || 0) + 1)
    })

    // Count sources
    sources.set(article.source, (sources.get(article.source) || 0) + 1)

    // Count categories
    if (article.metadata?.category) {
      categories.set(article.metadata.category, (categories.get(article.metadata.category) || 0) + 1)
    }
  })

  return {
    trendingKeywords: Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count, percentage: ((count / articles.length) * 100).toFixed(1) })),

    sourceDistribution: Array.from(sources.entries()).map(([source, count]) => ({
      source,
      count,
      percentage: ((count / articles.length) * 100).toFixed(1),
    })),

    categoryDistribution: Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / articles.length) * 100).toFixed(1),
    })),

    totalArticles: articles.length,
    analysisTimestamp: new Date().toISOString(),
  }
}

function isStopWord(word) {
  const stopWords = [
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
    "boy",
    "did",
    "its",
    "let",
    "put",
    "say",
    "she",
    "too",
    "use",
    "with",
    "have",
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
    "will",
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
    "own",
    "place",
    "right",
    "same",
    "seem",
    "small",
    "still",
    "such",
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
  ]
  return stopWords.includes(word.toLowerCase())
}
