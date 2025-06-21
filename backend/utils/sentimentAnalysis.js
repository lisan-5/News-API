// Simple rule-based sentiment analysis without external dependencies
const positiveWords = [
  "good",
  "great",
  "excellent",
  "amazing",
  "wonderful",
  "fantastic",
  "outstanding",
  "brilliant",
  "success",
  "win",
  "victory",
  "achievement",
  "breakthrough",
  "innovation",
  "growth",
  "profit",
  "gain",
  "rise",
  "boost",
  "improve",
  "upgrade",
  "advance",
  "progress",
  "positive",
  "optimistic",
  "confident",
  "strong",
  "robust",
  "healthy",
  "thriving",
  "flourishing",
]

const negativeWords = [
  "bad",
  "terrible",
  "awful",
  "horrible",
  "disaster",
  "crisis",
  "problem",
  "issue",
  "concern",
  "worry",
  "fear",
  "threat",
  "risk",
  "danger",
  "warning",
  "alert",
  "decline",
  "fall",
  "drop",
  "crash",
  "collapse",
  "failure",
  "loss",
  "deficit",
  "debt",
  "recession",
  "depression",
  "unemployment",
  "layoffs",
  "cuts",
  "reduction",
  "negative",
  "pessimistic",
  "weak",
  "poor",
  "struggling",
]

export function analyzeSentiment(text) {
  if (!text) return { score: 0, label: "neutral", confidence: 0 }

  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  let positiveScore = 0
  let negativeScore = 0

  words.forEach((word) => {
    if (positiveWords.includes(word)) positiveScore++
    if (negativeWords.includes(word)) negativeScore++
  })

  const totalSentimentWords = positiveScore + negativeScore
  if (totalSentimentWords === 0) {
    return { score: 0, label: "neutral", confidence: 0 }
  }

  const score = (positiveScore - negativeScore) / words.length
  const confidence = totalSentimentWords / words.length

  let label = "neutral"
  if (score > 0.02) label = "positive"
  else if (score < -0.02) label = "negative"

  return {
    score: Math.round(score * 1000) / 1000,
    label,
    confidence: Math.round(confidence * 100) / 100,
    details: {
      positiveWords: positiveScore,
      negativeWords: negativeScore,
      totalWords: words.length,
    },
  }
}

export function analyzeBatchSentiment(articles) {
  return articles.map((article) => ({
    ...article,
    sentiment: analyzeSentiment(`${article.title} ${article.summary}`),
  }))
}

export function getSentimentDistribution(articles) {
  const distribution = { positive: 0, negative: 0, neutral: 0 }
  const sentiments = []

  articles.forEach((article) => {
    const sentiment = analyzeSentiment(`${article.title} ${article.summary}`)
    distribution[sentiment.label]++
    sentiments.push(sentiment)
  })

  const total = articles.length
  return {
    distribution,
    percentages: {
      positive: Math.round((distribution.positive / total) * 100),
      negative: Math.round((distribution.negative / total) * 100),
      neutral: Math.round((distribution.neutral / total) * 100),
    },
    averageScore: sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length,
    totalArticles: total,
  }
}
