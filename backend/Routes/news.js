const express = require("express");
const router = express.Router();
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const NewsHistory = require("../Database/newsHistorySchema");

router.get("/news", async (req, res) => {
  try {
    const { search, page = 1, searchMode = "direct" } = req.query;
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 4) {
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
        today.getUTCDate() - pageNum
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
    const toDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - 1
      )
    )
      .toISOString()
      .split("T")[0];

    let finalQuery =
      '"pandemic" OR "epidemic" OR "outbreak" OR "disease spread" OR "public health crisis" OR "geopolitical event" OR "political instability" OR "trade war" OR "sanctions" OR "natural disaster" OR "extreme weather" OR "environmental hazard"';
    let articles = [];

    if (search) {
      if (searchMode === "summarized") {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `
Summarize the following user query into 1 to 2 high-impact keywords or proper nouns for news search.
Focus on specific people, places, events, organizations, or major topics.
Remove filler words, dates, conversational phrases, and general context.
The goal is to extract core terms that will return the broadest relevant results from a news API.

Example: "What happened with the US-China trade war tariffs in 2024?" → ("us china tariffs")

Query: "${search}"
Return only the keywords.
`;

        const result = await model.generateContent(prompt);
        console.log(result.response.text());
        finalQuery = await result.response.text();
      } else {
        finalQuery = search;
      }
    } else {
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

    const apiParams = {
      q: finalQuery,
      searchIn: "title",
      sortBy: "popularity",
      pageSize: 10,
      language: "en",
      apiKey: process.env.NEWS_API_KEY || "bb3643f430354705a77aca2adb82e330",
      from: formattedDate,
      to: formattedDate,
    };

    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: apiParams,
    });

    articles = response.data.articles.map((article) => ({
      title: article.title || "No title available",
      link: article.url || "#",
      summary: article.description || "No summary available",
      date: article.publishedAt || new Date().toISOString(),
      source: article.source.name || "Unknown",
    }));

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
