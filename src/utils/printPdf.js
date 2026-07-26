export function triggerSinglePagePdfPrint() {
  const CONFIG = {
    pageWidthMm: 210,
    pageMarginMm: 12,
    pageHeightBufferMm: 8,
    maxSafePageHeightMm: 3000,
  };

  const previewEl = document.querySelector("#chat-preview-container");
  if (!previewEl) return window.print();

  const rect = previewEl.getBoundingClientRect();
  const contentHeightPx = Math.max(rect.height, 1);
  const contentWidthPx = Math.max(rect.width, 1);

  const printableWidthMm = CONFIG.pageWidthMm - CONFIG.pageMarginMm * 2;
  const mmPerCssPx = printableWidthMm / contentWidthPx;
  const measuredContentHeightMm = contentHeightPx * mmPerCssPx;

  const requestedPageHeightMm = Math.ceil(
    measuredContentHeightMm +
      CONFIG.pageMarginMm * 2 +
      CONFIG.pageHeightBufferMm,
  );

  const continuousPageHeightMm = Math.min(
    requestedPageHeightMm,
    CONFIG.maxSafePageHeightMm,
  );

  // Clean old dynamic style
  const existingStyle = document.getElementById(
    "chatgpt-continuous-page-style",
  );
  if (existingStyle) existingStyle.remove();

  const pageStyle = document.createElement("style");
  pageStyle.id = "chatgpt-continuous-page-style";
  pageStyle.textContent = `
    @page {
      size: ${CONFIG.pageWidthMm}mm ${continuousPageHeightMm}mm;
      margin: ${CONFIG.pageMarginMm}mm;
    }
  `;
  document.head.appendChild(pageStyle);

  window.print();
}
