import axios from "axios"
import * as cheerio from "cheerio"

export async function getGuardianNews() {
  try {
    const response = await axios.get("https://www.theguardian.com/international", {
      timeout: 12000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    })

    const $ = cheerio.load(response.data)
    const articles = []

    // Guardian-specific selectors
    const selectors = [
      ".fc-item__title a",
      ".headline a",
      '[data-link-name="article"] .fc-item__title a',
      ".fc-item__header a",
      ".u-faux-block-link__overlay",
    ]

    selectors.forEach((selector) => {
      $(selector).each((index, element) => {
        const $element = $(element)
        const title = $element.text().trim()
        const url = $element.attr("href")

        if (!title || !url || title.length < 10) return

        // Extract metadata from parent container
        const $container = $element.closest(".fc-item, .fc-container__inner")
        const section = $container.find(".fc-item__kicker").text().trim()
        const standfirst = $container.find(".fc-item__standfirst").text().trim()
        const imageUrl = $container.find("img").attr("src")
        const timestamp = $container.find("time").attr("datetime")

        if (!articles.some((a) => a.title === title)) {
          articles.push({
            title,
            url: url.startsWith("http") ? url : `https://www.theguardian.com${url}`,
            summary: standfirst || `The Guardian ${section || "news"}`,
            publishedAt: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
            source: "The Guardian",
            metadata: {
              section: section || "General",
              imageUrl: imageUrl || null,
              credibilityScore: 88,
              wordCount: estimateWordCount(standfirst),
            },
          })
        }
      })
    })

    return articles.slice(0, 25)
  } catch (error) {
    console.error("Error scraping Guardian:", error.message)
    throw new Error(`Failed to fetch Guardian news: ${error.message}`)
  }
}

function estimateWordCount(text) {
  if (!text) return 0
  return text.split(/\s+/).length * 15 // Estimate full article length
}
