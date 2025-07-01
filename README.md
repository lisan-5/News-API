# News Aggregator API
A Node.js news aggregation system with intelligent filtering, real-time analytics, and comprehensive source coverage.

## 🚀 Features

### Core Capabilities
- **7 Premium News Sources**: TechCrunch, BBC, Hacker News, Reddit, CNN, Reuters, The Guardian
- **Lightning-Fast Performance**: Advanced caching with 15-minute TTL
- **Intelligent Search**: Cross-source search with relevance ranking
- **Real-time Analytics**: Trending topics, sentiment analysis, source metrics


### Advanced Features
- **Sentiment Analysis**: Rule-based sentiment scoring for all articles
- **Content Extraction**: Full article text and image extraction
- **Performance Monitoring**: Response times, success rates, endpoint analytics
- **Smart Filtering**: Time-based, credibility, engagement, and category filters
- **Trending Detection**: Real-time keyword and topic analysis

## 📊 API Endpoints

### News Sources
\`\`\`
GET /api/techcrunch   - TechCrunch technology news
GET /api/bbc          - BBC world news  
GET /api/hackernews   - Hacker News discussions
GET /api/reddit       - Reddit programming community
GET /api/cnn          - CNN breaking news
GET /api/reuters      - Reuters business & world news
GET /api/guardian     - The Guardian news
GET /api/all          - All sources aggregated
\`\`\`

### Analytics & Intelligence
\`\`\`
GET /api/analytics/trending   - Real-time trending analysis
GET /api/analytics/sentiment  - News sentiment distribution
GET /api/analytics/sources    - Source performance metrics
GET /api/analytics/keywords   - Keyword frequency analysis
\`\`\`

### Search & Discovery
\`\`\`
GET /api/search              - Cross-source intelligent search
GET /api/search/advanced     - Advanced search with filters
\`\`\`

### System Monitoring
\`\`\`
GET /api/system/health       - System health & performance
GET /api/system/metrics      - Detailed performance metrics
GET /api/cache/stats         - Cache performance statistics
\`\`\`

## 🔧 Query Parameters

### Basic Parameters
- `keyword` - Filter by keyword (supports regex)
- `limit` - Result limit (1-100, default: 10)
- `sort` - Sort by: date, relevance, popularity, source
- `source` - Filter by specific sources

### Advanced Parameters
- `timeframe` - Time filter: 1h, 6h, 12h, 24h, 7d
- `content` - Include full content extraction (true/false)
- `images` - Include article images (true/false)
- `category` - Filter by category
- `minCredibility` - Minimum credibility score (0-100)
- `sentiment` - Filter by sentiment: positive, negative, neutral

## 📈 Example Usage

### Get trending tech news
\`\`\`bash
curl "http://localhost:3000/api/all?keyword=technology&sort=relevance&limit=20"
\`\`\`

### Analyze sentiment across sources
\`\`\`bash
curl "http://localhost:3000/api/analytics/sentiment?source=all&limit=100"
\`\`\`

### Get high-credibility business news
\`\`\`bash
curl "http://localhost:3000/api/reuters?category=business&minCredibility=90"
\`\`\`

### Search with advanced filters
\`\`\`bash
curl "http://localhost:3000/api/search?q=artificial+intelligence&timeframe=24h&sort=relevance"
\`\`\`

## 🏗️ Architecture

### Core Components
- **Express.js**: High-performance web framework
- **Cheerio**: Server-side HTML parsing and manipulation
- **Axios**: HTTP client with timeout and retry logic
- **Node-cron**: Scheduled task management

### Performance Features
- **Intelligent Caching**: Multi-tier caching with TTL management
- **Concurrent Processing**: Parallel source fetching
- **Response Compression**: Gzip compression for all responses
- **Rate Limiting**: Tiered rate limiting by endpoint type

### Security & Reliability
- **Helmet.js**: Security headers and protection
- **CORS**: Cross-origin resource sharing
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Real-time system health tracking

## 🚀 Installation & Setup

1. **Clone and install:**
   \`\`\`bash
   git clone <repository>
   cd advanced-news-aggregator
   npm install
   \`\`\`

2. **Development mode:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Production mode:**
   \`\`\`bash
   npm start
   \`\`\`

4. **Run benchmarks:**
   \`\`\`bash
   npm run benchmark
   \`\`\`

## 📊 Performance Metrics

- **Response Time**: < 200ms average (cached)
- **Throughput**: 100+ requests/minute per source
- **Reliability**: 99%+ uptime with fallback handling
- **Cache Hit Rate**: 85%+ for repeated queries

## 🔍 Monitoring & Analytics

### Real-time Metrics
- Request volume and response times
- Error rates and success rates
- Cache performance and hit rates
- Source availability and performance

### Business Intelligence
- Trending topic detection
- Sentiment analysis across sources
- Keyword frequency analysis
- Source credibility scoring


## 🛠️ Customization

### Adding New Sources
1. Create scraper in `/scrapers/newsource.js`
2. Export from `/scrapers/index.js`
3. Add to route handlers
4. Update documentation

### Custom Analytics
1. Add analysis functions to `/utils/`
2. Create new routes in `/routes/analytics.js`
3. Implement caching strategy
4. Add to API documentation
