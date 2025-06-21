export function errorHandler(err, req, res, next) {
  console.error("Error:", err.message)
  console.error("Stack:", err.stack)

  // Default error response
  let statusCode = 500
  let message = "Internal server error"

  // Handle specific error types
  if (err.message.includes("timeout")) {
    statusCode = 504
    message = "Request timeout - the news source is taking too long to respond"
  } else if (err.message.includes("ENOTFOUND") || err.message.includes("ECONNREFUSED")) {
    statusCode = 503
    message = "News source is currently unavailable"
  } else if (err.message.includes("Failed to fetch")) {
    statusCode = 502
    message = "Unable to fetch news from source"
  }

  res.status(statusCode).json({
    error: true,
    message,
    timestamp: new Date().toISOString(),
    endpoint: req.originalUrl,
  })
}
