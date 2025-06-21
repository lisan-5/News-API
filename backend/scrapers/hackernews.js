import axios from "axios"

export async function getHackerNews() {
  try {
    // Use Hacker News API instead of scraping
    const topStoriesResponse = await axios.get("https://hacker-news.firebaseio.com/v0/topstories.json", {
      timeout: 10000,
    })

    const topStoryIds = topStoriesResponse.data.slice(0, 20) // Get top 20 stories

    const storyPromises = topStoryIds.map(async (id) => {
      try {
        const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        const story = storyResponse.data

        return {
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          summary: `Score: ${story.score} | Comments: ${story.descendants || 0}`,
          publishedAt: new Date(story.time * 1000).toISOString(),
          source: "Hacker News",
        }
      } catch (error) {
        console.error(`Error fetching story ${id}:`, error.message)
        return null
      }
    })

    const stories = await Promise.all(storyPromises)
    return stories.filter((story) => story !== null)
  } catch (error) {
    console.error("Error fetching Hacker News:", error.message)
    throw new Error(`Failed to fetch Hacker News: ${error.message}`)
  }
}
