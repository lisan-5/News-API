import axios from "axios"
import * as cheerio from "cheerio"

export async function getTechCrunchNews() {
  try {
    const response = await axios.get("https://techcrunch.com/", {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const $ = cheerio.load(response.data)
    const articles = []

    // Enhanced selectors for better coverage
    const selectors = [
      ".post-block",
      ".river-block",
      "[class*='post-']",
      ".wp-block-tc23-post-picker",
      ".featured-story",
    ]

    selectors.forEach((selector) => {
      $(selector).each((index, element) => {
        const $element = $(element)

        // Multiple title selectors
        const titleSelectors = ["h2 a", "h3 a", ".post-block__title__link", "a[class*='title']", ".headline a"]
        let title = ""
        let url = ""

        for (const titleSelector of titleSelectors) {
          const $titleElement = $element.find(titleSelector).first()
          if ($titleElement.length) {
            title = $titleElement.text().trim()
            url = $titleElement.attr("href")
            break
          }
        }

        if (!title || !url) return

        const summary = $element.find(".post-block__content, .excerpt, .post-excerpt").text().trim()
        const imageUrl = $element.find("img").attr("src") || $element.find("img").attr("data-src")
        const author = $element.find(".author, [class*='author']").text().trim()

        if (title && url && !articles.some((a) => a.title === title)) {
          articles.push({
            title,
            url: url.startsWith("http") ? url : `https://techcrunch.com${url}`,
            summary: summary || "TechCrunch article",
            publishedAt: new Date().toISOString(),
            source: "TechCrunch",
            metadata: {
              imageUrl: imageUrl || null,
              author: author || null,
              category: "technology",
            },
          })
        }
      })
    })

    return articles.slice(0, 20) // Return top 20 articles
  } catch (error) {
    console.error("Error scraping TechCrunch:", error.message)
    throw new Error(`Failed to fetch TechCrunch news: ${error.message}`)
  }
}
