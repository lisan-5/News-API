import axios from "axios"
import * as cheerio from "cheerio"

export async function getBBCNews() {
  try {
    const response = await axios.get("https://www.bbc.com/news", {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const $ = cheerio.load(response.data)
    const articles = []

    // Enhanced selectors for BBC
    const selectors = [
      '[data-testid="card-headline"]',
      ".gs-c-promo-heading",
      ".media__link",
      ".gs-c-promo",
      "[class*='promo']",
    ]

    selectors.forEach((selector) => {
      $(selector).each((index, element) => {
        const $element = $(element)
        let $link = $element.find("a").first()

        if (!$link.length && $element.is("a")) {
          $link = $element
        }

        const title = $link.text().trim() || $link.attr("aria-label") || $element.find("h3, h2, h1").text().trim()
        const url = $link.attr("href")

        if (!title || !url || title.length < 10) return

        const summary = $element.find(".gs-c-promo-summary, .media__summary, p").first().text().trim()
        const imageUrl = $element.find("img").attr("src") || $element.find("img").attr("data-src")
        const category = extractBBCCategory($element)

        if (!articles.some((a) => a.title === title)) {
          articles.push({
            title,
            url: url.startsWith("http") ? url : `https://www.bbc.com${url}`,
            summary: summary || "BBC News article",
            publishedAt: new Date().toISOString(),
            source: "BBC",
            metadata: {
              imageUrl: imageUrl || null,
              category: category || "general",
            },
          })
        }
      })
    })

    function extractBBCCategory($element) {
      const categoryClasses = $element.attr("class") || ""
      const categories = ["sport", "business", "tech", "science", "health", "entertainment"]

      for (const category of categories) {
        if (categoryClasses.includes(category)) {
          return category
        }
      }
      return "general"
    }

    // Remove duplicates
    const uniqueArticles = articles.filter(
      (article, index, self) => index === self.findIndex((a) => a.title === article.title),
    )

    return uniqueArticles.slice(0, 20)
  } catch (error) {
    console.error("Error scraping BBC:", error.message)
    throw new Error(`Failed to fetch BBC news: ${error.message}`)
  }
}
