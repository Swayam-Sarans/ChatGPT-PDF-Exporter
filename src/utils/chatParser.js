function resolveAndCleanUrl(candidate) {
  if (!candidate || typeof candidate !== "string") return null;
  let url = candidate
    .trim()
    .replace(/^<|>$/g, "")
    .replace(/^["']|["']$/g, "");

  // Convert file-service pointers to public CDN URLs
  if (
    url.startsWith("file-service://") ||
    url.startsWith("sedo-file-service://")
  ) {
    const fileId = url.replace(
      /^(file-service:\/\/|sedo-file-service:\/\/)/,
      "",
    );
    return `https://files.oaiusercontent.com/${fileId}`;
  }

  if (/^file-[a-zA-Z0-9]{20,}/.test(url)) {
    return `https://files.oaiusercontent.com/${url}`;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/")
  ) {
    // Ignore search engines or share links
    if (
      url.includes("google.com/search") ||
      url.includes("chatgpt.com/share") ||
      url.includes("chat.openai.com/share")
    ) {
      return null;
    }
    return url;
  }

  return null;
}

function extractImageUrlsFromMessage(messageObj) {
  const urls = new Set();

  function addCandidate(raw) {
    const cleaned = resolveAndCleanUrl(raw);
    if (cleaned) urls.add(cleaned);
  }

  // Deep recursive walker to locate all image pointers in node tree
  function walk(node, depth = 0) {
    if (!node || depth > 10) return;

    if (typeof node === "string") {
      // Extract markdown images ![alt](url)
      const mdRegex = /!\[.*?\]\((.*?)\)/g;
      let match;
      while ((match = mdRegex.exec(node)) !== null) {
        addCandidate(match[1]);
      }
      if (
        node.startsWith("file-service://") ||
        node.startsWith("sedo-file-service://")
      ) {
        addCandidate(node);
      }
    } else if (typeof node === "object") {
      if (node.asset_pointer) addCandidate(node.asset_pointer);
      if (node.download_url) addCandidate(node.download_url);
      if (node.file_id) addCandidate(`file-service://${node.file_id}`);

      if (node.image_url) {
        if (typeof node.image_url === "string") addCandidate(node.image_url);
        else if (node.image_url.url) addCandidate(node.image_url.url);
      }

      if (node.url && typeof node.url === "string") {
        if (
          node.type === "image" ||
          node.content_type === "image_asset_pointer" ||
          node.width ||
          node.height ||
          /\.(png|jpe?g|webp|gif|svg)/i.test(node.url) ||
          node.url.includes("oaiusercontent") ||
          node.url.includes("blob.core")
        ) {
          addCandidate(node.url);
        }
      }

      for (const key of Object.keys(node)) {
        if (key === "parent" || key === "children") continue;
        walk(node[key], depth + 1);
      }
    }
  }

  walk(messageObj);
  return Array.from(urls);
}

function sanitizeText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  return rawText
    .replace(/[\uE000-\uF8FF][\s\S]*?([\uE000-\uF8FF]|$)/g, "")
    .replace(/[\s\S]*?/g, "")
    .replace(/[]/g, "")
    .replace(/!\[.*?\]\((.*?)\)/g, "")
    .trim();
}

export function parseChatPayload(data) {
  const { title, conversation } = data;
  const rawMessages = [];
  const extractedImages = [];
  const globalSeenUrls = new Set();

  let imgCount = 0;

  if (Array.isArray(conversation)) {
    conversation.forEach((item) => {
      const messageObj = item.message || item;
      const role = messageObj.author?.role;

      if (role !== "user" && role !== "assistant" && role !== "tool") return;

      let textContent = "";

      if (typeof messageObj.content === "string") {
        textContent += messageObj.content + "\n";
      } else if (typeof messageObj.content?.text === "string") {
        textContent += messageObj.content.text + "\n";
      }

      const parts = messageObj.content?.parts || [];
      parts.forEach((part) => {
        if (typeof part === "string") {
          textContent += part + "\n";
        } else if (typeof part === "object" && part !== null) {
          if (part.text && typeof part.text === "string") {
            textContent += part.text + "\n";
          }
        }
      });

      const imageUrls = extractImageUrlsFromMessage(messageObj);
      const imagesInMessage = [];

      imageUrls.forEach((url) => {
        if (!globalSeenUrls.has(url)) {
          globalSeenUrls.add(url);
          imgCount++;
          const imgObj = { id: `img_${imgCount}`, url, selected: true };
          imagesInMessage.push(imgObj);
          extractedImages.push(imgObj);
        }
      });

      const cleanText = sanitizeText(textContent);

      if (cleanText || imagesInMessage.length > 0) {
        rawMessages.push({
          id: messageObj.id || Math.random().toString(),
          role: role === "tool" ? "assistant" : role,
          text: cleanText,
          images: imagesInMessage,
        });
      }
    });
  }

  // Merge sequential assistant messages while maintaining exact inline image order
  const mergedMessages = [];
  rawMessages.forEach((msg) => {
    if (
      mergedMessages.length > 0 &&
      mergedMessages[mergedMessages.length - 1].role === "assistant" &&
      msg.role === "assistant"
    ) {
      const prev = mergedMessages[mergedMessages.length - 1];
      if (msg.text)
        prev.text = prev.text ? `${prev.text}\n\n${msg.text}` : msg.text;
      if (msg.images.length > 0) prev.images.push(...msg.images);
    } else {
      mergedMessages.push(msg);
    }
  });

  return {
    title: title || "ChatGPT Conversation",
    date: new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date()),
    messages: mergedMessages,
    extractedImages,
  };
}
