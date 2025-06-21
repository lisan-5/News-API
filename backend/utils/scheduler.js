import cron from "node-cron"
import { clearCache, cleanExpiredCache } from "./cache.js"
import { getTechCrunchNews, getBBCNews, getHackerNews, getRedditNews, getCNNNews } from "../scrapers/index.js"

export function scheduleDataRefresh() {
  // Clear cache every 30 minutes
  cron.schedule("*/30 * * * *", () => {
    console.log("🔄 Clearing cache and refreshing data...")
    clearCache()
  })

  // Pre-fetch data every hour to warm the cache
  cron.schedule("0 * * * *", async () => {
    console.log("🔥 Pre-fetching data to warm cache...")

    try {
      await Promise.allSettled([getTechCrunchNews(), getBBCNews(), getHackerNews(), getRedditNews(), getCNNNews()])
      console.log("✅ Cache warmed successfully")
    } catch (error) {
      console.error("❌ Error warming cache:", error.message)
    }
  })

  // Clean expired cache entries every 2 hours
  cron.schedule("0 */2 * * *", () => {
    console.log("🧹 Cleaning expired cache entries...")
    const cleaned = cleanExpiredCache()
    console.log(`✅ Cleaned ${cleaned} expired cache entries`)
  })

  console.log("⏰ Scheduled tasks initialized")
}
