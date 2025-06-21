import axios from "axios"
import * as cheerio from "cheerio"

export async function getCNNNews() {
  try {
    const response = await axios.get("https://www.cnn.com/", {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const $ = cheerio.load(response.data)
    const articles = []

    // Multiple selectors for better coverage
    const selectors = [
      'a[data-link-type="article"]',
      ".container__headline a",
      ".cd__headline a",
      'h3 a[href*="/2024/"], h3 a[href*="/2025/"]',
      ".card-media__over-text a",
    ]

    selectors.forEach((selector) => {
      $(selector).each((index, element) => {
        const $element = $(element)
        const title = $element.text().trim() || $element.find("span").text().trim()
        const url = $element.attr("href")

        if (title && url && title.length > 10 && !articles.some((a) => a.title === title)) {
          // Extract image if available
          const $parent = $element.closest(".card, .container, .cd")
          const imageUrl = $parent.find("img").attr("src") || $parent.find("img").attr("data-src")

          articles.push({
            title,
            url: url.startsWith("http") ? url : `https://www.cnn.com${url}`,
            summary: "CNN News article",
            publishedAt: new Date().toISOString(),
            source: "CNN",
            metadata: {
              imageUrl: imageUrl || null,
              category: extractCategoryFromUrl(url),
            },
          })
        }
      })
    })

    return articles.slice(0, 20)
  } catch (error) {
    console.error("Error scraping CNN:", error.message)
    throw new Error(`Failed to fetch CNN news: ${error.message}`)
  }
}

function extractCategoryFromUrl(url) {
  const categories = ["politics", "business", "tech", "health", "entertainment", "sports", "world"]
  for (const category of categories) {
    if (url.includes(`/${category}/`)) {
      return category
    }
  }
  return "general"
}
