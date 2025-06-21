// Simple in-memory cache
const cache = new Map()

export function getCachedData(key) {
  const cached = cache.get(key)

  if (!cached) return null

  // Check if cache has expired
  if (Date.now() > cached.expiry) {
    cache.delete(key)
    return null
  }

  return cached.data
}

export function setCachedData(key, data, ttlMs = 15 * 60 * 1000) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  })
}

export function clearCache() {
  cache.clear()
}

export function getCacheStats() {
  const stats = {
    totalEntries: cache.size,
    entries: [],
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  }

  for (const [key, value] of cache.entries()) {
    stats.entries.push({
      key,
      size: JSON.stringify(value.data).length,
      expiresIn: Math.max(0, Math.floor((value.expiry - Date.now()) / 1000)),
      expired: Date.now() > value.expiry,
    })
  }

  return stats
}

export function cleanExpiredCache() {
  let cleaned = 0
  for (const [key, value] of cache.entries()) {
    if (Date.now() > value.expiry) {
      cache.delete(key)
      cleaned++
    }
  }
  return cleaned
}

export function getCacheHitRate() {
  // Simple hit rate tracking (you'd implement this with counters in a real app)
  return {
    hits: 0,
    misses: 0,
    hitRate: "0%",
    note: "Hit rate tracking would require persistent counters",
  }
}
