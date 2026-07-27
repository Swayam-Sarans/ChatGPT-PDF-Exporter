import express from "express";
import cors from "cors";
import { extractConversationData } from "./chat-extractor.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/fetch-chat", async (req, res) => {
  const { url } = req.body;

  if (
    !url ||
    (!url.includes("chatgpt.com/share") &&
      !url.includes("chat.openai.com/share"))
  ) {
    return res.status(400).json({ error: "Invalid ChatGPT shared URL" });
  }

  try {
    const uuidMatch = url.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    const shareId = uuidMatch ? uuidMatch[1] : null;

    let extractedData = null;

    // Direct JSON Endpoint Query
    if (shareId) {
      try {
        const apiRes = await fetch(
          `https://chatgpt.com/backend-api/share/${shareId}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Accept: "application/json",
            },
          },
        );

        if (apiRes.ok) {
          const json = await apiRes.json();
          extractedData = extractConversationData(json);
        }
      } catch (e) {
        console.log("Direct API query failed, falling back to page scraper...");
      }
    }

    // Fallback HTML Scraper
    if (!extractedData || !extractedData.conversation?.length) {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`ChatGPT returned HTTP status ${response.status}`);
      }

      const html = await response.text();
      const scriptMatches =
        html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || [];

      for (const scriptTag of scriptMatches) {
        if (
          scriptTag.includes("serverResponse") ||
          scriptTag.includes("linear_conversation") ||
          scriptTag.includes("mapping")
        ) {
          const startIdx = scriptTag.indexOf("{");
          const endIdx = scriptTag.lastIndexOf("}");
          if (startIdx !== -1 && endIdx !== -1) {
            try {
              const candidate = scriptTag.substring(startIdx, endIdx + 1);
              extractedData = extractConversationData(JSON.parse(candidate));
              if (extractedData && extractedData.conversation?.length) break;
            } catch (e) {}
          }
        }
      }
    }

    if (!extractedData || !extractedData.conversation?.length) {
      return res.status(422).json({
        error:
          "Unable to extract chat content. Ensure the share link is public and accessible.",
      });
    }

    res.json(extractedData);
  } catch (err) {
    console.error("API Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// app.listen(3001, () => {
//   console.log("🚀 Backend running on http://localhost:3001");
// });
module.exports = app;
