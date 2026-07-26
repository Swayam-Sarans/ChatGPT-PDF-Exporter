import React, { useState } from "react";
import { Download, Link as LinkIcon, Loader2 } from "lucide-react";
import { parseChatPayload } from "./utils/chatParser";
import { triggerSinglePagePdfPrint } from "./utils/printPdf";
import ImageSelector from "./components/ImageSelector";
import ChatPreview from "./components/ChatPreview";

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatData, setChatData] = useState(null);
  const [images, setImages] = useState([]);

  const handleFetchChat = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/fetch-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch chat");

      const parsed = parseChatPayload(data);
      setChatData(parsed);
      setImages(parsed.extractedImages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleImage = (id) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img,
      ),
    );
  };

  const handleToggleAllImages = (status) => {
    setImages((prev) => prev.map((img) => ({ ...img, selected: status })));
  };

  const handleRemoveBrokenImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (chatData) {
      setChatData((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) => ({
          ...msg,
          images: msg.images.filter((img) => img.id !== id),
        })),
      }));
    }
  };

  const selectedImageIds = new Set(
    images.filter((img) => img.selected).map((img) => img.id),
  );

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      {/* Header */}
      <header className="no-print" style={styles.topBar}>
        <div style={styles.navInner}>
          <h2 style={{ margin: 0, fontSize: 18, color: "var(--pdf-text)" }}>
            ChatGPT PDF Generator
          </h2>
          {chatData && (
            <button
              onClick={triggerSinglePagePdfPrint}
              style={styles.exportBtn}
            >
              <Download size={16} /> Export Continuous PDF
            </button>
          )}
        </div>
      </header>

      {/* Input Form */}
      <div
        className="no-print"
        style={{
          maxWidth: 900,
          margin: "30px auto 10px auto",
          padding: "0 20px",
        }}
      >
        <form onSubmit={handleFetchChat} style={styles.form}>
          <div style={styles.inputWrapper}>
            <LinkIcon size={18} color="var(--pdf-muted)" />
            <input
              type="url"
              placeholder="Paste ChatGPT Share Link (e.g. https://chatgpt.com/share/...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? <Loader2 size={16} className="spin" /> : "Fetch Chat"}
          </button>
        </form>

        {error && (
          <p style={{ color: "#ff7b72", marginTop: 10, fontSize: 14 }}>
            {error}
          </p>
        )}
      </div>

      {/* Image Chooser Panel */}
      <ImageSelector
        images={images}
        onToggleImage={handleToggleImage}
        onToggleAll={handleToggleAllImages}
        onRemoveBrokenImage={handleRemoveBrokenImage}
      />

      {/* Chat & PDF Output */}
      <ChatPreview chatData={chatData} selectedImageIds={selectedImageIds} />
    </div>
  );
}

const styles = {
  topBar: {
    borderBottom: "1px solid var(--pdf-border)",
    background: "var(--pdf-surface)",
    padding: "16px 20px",
  },
  navInner: {
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--pdf-purple)",
    color: "#0d1117",
    fontWeight: 600,
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
  },
  form: {
    display: "flex",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "var(--pdf-surface)",
    border: "1px solid var(--pdf-border)",
    padding: "0 14px",
    borderRadius: 8,
  },
  input: {
    width: "100%",
    padding: "12px 0",
    background: "transparent",
    border: "none",
    color: "var(--pdf-text)",
    outline: "none",
    fontSize: 14,
  },
  submitBtn: {
    background: "var(--pdf-blue)",
    color: "#0d1117",
    fontWeight: 600,
    border: "none",
    padding: "0 20px",
    borderRadius: 8,
    cursor: "pointer",
  },
};
