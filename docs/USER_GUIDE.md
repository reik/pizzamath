# PizzaMath — User Guide

PizzaMath is a subscription math-worksheet platform for grades K–12, aligned to California Common Core. Browse and print worksheets, snap a photo of a completed page to get it graded by AI, and let the app generate follow-up practice targeted to the mistakes a student actually makes.

---

## For Users

### 1. Sign up

1. Open the site. You'll land on the login screen.
2. Click **Register** → enter email + password → submit.
3. On first sign-in you'll be prompted to start a subscription:
   - **$10 / month**
   - **$100 / year** (save ~17%)
4. After payment, you're returned to the main browse view.

All worksheet pages are subscriber-only — there's no free preview tier.

### 2. Find a worksheet

The top navigation bar drives discovery:

- **Logo / left** — returns you to the browse home.
- **Category dropdown (center)** — pick a top-level California Common Core domain (e.g., *Number & Operations*, *Geometry*).
- **Subcategory dropdown** — appears after you pick a category. Narrows to a specific standard cluster.
- **Search bar (right)** — keyword search; you can optionally restrict it to the current category.

Each worksheet card shows its **level** (Beginner / Intermediate / Advanced) and **school grade** (K–12 where applicable). Cards for worksheets you uploaded yourself are marked with an orange **My Upload** pill — click the pill to jump straight to your My Uploads list.

### 3. Work a worksheet

Click any worksheet card to open it.

- The worksheet renders in your browser.
- The matching **answer sheet** is on the same page, hidden until you click to reveal — useful when checking your own work.
- Print from your browser, or use the export option (PDF) to save a copy for offline use.

### 4. Track your own work

Two places record what you've done:

- **Usage history** (Account menu → Usage history) — chronological list of every worksheet you've opened, with date, score (if logged), and any comment you added.
- **My Uploads** (Account menu → My Uploads) — photos of completed worksheets you've sent up for grading.

To record a score manually, open the worksheet, scroll to the bottom, and fill in date / score / comment.

### 5. Get a worksheet graded by AI

This is the core "mistake-aware" feature.

1. Finish a worksheet on paper.
2. Take a clear photo (good lighting, the whole page in frame, handwriting legible).
3. Go to **My Uploads** → **Upload** → pick the photo and confirm which worksheet it corresponds to.
4. On the uploaded-worksheet detail page, click **Grade this**.
5. Wait ~10–30 seconds while the AI reads the image.

You'll land on the **grading page**, which shows:

- An overall score (e.g., *7 / 10*).
- A per-problem breakdown — each problem marked correct ✓ or incorrect ✗.
- For each incorrect problem, an **error category** (e.g., *Carry/borrow error*, *Place-value misalignment*, *Wrong operation*, *Careless arithmetic*). These are stable categories the app uses to track patterns over time.
- A short explanation of what likely went wrong.

> **Tip:** if a problem is illegible or the AI mis-reads it, you can ignore that line — the grading isn't binding, it's a learning tool.

### 6. Generate targeted practice

At the bottom of the grading page, if at least one problem was wrong and categorized, a **"Generate targeted practice"** button appears.

Click it. After ~10–20 seconds, a fresh worksheet opens, structured as:

- **2 warm-up problems** — easier than the missed skill, to rebuild confidence.
- **6 drill problems** — directly hitting the sub-skills the student got wrong.
- **2 challenge problems** — slightly harder, to stretch.

The level and grade match the original worksheet. The generated worksheet is saved to your library — you can re-open it later from Usage history or by direct link.

### 7. Track skill gaps over time — Insights

Account menu → **Insights**.

This page aggregates *every* grading you've ever run:

- Total worksheets graded.
- **Most common mistakes** — a horizontal bar chart ranking error categories by how often they show up across all your gradings. The longest bar is the skill that most needs work.
- **Practice progress** — for every error category you've generated targeted practice on, a row shows the pre-drill vs post-drill error count plus a status badge:
  - **✓ Fixed** — that category appeared at less than half the rate in gradings completed *after* the first drill compared to before.
  - **Still struggling** — that category is still showing up at roughly the same rate, or more.
  - **Needs more data** — you haven't graded any new worksheets since drilling this category yet. Grade one to get a verdict.
