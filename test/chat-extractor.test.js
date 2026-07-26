import test from "node:test";
import assert from "node:assert/strict";
import { extractConversationData } from "../api/chat-extractor.js";

test("extracts conversation data from nested ChatGPT payloads", () => {
  const payload = {
    props: {
      pageProps: {
        serverResponse: {
          data: {
            title: "Sample Chat",
            linear_conversation: [
              {
                message: {
                  author: { role: "user" },
                  content: { parts: ["Hello"] },
                },
              },
            ],
          },
        },
      },
    },
  };

  const result = extractConversationData(payload);

  assert.equal(result.title, "Sample Chat");
  assert.equal(result.conversation.length, 1);
});

test("falls back to mapping-based conversation trees", () => {
  const payload = {
    mapping: {
      1: {
        message: { author: { role: "assistant" }, content: { parts: ["Hi"] } },
      },
    },
    title: "Tree Chat",
  };

  const result = extractConversationData(payload);

  assert.equal(result.title, "Tree Chat");
  assert.equal(result.conversation.length, 1);
});
