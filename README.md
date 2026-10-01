# Lab Lens 🔬

**AI-Powered Lab Assistant for College Students**

Point your camera at lab equipment, circuit boards, or lab manuals. Get instant theory, formulas, and step-by-step guided lab sessions — all powered by Claude AI.

---

## Features

- 📷 **Camera scanning** — capture or upload images of any lab item
- 🤖 **AI analysis** — instant theory, formulas, and component breakdown
- ✅ **Smart checklist** — step-by-step experiment guide from AI
- ⏱️ **Live timers** — per-step and total session timers
- 🧪 **Supports** — electronics, chemistry, physics, biology labs
- 💾 **Session history** — recent experiments saved locally
- 🎭 **Demo mode** — try it without an API key

---

## Files

```
lab-lens/
├── index.html   ← App structure and UI
├── styles.css   ← All visual styling
├── app.js       ← Logic: camera, AI, timers, checklist
└── README.md    ← This file
```

---

## API Key Setup

Lab Lens uses the [Anthropic API](https://www.anthropic.com). You need a free API key:

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Sign up or log in → click **Create Key**
3. Copy the key (starts with `sk-ant-`)
4. Paste it into Lab Lens on the setup screen

> Your key is stored only in your browser's localStorage. It is never sent anywhere except directly to Anthropic's API.

---

## How to Deploy on GitHub Pages

Follow these steps exactly — takes about 5 minutes.

### Step 1 — Create a GitHub Account
If you don't have one: go to [github.com](https://github.com) → click **Sign up** → complete registration.

### Step 2 — Create a New Repository

1. Click the **+** icon (top-right) → **New repository**
2. Fill in:
   - **Repository name:** `lab-lens` *(or any name you like)*
   - **Description:** AI-powered lab assistant *(optional)*
   - **Visibility:** Public *(must be Public for free GitHub Pages)*
   - ✅ Check **Add a README file** — *uncheck this if you already have one*
3. Click **Create repository**

### Step 3 — Upload Your Files

**Option A — Upload via browser (easiest):**

1. On your new repository page, click **Add file** → **Upload files**
2. Drag and drop all 4 files into the upload area:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
3. Scroll down to **Commit changes** → leave the message as-is → click **Commit changes**

**Option B — Upload via Git (recommended for future updates):**

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/lab-lens.git
cd lab-lens

# Copy your files here, then:
git add .
git commit -m "Initial Lab Lens upload"
git push origin main
```

### Step 4 — Enable GitHub Pages

1. In your repository, click the **Settings** tab (top row)
2. In the left sidebar, scroll down and click **Pages**
3. Under **Source**, click the dropdown that says **None** → select **Deploy from a branch**
4. Under **Branch**, choose **main** (or **master**) from the dropdown
5. Leave the folder as **/ (root)**
6. Click **Save**

### Step 5 — Get Your Live URL

- GitHub Pages will take **1–3 minutes** to build your site
- Refresh the Settings → Pages page
- You will see a green banner: **"Your site is live at https://YOUR_USERNAME.github.io/lab-lens/"**
- Click the link — your app is now live on the internet!

### Step 6 — Share It

Your URL will be in the format:
```
https://YOUR_USERNAME.github.io/lab-lens/
```

Share this link with classmates, professors, or on your resume portfolio!

---

## Updating the App

Whenever you make changes to any file:

```bash
git add .
git commit -m "Update: describe what you changed"
git push origin main
```

GitHub Pages will automatically rebuild within 1–2 minutes.

Or via browser: go to the file on GitHub → click the **pencil (edit) icon** → make changes → commit.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Blank page after deploy | Wait 2–3 minutes; hard-refresh (Ctrl+Shift+R) |
| "API key invalid" error | Check your key starts with `sk-ant-` |
| Camera not working | Use HTTPS (GitHub Pages uses HTTPS by default) — camera needs secure context |
| CORS error in console | Make sure you're accessing via the GitHub Pages URL, not a local file path |
| Analysis returns error | Check your Anthropic account has available credits |

---

## Tech Stack

- **Vanilla HTML/CSS/JavaScript** — no build tools, no npm
- **Anthropic Claude API** — claude-sonnet-4-6 model with vision
- **CSS Custom Properties** — for theming
- **Web Camera API** — MediaDevices.getUserMedia()
- **localStorage** — for session history and API key

Built for students by a student. 🎓