- **Recent gradings** — the last 10 grading sessions, each linkable.

The chart and the practice-progress section update after every new grading. If you've never graded anything, the chart shows an empty-state message; the practice-progress section only appears once you've generated at least one targeted-practice worksheet.

### 8. Account management

Account menu → **Account**:

- Change email / password.
- Manage subscription (cancel, switch monthly ↔ yearly).
- View billing history.

**Logout** is the bottom item in the same menu.

---

## For Admins

Admin access is granted on the user record (`role: admin`). The first admin is seeded at deploy time. Once you're an admin, two extra menu items appear:

- **Admin** → `/admin`
- **Admin → Generate** → `/admin/generate`

### Admin 1: Manage the worksheet library

From the **Admin** page you can:

- **Add a worksheet manually** — fill in title, category, subcategory, level, school grade, author, worksheet content, and answer content. Save → it appears in the public library immediately.
- **Delete a worksheet** — removes it from browse results. Existing user history that references it stays intact.
- **Edit metadata** on existing worksheets (category, level, grade).

Required fields: `category`, `subcategory`, `level`, `author`. `schoolGrade` is optional.

### Admin 2: AI-generated worksheets

This is the differentiator — open `/admin/generate`.

You'll see a chat-style textarea connected to a Claude agent. The flow:

1. **Describe what you want.** Free-form. e.g., *"10 two-digit addition with regrouping problems for 2nd graders, mixed horizontal and vertical layout"*.
2. **Iterate.** The agent replies with a draft. Ask for changes: *"make 3 of them word problems"*, *"easier"*, *"add a number line for problem 4"*. As many turns as you need.
3. **Generate.** When you're happy, click **Generate**. The app:
   - Auto-populates Category, Subcategory, Level, and School Grade based on the conversation.
   - Renders the final worksheet + matching answer sheet.
   - Lets you tweak any of the auto-filled metadata before saving.
4. **Save** → the worksheet enters the public library.

> **Conversation state is ephemeral.** Only the final saved worksheet persists — refreshing the page mid-conversation loses the draft. Save before you walk away.

You can also request file-format variants from the same screen (PDF, DOC) for export.

### Admin 3: User & subscription overview

The admin panel exposes a user list with subscription status. From here:

- Manually flip a user's `role` (user ↔ admin).
- Cancel a subscription on a user's behalf if they ask via support.
- View grading volume per user (useful for spotting heavy / inactive accounts).

No bulk-edit yet — these are per-user actions.

---

## Troubleshooting

| Problem | What to try |
|---|---|
| Grading says "couldn't read the image" | Re-shoot in better light; make sure the whole page is in frame and handwriting is legible. JPEG is fine; very large files (>10 MB) may fail. |
| "Generate targeted practice" button doesn't appear | The grading needs at least one **incorrect** problem with a categorized error. A perfect score, or mistakes the AI couldn't categorize, will hide the button. |
| Insights chart is empty | You haven't completed any gradings yet, or none of your wrong answers were categorizable. Grade a real worksheet to populate it. |
| "Practice progress" section is missing | You haven't generated any targeted-practice worksheets yet. Run "Generate targeted practice" on a grading first; the section appears once a drill has been recorded. |
| A practice category shows "Needs more data" forever | Upload and grade a new worksheet *after* the drill date — the comparison needs at least one post-drill grading to assess whether the category improved. |
| Subscription expired mid-session | You'll be redirected to `/subscribe` on the next protected page load. Existing gradings and history aren't deleted — they reappear when you renew. |
| Forgot password | Use the "Forgot password" link on the login page (magic-link sign-in if enabled in your deployment). |

---

## Privacy

- Uploaded photos are stored on the PizzaMath server and used only for grading and your personal history.
- Photos are not shared with other users or used to train any AI model.
- You can delete an uploaded photo from **My Uploads** at any time; the corresponding grading record is removed with it.
