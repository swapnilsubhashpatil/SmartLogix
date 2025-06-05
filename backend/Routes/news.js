const express = require("express");
const router = express.Router();
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const NewsHistory = require("../Database/newsHistorySchema");

router.get("/news", async (req, res) => {
  try {
    const { search, page = 1, searchMode = "direct" } = req.query;
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 5) {
      return res.status(400).json({ message: "Invalid page number" });
    }
    if (searchMode !== "direct" && searchMode !== "summarized") {
      return res.status(400).json({ message: "Invalid search mode" });
    }

    const today = new Date();
    const targetDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - (pageNum - 1)
      )
    );
    const formattedDate = targetDate.toISOString().split("T")[0];
    const fromDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - 4
      )
    )
      .toISOString()
      .split("T")[0];
    const toDate = today.toISOString().split("T")[0];

    let finalQuery =
      '"pandemic" OR "epidemic" OR "outbreak" OR "disease spread" OR "public health crisis" OR "geopolitical event" OR "political instability" OR "trade war" OR "sanctions" OR "natural disaster" OR "extreme weather" OR "environmental hazard"';
    let articles = [];

    if (search) {
      if (searchMode === "summarized") {
        // Process search query with Gemini for summarization
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `
          Summarize the following natural language search query into a concise, single sentence (10-15 words max) that captures the core topic or intent.
          Retain only essential keywords, unique identifiers, proper nouns (people, places, organizations), or specific event names.
          Exclude filler words, conversational elements, opinions, and vague terms.
          The output should be a clear, standalone query suitable for news search.

          Example: "What happened with the US China trade war tariffs in 2024?" → ("US China" OR "US China trade war" OR"tariffs 2024")

          Query: "${search}"
          Output only the summarized query, nothing else.
        `;
        const result = await model.generateContent(prompt);
        console.log(result.response.text());
        finalQuery = await result.response.text();
      } else {
        // Direct search: use the query as-is
        finalQuery = search;
      }
    } else {
      // Check MongoDB for cached default news
      const cachedNews = await NewsHistory.findOne({
        date: formattedDate,
        query: "default",
      });
      if (cachedNews) {
        return res.status(200).json({
          message: "News fetched from cache",
          articles: cachedNews.articles,
          totalResults: cachedNews.articles.length,
          query: finalQuery,
          fromDate,
          toDate,
        });
      }
    }

    // Fetch from NewsAPI
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: finalQuery,
        searchIn: "title",
        from: formattedDate,
        to: formattedDate,
        sortBy: "popularity",
        pageSize: 10,
        language: "en",
        apiKey: process.env.NEWS_API_KEY || "bb3643f430354705a77aca2adb82e330",
      },
    });

    articles = response.data.articles.map((article) => ({
      title: article.title || "No title available",
      link: article.url || "#",
      summary: article.description || "No summary available",
      date: article.publishedAt || new Date().toISOString(),
      source: article.source.name || "Unknown",
    }));

    // Cache news for default queries only
    if (!search && articles.length > 0) {
      await NewsHistory.findOneAndUpdate(
        { date: formattedDate, query: "default" },
        {
          date: formattedDate,
          query: "default",
          articles,
          timestamp: new Date(),
        },
        { upsert: true }
      );
    }

    res.status(200).json({
      message: articles.length
        ? "News fetched successfully"
        : `No news found for query: "${
            search || finalQuery
          }" on ${formattedDate}`,
      articles,
      totalResults: articles.length,
      query: search || finalQuery,
      fromDate,
      toDate,
    });
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res
      .status(500)
      .json({ message: "Failed to fetch news", error: error.message });
  }
});

router.post("/summarize", async (req, res) => {
  try {
    const { content, url } = req.body;
    if (!content || !url) {
      return res.status(400).json({ message: "Content and URL are required" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Summarize the following news article in 5-6 sentences, providing a general overview of its content:
      ${content}

      Then, provide actionable suggestions in a third-person paragraph for logistics providers to mitigate the impact of this event on their shipments.
      **Carefully analyze the article's content for direct or indirect mentions of shipping interruptions, regional disruptions, or supply chain impacts.**

      If the article explicitly details or strongly implies an impact on shipments in a specific region (e.g., road closures, port delays, political instability affecting trade, severe weather in a shipping lane, health-related travel restrictions), then provide specific, concise suggestions. Each suggestion should be 2-3 lines max and include the affected region. Examples:
      - "Logistics providers may consider delaying shipments to [Affected Region] due to [reason, e.g., severe flooding causing road closures] to avoid prolonged transit times and potential damage."
      - "For shipments destined for [Affected Region], it is advisable to explore alternative routes or modes of transport, such as [e.g., air freight instead of sea], to bypass [reason, e.g., port congestion]."
      - "Providers with existing shipments in [Affected Region] should advise clients of potential delays and monitor the situation closely, as [reason, e.g., ongoing protests] may cause further disruptions."

      If the article does NOT genuinely indicate any direct or indirect impact on shipping, supply chains, or trade in any identifiable region, state: "Logistics providers should note that based on current information, this event is not expected to impact shipments in any region. You may proceed with your logistics operations as planned."
    `;
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const [summary, suggestions] = text.split("\n\n");

    res.status(200).json({
      message: "Article summarized successfully",
      summary: summary || "Summary not available",
      suggestions: suggestions || "No suggestions available",
      url,
    });
  } catch (error) {
    console.error("Error summarizing news:", error.message);
    res
      .status(500)
      .json({ message: "Failed to summarize news", error: error.message });
  }
});

module.exports = router;
