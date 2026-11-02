# My Dadi's Final Memories

A static memorial website (HTML, CSS, vanilla JavaScript). No build step, no backend.

## Upload to GitHub Pages
1. Create a new public repository on github.com, e.g. `My-Dadi-s-Final-Memories`.
2. Click **Add file > Upload files**, drag in all five files (`index.html`, `style.css`, `script.js`, `posts.txt`, `README.md`), then **Commit changes**.
3. Go to **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/My-Dadi-s-Final-Memories/`.

Opening `index.html` directly from your computer will not load the memories (browsers block it). Use GitHub Pages.

## Add, edit or remove memories (posts.txt only)
Each post has a first line, then an optional photo URL on the next line:

    DATE|TIME|DESCRIPTION
    https://example.com/photo.jpg

Posts are separated by a line containing only `$`. To add a post, add at the end:

    $
    2026-11-02|8:30 PM|নতুন একটি স্মৃতির বিবরণ
    https://example.com/photo.jpg

Rules:
- DATE is `YYYY-MM-DD`. TIME is `h:mm AM` or `h:mm PM`. Times are shown as Bangladesh local time.
- No photo yet? Leave out the URL line. The post shows "Photograph to be added". Add the URL line later and the photo appears.
- Order in the file does not matter. Visitors can switch between newest-first (default) and oldest-first.
- A malformed record is skipped (see the browser console) and never breaks the others.
- Adding `|FEATURED` after the description on the first line gives a post the quiet emphasised style. It is used on the final goodbye post.

## Posts without a photograph
`2026-10-31 5:10 PM` (Dadi's passing) and `2026-10-31 10:57 PM` (Ghusl completed) have no photo yet. Add the URL on a new line under each one in `posts.txt`.
If a photo URL is wrong or unreachable, a gentle placeholder is shown instead of a broken image.

## Fonts
Amiri (Arabic), Noto Serif Bengali and Cormorant Garamond load from Google Fonts. Without internet, good system fonts are used instead.
