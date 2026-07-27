# ChatGPT to PDF Exporter 📄

A full-stack web application that allows users to extract shared ChatGPT conversations and export them into beautifully formatted PDF documents. Built with React (Vite) and an Express.js serverless backend.

(Note :- Side / Hobby project)

**🔴 Live Demo:** [View on Vercel](https://chat-gpt-pdf-exporter.vercel.app/)

---

## ✨ Features

* **Direct URL Extraction:** Paste any public `chatgpt.com/share/*` link to instantly fetch the conversation.
* **Smart Fallbacks:** Uses direct JSON extraction with an automatic fallback to HTML scraping if the primary API fails.
* **PDF Generation:** Converts the extracted chat into a clean, readable, and printable PDF document.
* **Serverless Backend:** Configured to run flawlessly on Vercel's Serverless Functions.

## 🛠️ Tech Stack

* **Frontend:** React, Vite, CSS
* **Backend:** Node.js, Express.js
* **Deployment:** Vercel

---

## 🚀 Local Development

To run this project locally, you will need to use the Vercel CLI to properly emulate the serverless backend environment.

### 1. Install Dependencies
```bash
npm install