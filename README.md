# ChatGPT to PDF Exporter 📄

A full-stack web application that allows users to extract shared ChatGPT conversations and export them into beautifully formatted PDF documents. Built with React (Vite) and an Express.js serverless backend.

> **Note:** This is a side/hobby project built to simplify saving and sharing ChatGPT conversations in a clean, printable format.

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

Since the backend uses **Vercel Serverless Functions**, use the Vercel CLI to run the project locally.

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

or

```bash
npx vercel
```

### 3. Start the Development Server

```bash
vercel dev
```

The application will be available at:

```
http://localhost:3000
```

The `vercel dev` command starts both the React frontend and the serverless backend locally, providing an environment similar to the production deployment.

---

## ⚙️ How It Works

1. User pastes a public ChatGPT Share URL.
2. Backend extracts the conversation data.
3. If direct JSON extraction fails, it automatically switches to HTML parsing.
4. Parsed conversation is returned to the frontend.
5. The conversation is rendered and exported as a beautifully formatted PDF.