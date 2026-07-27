function normalizeConversation(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value.messages)) return value.messages;
  if (Array.isArray(value.conversation)) return value.conversation;
  if (Array.isArray(value.linear_conversation))
    return value.linear_conversation;

  return null;
}

export function extractConversationData(obj, seen = new Set()) {
  if (!obj || typeof obj !== "object" || seen.has(obj)) return null;

  const nextSeen = new Set(seen);
  nextSeen.add(obj);

  const title =
    typeof obj.title === "string" && obj.title.trim() ? obj.title : null;

  // Preserve user, assistant, and tool message nodes
  if (obj.mapping && typeof obj.mapping === "object") {
    const messages = Object.values(obj.mapping)
      .map((node) => node?.message)
      .filter((msg) => msg && msg.author?.role)
      .sort((a, b) => (a.create_time || 0) - (b.create_time || 0));

    if (messages.length > 0) {
      return {
        title: title || "ChatGPT Notes",
        conversation: messages,
      };
    }
  }

  const direct = normalizeConversation(obj);
  if (direct && direct.length > 0) {
    return {
      title: title || "ChatGPT Notes",
      conversation: direct,
    };
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const nested = extractConversationData(value, nextSeen);
      if (nested && nested.conversation?.length > 0) {
        return {
          ...nested,
          title: nested.title || title || "ChatGPT Notes",
        };
      }
    }
  }

  return null;
}

export function decodeReactRouterStreamContent(stream) {
  if (!stream || typeof stream !== "string") return null;

  try {
    // Undo JS string escaping
    const decoded = JSON.parse(`"${stream}"`);

    // Remove React Router framing if present
    const start = decoded.indexOf("{");
    const end = decoded.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      return decoded.slice(start, end + 1);
    }

    return decoded;
  } catch {
    return null;
  }
}
