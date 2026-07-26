function sanitizeText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  return (
    rawText
      // Remove Unicode Private Use Area tool blocks (e.g. image_group{...})
      .replace(/[\uE000-\uF8FF][\s\S]*?([\uE000-\uF8FF]|$)/g, "")
      .replace(/[\s\S]*?/g, "")
      .replace(/[]/g, "")
      // Remove markdown image tags so images only render in the selected stack below
      .replace(/!\[.*?\]\((.*?)\)/g, "")
      .trim()
  );
}

function findImageUrlsInObject(obj, foundUrls = new Set(), depth = 0) {
  if (!obj || depth > 8) return foundUrls;

  if (typeof obj === "string") {
    // 1. Direct image URLs or signed storage URLs
    if (
      /^https?:\/\/[^\s]+$/i.test(obj) &&
      (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(obj) ||
        obj.includes("oaiusercontent.com") ||
        obj.includes("blob.core.windows.net") ||
        obj.includes("dalle"))
    ) {
      foundUrls.add(obj);
    }

    // 2. Markdown image URLs ![alt](url)
    const mdMatches = obj.matchAll(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g);
    for (const match of mdMatches) {
      foundUrls.add(match[1]);
    }

    // 3. File service fallback
    if (obj.startsWith("file-service://")) {
      const fileId = obj.replace("file-service://", "");
      foundUrls.add(`https://files.oaiusercontent.com/${fileId}`);
    }
  } else if (typeof obj === "object" && obj !== null) {
    // Direct key inspections
    const candidate =
      obj.download_url ||
      obj.url ||
      (typeof obj.image_url === "string"
        ? obj.image_url
        : obj.image_url?.url) ||
      obj.asset_pointer;

    if (candidate && typeof candidate === "string") {
      if (candidate.startsWith("http")) {
        foundUrls.add(candidate);
      } else if (candidate.startsWith("file-service://")) {
        const fileId = candidate.replace("file-service://", "");
        foundUrls.add(`https://files.oaiusercontent.com/${fileId}`);
      }
    }

    // Recursively scan object properties
    for (const value of Object.values(obj)) {
      findImageUrlsInObject(value, foundUrls, depth + 1);
    }
  }

  return foundUrls;
}

export function parseChatPayload(data) {
  const { title, conversation } = data;
  const rawMessages = [];
  const extractedImages = [];

  let imgCount = 0;

  if (Array.isArray(conversation)) {
    conversation.forEach((item) => {
      const messageObj = item.message || item;
      const role = messageObj.author?.role;

      // Allow user, assistant, and tool messages (where images live)
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

      // Extract all image URLs inside this message node
      const urlSet = findImageUrlsInObject(messageObj);
      const imagesInMessage = [];

      urlSet.forEach((url) => {
        imgCount++;
        const imgObj = { id: `img_${imgCount}`, url, selected: true };
        imagesInMessage.push(imgObj);
        extractedImages.push(imgObj);
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

  // Group adjacent tool outputs into assistant message bubbles
  const messages = [];
  rawMessages.forEach((msg) => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      msg.role === "assistant"
    ) {
      const prev = messages[messages.length - 1];
      if (msg.text)
        prev.text = prev.text ? `${prev.text}\n\n${msg.text}` : msg.text;
      if (msg.images.length > 0) prev.images.push(...msg.images);
    } else {
      messages.push(msg);
    }
  });

  return {
    title: title || "ChatGPT Conversation",
    date: new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date()),
    messages,
    extractedImages,
  };
}
