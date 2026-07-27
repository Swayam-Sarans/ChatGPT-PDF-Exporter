import {
  extractConversationData,
  decodeReactRouterStreamContent,
} from "./chat-extractor.js";

export default async function handler(req, res) {
  // Support both query param and post body
  const url = req.query?.url || req.body?.url;

  if (
    !url ||
    (!url.includes("chatgpt.com/share") &&
      !url.includes("chat.openai.com/share"))
  ) {
    return res
      .status(400)
      .json({ error: "Invalid ChatGPT shared URL provided." });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page, status: ${response.status}`);
    }

    const html = await response.text();

    // Extract __NEXT_DATA__ script contents
    const match = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
    );
    let nextData = null;

    if (match) {
      try {
        nextData = JSON.parse(match[1]);
      } catch (err) {
        nextData = null;
      }
    }

    let extracted = extractConversationData(nextData);

    if (!extracted) {
      const streamMatch = html.match(
        /window\.__reactRouterContext\.streamController\.enqueue\((?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')\);/,
      );
      const rawStreamContent = streamMatch?.[1] || streamMatch?.[2];
      if (rawStreamContent) {
        const decodedStream = decodeReactRouterStreamContent(rawStreamContent);
        if (decodedStream) {
          try {
            const payload = JSON.parse(decodedStream);
            extracted = extractConversationData(payload);
          } catch (err) {}
        }
      }
    }

    if (!extracted) {
      return res.status(404).json({ error: "Conversation payload missing." });
    }

    return res.status(200).json(extracted);
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Failed to parse ChatGPT URL" });
  }
}
