import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPreview({ chatData, selectedImageIds }) {
  if (!chatData) return null;

  const urlToIdMap = chatData.urlToIdMap || {};

  return (
    <div id="chat-preview-container">
      {/* Header Section */}
      <section id="chatgpt-pdf-export-header">
        <div className="export-badge">CHATGPT STUDY NOTES</div>
        <h1>{chatData.title}</h1>
        <p className="export-subtitle">Exported on {chatData.date}</p>
      </section>

      {/* Messages */}
      {chatData.messages.map((msg) => {
        return (
          <article key={msg.id} className="pdf-article">
            <div data-message-author-role={msg.role}>
              <div className="pdf-role-label">
                {msg.role === "user" ? "YOU" : "CHATGPT"}
              </div>

              {msg.text && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ src, alt }) => {
                      if (!src) return null;

                      const imgId = urlToIdMap[src];

                      // Hide the image entirely if it is deselected in the ImageSelector
                      if (imgId && !selectedImageIds.has(imgId)) {
                        return null;
                      }

                      // Render image INLINE where it naturally falls in the text
                      return (
                        <span
                          className="pdf-split-image-wrapper"
                          style={{ display: "block", margin: "16px 0" }}
                        >
                          <img
                            src={src}
                            alt={alt || "ChatGPT Diagram"}
                            referrerPolicy="no-referrer"
                          />
                        </span>
                      );
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
