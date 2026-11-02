# My Dadi's Final Memories

A static memorial website (HTML, CSS, vanilla JavaScript). No build step, no backend.

## Upload to GitHub Pages
1. Create a new public repository on github.com, e.g. `My-Dadi-s-Final-Memories`.
2. Click **Add file > Upload files**, drag in all five files (`index.html`, `style.css`, `script.js`, `posts.txt`, `README.md`), then **Commit changes**.
3. Go to **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/My-Dadi-s-Final-Memories/`.

Opening `index.html` directly from your computer will not load the memories (browsers block it). Use GitHub Pages.

## Add, edit or remove memories (posts.txt only)
Each post has a first line, then any number of photo or video URLs, one per line:

    DATE|TIME|DESCRIPTION
    https://example.com/photo1.jpg
    https://example.com/photo2.jpg
    https://example.com/video.mp4

Posts are separated by a line containing only `$`. To add a post, add at the end:

    $
    2026-11-02|8:30 PM|নতুন একটি স্মৃতির বিবরণ
    https://example.com/photo.jpg

Rules:
- DATE is `YYYY-MM-DD`. TIME is `h:mm AM` or `h:mm PM`. Times are shown as Bangladesh local time.
- No photo yet? Leave out the URL line. The post shows the date, time and text only. Add the URL line later and the photo appears.
- Order in the file does not matter. Visitors can switch between newest-first (default) and oldest-first.
- A malformed record is skipped (see the browser console) and never breaks the others.
- Adding `|FEATURED` after the description on the first line gives a post the quiet emphasised style. It is used on the final goodbye post.

## Multiple photos and videos
Put each URL on its own line under the post. They are shown in the order written. Links ending in `.mp4`, `.webm`, `.ogv`, `.mov` or `.m4v` appear as a video player; everything else is a photo.
Tips for video: use MP4 (H.264) so it plays on every phone. Keep files small (GitHub allows up to 100 MB per file, 25 MB through the website upload). Upload the video to your repository and link to it with a relative path such as `videos/clip.mp4`, which is more reliable than a raw.githubusercontent.com link. YouTube or Facebook links are not supported.

## Posts without a photograph
`2026-10-31 5:10 PM` (Dadi's passing) and `2026-10-31 10:57 PM` (Ghusl completed) have no photo yet. Add the URL on a new line under each one in `posts.txt`.
If a photo URL is wrong or unreachable, a gentle placeholder is shown instead of a broken image.

## Faster photos
Photos straight from a phone are often 3 to 8 MB each, which is the main cause of slow loading. Before uploading, shrink each one to about 1600 px on its longest side (JPEG, roughly 200 to 400 KB); it will still look sharp on every screen. Hosting the photos in the same repository as the site and linking them by a relative path such as `photos/IMG_001.jpg` is also faster than raw.githubusercontent.com links.
The site loads the photo you are looking at first, then the ones just ahead, and waits on the rest until you scroll near them.

## Fonts
Amiri (Arabic), Noto Serif Bengali and Cormorant Garamond load from Google Fonts. Without internet, good system fonts are used instead.
