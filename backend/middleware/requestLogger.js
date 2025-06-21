const requestStats = {
  totalRequests: 0,
  endpointStats: new Map(),
  errorCount: 0,
  averageResponseTime: 0,
  startTime: Date.now(),
}

export function requestLogger(req, res, next) {
  const startTime = Date.now()
  requestStats.totalRequests++

  // Track endpoint usage
  const endpoint = req.path
  const currentStats = requestStats.endpointStats.get(endpoint) || { count: 0, totalTime: 0 }
  requestStats.endpointStats.set(endpoint, {
    count: currentStats.count + 1,
    totalTime: currentStats.totalTime,
  })

  // Override res.end to capture response time
  const originalEnd = res.end
  res.end = function (...args) {
    const responseTime = Date.now() - startTime

    // Update stats
    const stats = requestStats.endpointStats.get(endpoint)
    stats.totalTime += responseTime
    stats.averageTime = Math.round(stats.totalTime / stats.count)

    // Update global average
    requestStats.averageResponseTime = Math.round(
      Array.from(requestStats.endpointStats.values()).reduce((sum, stat) => sum + stat.totalTime, 0) /
        requestStats.totalRequests,
    )

    if (res.statusCode >= 400) {
      requestStats.errorCount++
    }

    originalEnd.apply(this, args)
  }

  next()
}

export function getRequestStats() {
  const uptime = Date.now() - requestStats.startTime
  const requestsPerMinute = Math.round((requestStats.totalRequests / (uptime / 1000)) * 60)

  return {
    ...requestStats,
    uptime,
    requestsPerMinute,
    errorRate: Math.round((requestStats.errorCount / requestStats.totalRequests) * 100),
    endpointStats: Object.fromEntries(requestStats.endpointStats),
  }
}
