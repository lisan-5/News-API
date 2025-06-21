import axios from "axios"
import * as cheerio from "cheerio"

export async function getReutersNews() {
  try {
    const response = await axios.get("https://www.reuters.com/business/", {
      timeout: 12000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    const $ = cheerio.load(response.data)
    const articles = []

    // Reuters-specific selectors
    const selectors = [
      '[data-testid="Heading"]',
      ".story-title",
      '[data-module="ArticleList"] a',
      ".media-story-card__headline__eqhp9",
      '[data-testid="Body"] a',
    ]

    selectors.forEach((selector) => {
      $(selector).each((index, element) => {
        const $element = $(element)
        let title = ""
        let url = ""

        if ($element.is("a")) {
          title = $element.text().trim()
          url = $element.attr("href")
        } else {
          const $link = $element.find("a").first()
          title = $link.text().trim() || $element.text().trim()
          url = $link.attr("href")
        }

        if (!title || !url || title.length < 15) return

        // Extract additional metadata
        const $parent = $element.closest("[data-testid], .story-card, .media-story-card")
        const timestamp = $parent.find("time").attr("datetime") || $parent.find("[data-testid='timestamp']").text()
        const category = extractReutersCategory(url)
        const imageUrl = $parent.find("img").attr("src") || $parent.find("img").attr("data-src")

        if (!articles.some((a) => a.title === title)) {
          articles.push({
            title: cleanTitle(title),
            url: url.startsWith("http") ? url : `https://www.reuters.com${url}`,
            summary: `Reuters ${category} news`,
            publishedAt: parseReutersDate(timestamp) || new Date().toISOString(),
            source: "Reuters",
            metadata: {
              category,
              imageUrl: imageUrl || null,
              credibilityScore: 95, // Reuters high credibility
              region: extractRegionFromUrl(url),
            },
          })
        }
      })
    })

    return articles.slice(0, 25)
  } catch (error) {
    console.error("Error scraping Reuters:", error.message)
    throw new Error(`Failed to fetch Reuters news: ${error.message}`)
  }
}

function extractReutersCategory(url) {
  const categories = {
    business: "Business",
    technology: "Technology",
    markets: "Markets",
    world: "World",
    politics: "Politics",
    legal: "Legal",
    breakingviews: "Opinion",
    lifestyle: "Lifestyle",
  }

  for (const [key, value] of Object.entries(categories)) {
    if (url.includes(`/${key}/`)) return value
  }
  return "General"
}

function extractRegionFromUrl(url) {
  const regions = ["usa", "europe", "asia", "africa", "americas"]
  for (const region of regions) {
    if (url.includes(region)) return region.toUpperCase()
  }
  return "Global"
}

function parseReutersDate(dateString) {
  if (!dateString) return null
  try {
    return new Date(dateString).toISOString()
  } catch {
    return null
  }
}

function cleanTitle(title) {
  return title
    .replace(/\s+/g, " ")
    .replace(/^\W+|\W+$/g, "")
    .trim()
}
