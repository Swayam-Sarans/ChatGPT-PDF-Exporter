import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPreview({ chatData, selectedImageIds }) {
  if (!chatData) return null;

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
        const visibleImages = msg.images.filter((img) =>
          selectedImageIds.has(img.id),
        );

        return (
          <article key={msg.id} className="pdf-article">
            <div data-message-author-role={msg.role}>
              <div className="pdf-role-label">
                {msg.role === "user" ? "YOU" : "CHATGPT"}
              </div>

              {/* Message Body */}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Suppress inline markdown images so they only render via selected stack below
                  img: () => null,
                }}
              >
                {msg.text}
              </ReactMarkdown>

              {/* Stacked Selected Images One After Another */}
              {visibleImages.map((img) => (
                <div key={img.id} className="pdf-split-image-wrapper">
                  <img src={img.url} alt="ChatGPT Attachment" />
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
