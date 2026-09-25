# Deployment Guide: PrepKit AI

This guide walks you through deploying **PrepKit AI** on **Render** (Backend API) and **Vercel** (Next.js Frontend) completely on free tiers.

---

## Architecture Overview

```
+------------------------------------+           +------------------------------------+
|         Vercel (Frontend)          |  REST API |          Render (Backend)          |
|  https://prepkit-ai.vercel.app     | --------> |  https://prepkit-backend.onrender  |
|  - Next.js 16 (App Router)         |  (Bearer) |  - Node.js / Express API           |
|  - TailwindCSS, Lucide Icons       |           |  - Web Crawler, LLM Engine         |
+------------------------------------+           +------------------------------------+
                                                                    |
                                                                    v
                                                 +------------------------------------+
                                                 |        MongoDB Atlas (Free)        |
                                                 |  Users, Kits & Practice Tracking   |
                                                 +------------------------------------+
```

---

## Prerequisites

1. Your repository pushed to GitHub.
2. A free account on [Render](https://render.com).
3. A free account on [Vercel](https://vercel.com).
4. (Optional) A free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).

---

## Step 1: Deploy Backend on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`ai_interview_prep_system`).
4. Configure the service settings:
   * **Name**: `prepkit-ai-backend` (or your choice)
   * **Region**: Any (e.g., *Oregon* or *Frankfurt*)
   * **Branch**: `main`
   * **Root Directory**: `.` (leave default)
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build:server`
   * **Start Command**: `npm run start`
   * **Instance Type**: `Free`
5. Under **Environment Variables**, click **Add Environment Variable** for each:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `10000` | Render default port |
| `JWT_SECRET` | *(Random 32+ character string)* | Secret for auth tokens |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `LLM_PROVIDER` | `gemini` | Active provider |
| `MONGODB_URI` | `mongodb+srv://...` | (Optional) MongoDB Atlas URI |

*(Note: If you leave `MONGODB_URI` empty, the backend runs in resilient in-memory mode automatically).*

6. Click **Deploy Web Service**.
7. Wait 2–3 minutes for the build to finish. Once live, copy your service URL:
   `https://prepkit-ai-backend.onrender.com`

---

## Step 2: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`ai_interview_prep_system`).
4. Configure the project:
   * **Framework Preset**: `Next.js` (auto-detected)
   * **Root Directory**: Click **Edit** and select **`client`** *(Important!)*
   * **Build Command**: `next build` (default)
   * **Output Directory**: `.next` (default)
5. Expand **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://prepkit-ai-backend.onrender.com` |

*(Be sure to replace this with your actual Render URL from Step 1, without a trailing slash).*

6. Click **Deploy**.
7. In ~60 seconds, your site is live! Copy your Vercel URL:
   `https://ai-interview-prep-system.vercel.app`

---

## Step 3: Final Handshake (Connect CORS)

1. Return to your [Render Dashboard](https://dashboard.render.com).
2. Open your `prepkit-ai-backend` service → **Environment**.
3. Add or update:
   * `CLIENT_URL` = `https://ai-interview-prep-system.vercel.app`
4. Click **Save Changes**. Render will automatically restart in ~15 seconds.

---

## Step 4: Verification

1. Open your Vercel URL in your browser: `https://ai-interview-prep-system.vercel.app`
2. Click **Register** to create a test user.
3. Click **Create Prep Kit** and generate a sample kit to confirm that the research crawler and LLM pipeline respond end-to-end.
