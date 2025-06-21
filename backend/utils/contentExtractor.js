import axios from "axios"
import * as cheerio from "cheerio"

export async function extractArticleContent(url, source) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const $ = cheerio.load(response.data)

    // Remove unwanted elements
    $("script, style, nav, header, footer, .ad, .advertisement, .social-share").remove()

    let content = ""
    let images = []

    // Source-specific content extraction
    switch (source.toLowerCase()) {
      case "techcrunch":
        content = $(".article-content, .entry-content, .post-content").text().trim()
        images = extractImages($, ".article-content img, .entry-content img")
        break
      case "bbc":
        content = $('[data-component="text-block"], .story-body__inner').text().trim()
        images = extractImages($, ".story-body img, [data-component='image-block'] img")
        break
      case "cnn":
        content = $(".zn-body__paragraph, .pg-rail-tall__body").text().trim()
        images = extractImages($, ".media__image img, .el__image img")
        break
      default:
        // Generic extraction
        content = $("article, .content, .post, .entry, main").first().text().trim()
        images = extractImages($, "article img, .content img, main img")
    }

    // Clean up content
    content = content.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim().substring(0, 2000) // Limit content length

    return {
      content: content || "Content extraction not available",
      images: images.slice(0, 5), // Limit to 5 images
      wordCount: content.split(" ").length,
      readingTime: Math.ceil(content.split(" ").length / 200), // Assume 200 WPM
    }
  } catch (error) {
    console.error(`Content extraction failed for ${url}:`, error.message)
    return {
      content: "Content extraction failed",
      images: [],
      wordCount: 0,
      readingTime: 0,
    }
  }
}

function extractImages($, selector) {
  const images = []
  $(selector).each((index, element) => {
    const src = $(element).attr("src") || $(element).attr("data-src")
    const alt = $(element).attr("alt") || ""

    if (src && !src.includes("data:image") && !src.includes("placeholder")) {
      images.push({
        url: src.startsWith("http") ? src : `https:${src}`,
        alt: alt.trim(),
      })
    }
  })
  return images
}
