# 🎒 SVA Kickstart — Back to School 2026-27

An interactive back-to-school journey for Silicon Valley Academy families.
Static frontend (GitHub Pages) + Google Apps Script / Google Sheet backend.

## What parents experience

1. Open **kickstart.svaportal.com** → enter their school email.
2. Receive a **6-digit verification code** by email (only emails in the Roster work).
3. See their kids & grades, then walk through a personalized journey:
   - 📅 Key dates + potluck RSVP (recorded in the backend)
   - 🚗 Campus maps: Washington Gate entry, drop-off lanes, parking (PreK families get the in-person classroom drop-off callout)
   - 💬 WhatsApp group links for each kid's grade
   - 🍱 Hot lunch info + parent portal link
   - 👕 Uniform check (only shown to K-8 families)
   - ✏️ Interactive per-kid supply checklist (auto-saved, "email me the list")
   - 🙌 PTO interest + project ideas (recorded in the backend)
   - ✍️ Conduct-policy review & e-signature → signed PDF saved to Drive **and** emailed to the parent
4. Progress autosaves — parents can leave and **resume exactly where they left off** on any device with the same email.
5. Finish screen with confetti + "email me my summary."

## Repo layout

```
index.html            the whole site (single page)
css/styles.css        styles (SVA palette from the logo)
js/config.js          ← paste your Apps Script Web App URL here
js/data.js            supply lists, uniform policy, grade mapping
js/api.js             backend client (demo mode when API_URL is empty)
js/app.js             app logic
assets/img/           logo + optimized campus maps
```

> The backend source (`apps-script/Code.gs`) is intentionally **not** in this
> public repo — it lives in the school's private Google Apps Script project
> (and a local copy is kept alongside this folder).

## Backend setup (once, ~5 minutes)

1. Create a new **Google Sheet** (this becomes the admin backend).
2. **Extensions → Apps Script**, paste the backend script (local `apps-script/Code.gs`) into `Code.gs`.
3. Run the `setup` function once (authorize when prompted). It creates:
   - **Roster** — parent email ↔ family ID, student ID, name, grade (one row per student; multiple emails per cell OK, comma-separated)
   - **Links** — every URL the site shows (WhatsApp groups per grade, calendar, uniform PDF, portal, policy docs…)
   - **Events** — the key-dates timeline
   - **Config** — texts & settings (school name, first day, office email…)
   - **Responses / Progress / SignedForms / Tokens** — data written by the site
   - A Drive folder **"SVA Kickstart — Signed Forms"** for signed policy PDFs
4. **Deploy → New deployment → Web app**
   - Execute as: **Me** · Who has access: **Anyone**
5. Copy the Web App URL into `js/config.js` → `API_URL`, commit & push.
6. Replace the sample rows in **Roster** with the real parent list, and the
   `REPLACE_ME` WhatsApp links in **Links**.

> Everything content-related is edited **in the Sheet** — no code changes needed.
> The site reads Links/Events/Config live on every sign-in.

## Frontend deploy (GitHub Pages)

1. Push this folder to your GitHub repo (root or `/docs`).
2. Repo → Settings → Pages → deploy from branch.
3. Custom domain: `kickstart.svaportal.com` (the `CNAME` file is included);
   add a DNS **CNAME record** pointing `kickstart` → `<your-github-username>.github.io`.

## Demo mode

While `API_URL` is empty (or with `?demo` in the URL) the site runs with sample
data — any email works and the verification code is **123456**. Great for
previewing design changes without touching the backend.

## Admin cheat-sheet

| I want to… | Do this |
|---|---|
| Add/change a family | Edit the **Roster** tab |
| Change a WhatsApp / any link | Edit the **Links** tab |
| Change dates or descriptions | Edit the **Events** tab |
| See RSVPs, PTO ideas, acknowledgements | **Responses** tab |
| See who finished what | **Progress** tab |
| Find a signed policy PDF | **SignedForms** tab or the Drive folder |
| Change email sender name / texts | **Config** tab |
