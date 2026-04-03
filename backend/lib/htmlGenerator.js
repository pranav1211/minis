const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

const DIST_DIR = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const SITE_URL = 'https://minis.beyondmebtw.com';

// Find the CSS path by reading from an existing generated post HTML.
// Falls back to scanning _astro/ if no posts exist yet.
async function getCssPath() {
    const postDir = path.join(DIST_DIR, 'post');
    try {
        const entries = await fs.readdir(postDir);
        for (const entry of entries) {
            const htmlPath = path.join(postDir, entry, 'index.html');
            try {
                const html = await fs.readFile(htmlPath, 'utf8');
                const match = html.match(/href="(\/_astro\/[^"]+\.css)"/);
                if (match) return match[1];
            } catch { /* skip unreadable */ }
        }
    } catch { /* post dir may not exist */ }

    // Fallback: scan _astro dir
    const astroDir = path.join(DIST_DIR, '_astro');
    try {
        const files = await fs.readdir(astroDir);
        const css = files.find(f => f.endsWith('.css'));
        if (css) return `/_astro/${css}`;
    } catch { /* no _astro dir */ }

    return null;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
}

function getDescription(markdown) {
    const rawText = markdown.replace(/[#*_[\]()>`~-]/g, '').replace(/\n+/g, ' ').trim();
    return rawText.substring(0, 160) + (rawText.length > 160 ? '...' : '');
}

async function generatePostHtml(postData) {
    const { id, title, date, time, tags, content } = postData;

    const cssPath = await getCssPath();
    const postUrl = `${SITE_URL}/post/${id}/`;
    const publishedTime = `${date}T${time}:00+05:30`;
    const formattedDate = formatDate(date);
    const description = getDescription(content);
    const contentHtml = await marked.parse(content);

    const tagsMetaTags = tags.map(tag =>
        `<meta property="article:tag" content="${escapeHtml(tag)}">`
    ).join('');

    const tagsLinks = tags.map(tag =>
        `<a href="/?tag=${encodeURIComponent(tag)}" class="tag">${escapeHtml(tag)}</a>`
    ).join('');

    const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(title)}`;
    const blueskyShareUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(title + ' ' + postUrl)}`;

    const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "datePublished": publishedTime,
        "url": postUrl,
        "author": {
            "@type": "Person",
            "name": "Pranav Veeraghanta",
            "url": "https://beyondmebtw.com/about"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Beyond Me Btw",
            "url": "https://beyondmebtw.com"
        },
        "keywords": tags.join(', ')
    });

    const cssLink = cssPath ? `<link rel="stylesheet" href="${cssPath}">` : '';

    return `<!DOCTYPE html><html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="${escapeHtml(description)}"><meta name="author" content="Beyond Me Btw"><title>${escapeHtml(title)} | Minis</title><link rel="icon" type="image/x-icon" href="https://beyondmebtw.com/assets/images/minis.ico"><link href="https://fonts.googleapis.com/css2?family=Kreon:wght@400;500;600;700&family=Mogra&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" crossorigin="anonymous"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:type" content="article"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${postUrl}"><meta property="og:site_name" content="Minis by Beyond Me Btw"><meta property="article:published_time" content="${publishedTime}"><link rel="canonical" href="${postUrl}">${tagsMetaTags}<script type="application/ld+json">${jsonLd}</script> ${cssLink}</head> <body> <div class="post-page-layout"> <div class="header-container"> <h1 class="page-title"> <a href="https://minis.beyondmebtw.com" class="minis">MINIS</a> <span class="by">by</span> <span class="brand"><a href="https://beyondmebtw.com">Beyond Me Btw</a></span> </h1> </div> <main class="post-page"> <a href="/" class="back-link-top"><i class="fas fa-arrow-left"></i> all minis</a> <article> <header class="post-header"> <h1>${escapeHtml(title)}</h1> <div class="post-date"> <time datetime="${escapeHtml(date)}">${formattedDate}</time> <span class="post-time-sep">&middot;</span> <span class="post-time">${escapeHtml(time)} IST</span> </div> <div class="post-tags-row"> <div class="post-tags"> ${tagsLinks} </div> <div class="post-share-inline"> <button class="share-btn share-copy" id="shareCopyBtn"> <i class="fas fa-link"></i> Copy Link </button> <a href="${twitterShareUrl}" class="share-btn share-twitter" target="_blank" rel="noopener noreferrer"> <i class="fa-brands fa-x-twitter"></i> Share </a> <a href="${blueskyShareUrl}" class="share-btn share-bluesky" target="_blank" rel="noopener noreferrer"> <i class="fa-brands fa-bluesky"></i> Share </a> </div> </div> </header> <div class="post-content"> ${contentHtml} </div> </article> </main> <footer class="footer"> <div class="footer-inner"> <div class="footer-brand"> <span class="footer-brand-name">MINIS</span> <span class="footer-brand-sub">by <a href="https://beyondmebtw.com" target="_blank" rel="noopener">Beyond Me Btw</a></span> </div> <nav class="footer-nav"> <a href="/">all minis</a> <a href="https://beyondmebtw.com" target="_blank" rel="noopener">main blog</a> <a href="https://beyondmebtw.com/about" target="_blank" rel="noopener">about</a> </nav> </div> <div class="footer-bottom"> &copy; 2022&ndash;Present. Created by <a href="https://beyondmebtw.com/about" target="_blank" rel="noopener">Pranav Veeraghanta</a> </div> </footer> </div> <button class="scroll-to-top" id="scrollToTop" aria-label="Scroll to top"> <i class="fas fa-arrow-up"></i> </button> <script> var scrollToTopBtn = document.getElementById('scrollToTop'); var shareCopyBtn = document.getElementById('shareCopyBtn'); if (scrollToTopBtn) { window.addEventListener('scroll', function() { if (window.pageYOffset > 300) { scrollToTopBtn.classList.add('visible'); } else { scrollToTopBtn.classList.remove('visible'); } }); scrollToTopBtn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); }); } if (shareCopyBtn) { shareCopyBtn.addEventListener('click', function() { var url = window.location.href.endsWith('/') ? window.location.href : window.location.href + '/'; navigator.clipboard.writeText(url).then(function() { shareCopyBtn.classList.add('copied'); setTimeout(function() { shareCopyBtn.classList.remove('copied'); }, 2000); }).catch(function() {}); }); } </script> </body></html>`;
}

async function writePostPage(postData) {
    const postDir = path.join(DIST_DIR, 'post', postData.id);
    await fs.mkdir(postDir, { recursive: true });
    const html = await generatePostHtml(postData);
    await fs.writeFile(path.join(postDir, 'index.html'), html, 'utf8');
}

async function deletePostPage(id) {
    const postDir = path.join(DIST_DIR, 'post', id);
    try {
        await fs.rm(postDir, { recursive: true, force: true });
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
}

module.exports = { writePostPage, deletePostPage };
