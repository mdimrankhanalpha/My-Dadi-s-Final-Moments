# My Dadi's Final Memories

A static memorial website (HTML, CSS, vanilla JavaScript). No build step, no backend.

## Upload to GitHub Pages
1. Create a new public repository on github.com, e.g. `My-Dadi-s-Final-Memories`.
2. Click **Add file > Upload files**, drag in all five files (`index.html`, `style.css`, `script.js`, `posts.txt`, `README.md`), then **Commit changes**.
3. Go to **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/My-Dadi-s-Final-Memories/`.

Opening `index.html` directly from your computer will not load the memories (browsers block it). Use GitHub Pages.

## Add, edit or remove memories (posts.txt only)
Open `posts.txt` on GitHub, click the pencil icon, edit, and commit. Each post is one line:

    DATE|TIME|DESCRIPTION|IMAGE_URL

Posts are separated by a line containing only `$`. To add a post, add at the end:

    $
    2026-11-02|8:30 PM|নতুন একটি স্মৃতির বিবরণ|https://example.com/photo.jpg

Rules:
- DATE is `YYYY-MM-DD`. TIME is `h:mm AM` or `h:mm PM` (seconds are not needed). Times are shown as Bangladesh local time.
- Posts are sorted automatically by date and time, so order in the file does not matter.
- A malformed record is skipped (see the browser console) and never breaks the others.
- Optional fifth field `|FEATURED` gives a post the quiet emphasised style. It is used on the final goodbye post.

## Missing photographs
Two posts have no photograph yet and show "Photograph to be added":
- `2026-10-31|5:10 PM` (Dadi's passing)
- `2026-10-31|10:57 PM` (Ghusl completed)

In `posts.txt`, replace `IMAGE_URL_REQUIRED` on that line with the photo's URL (for example a raw.githubusercontent.com link). It will appear automatically.
If a photo URL is wrong or unreachable, a gentle placeholder is shown instead of a broken image.

## Fonts
Amiri (Arabic), Noto Serif Bengali and Cormorant Garamond load from Google Fonts. Without internet, good system fonts are used instead.
