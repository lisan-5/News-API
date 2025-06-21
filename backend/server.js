import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import newsRoutes from "./routes/news.js"
import analyticsRoutes from "./routes/analytics.js"
import { scheduleDataRefresh } from "./utils/scheduler.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { requestLogger } from "./middleware/requestLogger.js"
import compression from "compression"
import morgan from "morgan"

const app = express()
const PORT = process.env.PORT || 3000

// Security and performance middleware
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(morgan("combined"))

// Rate limiting with different tiers
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Rate limit exceeded. Please try again later." },
})

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // More restrictive for search
  message: { error: "Search rate limit exceeded. Please try again later." },
})

app.use("/api/search", searchLimiter)
app.use(standardLimiter)
app.use(express.json())
app.use(requestLogger)

// Routes
app.use("/api", newsRoutes)
app.use("/api/analytics", analyticsRoutes)

// Enhanced root endpoint with comprehensive API documentation
app.get("/", (req, res) => {
  res.json({
    name: "Advanced News Aggregator API",
    version: "2.5.0",
    description: "Professional-grade news aggregation with intelligent filtering and analytics",
    author: "Your Name",
    endpoints: {
      news: {
        "/api/techcrunch": "TechCrunch technology news",
        "/api/bbc": "BBC world news",
        "/api/hackernews": "Hacker News tech discussions",
        "/api/reddit": "Reddit programming community",
        "/api/cnn": "CNN breaking news",
        "/api/reuters": "Reuters business & world news",
        "/api/guardian": "The Guardian news",
        "/api/all": "Aggregated news from all sources",
      },
      search: {
        "/api/search": "Cross-source intelligent search",
        "/api/search/advanced": "Advanced search with filters",
      },
      analytics: {
        "/api/analytics/trending": "Real-time trending analysis",
        "/api/analytics/sentiment": "News sentiment analysis",
        "/api/analytics/sources": "Source performance metrics",
        "/api/analytics/keywords": "Keyword frequency analysis",
      },
      utility: {
        "/api/cache/stats": "Cache performance statistics",
        "/api/system/health": "System health monitoring",
        "/api/system/metrics": "Performance metrics",
      },
    },
    queryParameters: {
      keyword: "Filter by keyword (supports regex)",
      limit: "Result limit (1-100, default: 10)",
      sort: "Sort by: date, relevance, popularity, source",
      content: "Include full content extraction",
      images: "Include article images",
      category: "Filter by category",
      source: "Filter by specific sources",
      timeframe: "Time filter: 1h, 6h, 12h, 24h, 7d",
      format: "Response format: json, rss, csv",
    },
    features: [
      "🚀 7 Premium News Sources",
      "⚡ Lightning-fast Caching System",
      "🔍 Advanced Search & Filtering",
      "📊 Real-time Analytics Dashboard",
      "🖼️ Smart Content Extraction",
      "📈 Trending Topic Detection",
      "⚙️ Performance Monitoring",
      "🛡️ Enterprise Security",
    ],
  })
})

// System health with detailed metrics
app.get("/api/system/health", (req, res) => {
  const memUsage = process.memoryUsage()
  res.json({
    status: "operational",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: process.uptime(),
      formatted: formatUptime(process.uptime()),
    },
    memory: {
      used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      cpuUsage: process.cpuUsage(),
    },
  })
})

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}d ${hours}h ${minutes}m`
}

// Error handling
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: ["/api/all", "/api/search", "/api/analytics/trending"],
  })
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully")
  process.exit(0)
})

// Start scheduled tasks
scheduleDataRefresh()

app.listen(PORT, () => {
  console.log(`🚀 Advanced News Aggregator running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/system/health`)
  console.log(`📰 Documentation: http://localhost:${PORT}/`)
  console.log(`⚡ Ready to aggregate news from 7 sources`)
})

export default app
