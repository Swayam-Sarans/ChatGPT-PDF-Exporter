import React from "react";
import { Check, Image as ImageIcon, ImageOff } from "lucide-react";

export default function ImageSelector({
  images,
  onToggleImage,
  onToggleAll,
  onRemoveBrokenImage,
}) {
  if (!images || images.length === 0) {
    return (
      <div className="no-print" style={styles.emptyContainer}>
        <ImageOff size={16} color="var(--pdf-muted)" />
        <span style={{ color: "var(--pdf-muted)", fontSize: 13 }}>
          No images detected in this conversation.
        </span>
      </div>
    );
  }

  const allSelected = images.every((img) => img.selected);

  return (
    <div className="no-print" style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ImageIcon size={18} color="#bc8cff" />
          <h3 style={styles.title}>Images Found ({images.length})</h3>
        </div>
        <button
          onClick={() => onToggleAll(!allSelected)}
          style={styles.selectAllBtn}
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>

      <p style={styles.subtitle}>
        Select which images to include in their corresponding chat sections:
      </p>

      <div style={styles.grid}>
        {images.map((img, index) => (
          <div
            key={img.id}
            onClick={() => onToggleImage(img.id)}
            style={{
              ...styles.card,
              borderColor: img.selected ? "#58a6ff" : "#30363d",
              opacity: img.selected ? 1 : 0.4,
            }}
          >
            <img
              src={img.url}
              alt={`Img #${index + 1}`}
              style={styles.thumbnail}
              onError={() => onRemoveBrokenImage && onRemoveBrokenImage(img.id)}
            />
            <div
              style={{
                ...styles.checkbox,
                background: img.selected ? "#58a6ff" : "transparent",
              }}
            >
              {img.selected && <Check size={12} color="#0d1117" />}
            </div>
            <span style={styles.label}>Img #{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "20px auto",
    padding: "20px",
    background: "var(--pdf-surface)",
    border: "1px solid var(--pdf-border)",
    borderRadius: 10,
  },
  emptyContainer: {
    maxWidth: 900,
    margin: "15px auto",
    padding: "12px 20px",
    background: "var(--pdf-surface)",
    border: "1px solid var(--pdf-border)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    color: "var(--pdf-text)",
    fontSize: 16,
  },
  subtitle: {
    color: "var(--pdf-muted)",
    fontSize: 13,
    margin: "8px 0 16px 0",
  },
  selectAllBtn: {
    background: "none",
    border: "1px solid var(--pdf-border)",
    color: "var(--pdf-blue)",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: 12,
  },
  card: {
    position: "relative",
    border: "2px solid",
    borderRadius: 8,
    padding: 6,
    background: "#0d1117",
    cursor: "pointer",
    textAlign: "center",
  },
  thumbnail: {
    width: "100%",
    height: 70,
    objectFit: "cover",
    borderRadius: 4,
  },
  checkbox: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 4,
    border: "1px solid var(--pdf-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    display: "block",
    fontSize: 11,
    color: "var(--pdf-muted)",
    marginTop: 4,
  },
};
