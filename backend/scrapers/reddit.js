import axios from "axios"

export async function getRedditNews() {
  try {
    // Use Reddit JSON API for programming subreddit
    const response = await axios.get("https://www.reddit.com/r/programming/hot.json?limit=25", {
      timeout: 10000,
      headers: {
        "User-Agent": "NewsAggregator/2.0 (Educational Project)",
      },
    })

    const posts = response.data.data.children

    const articles = posts
      .filter((post) => !post.data.stickied && post.data.url && post.data.title)
      .map((post) => {
        const data = post.data
        return {
          title: data.title,
          url: data.url.startsWith("/r/") ? `https://reddit.com${data.url}` : data.url,
          summary: `${data.score} upvotes | ${data.num_comments} comments | Posted by u/${data.author}`,
          publishedAt: new Date(data.created_utc * 1000).toISOString(),
          source: "Reddit",
          metadata: {
            score: data.score,
            comments: data.num_comments,
            author: data.author,
            subreddit: data.subreddit,
            thumbnail: data.thumbnail !== "self" ? data.thumbnail : null,
          },
        }
      })

    return articles.slice(0, 20)
  } catch (error) {
    console.error("Error fetching Reddit:", error.message)
    throw new Error(`Failed to fetch Reddit news: ${error.message}`)
  }
}
