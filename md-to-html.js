// Simple Markdown to HTML converter for blog pages
// Run with: node md-to-html.js

const fs = require('fs');
const path = require('path');

// Simple markdown parser
function parseMarkdown(markdown) {
    let html = markdown;
    
    // Headers with IDs for TOC
    html = html.replace(/^### (.*$)/gm, (match, text) => {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `<h3 id="${id}">${text}</h3>`;
    });
    html = html.replace(/^## (.*$)/gm, (match, text) => {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `<h2 id="${id}">${text}</h2>`;
    });
    html = html.replace(/^# (.*$)/gm, (match, text) => {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `<h1 id="${id}">${text}</h1>`;
    });
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang ? ` class="language-${lang}"` : '';
        return `<pre><code${language}>${code.trim()}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Images with consistent sizing and caption support (must come before links)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        // Check if alt text contains caption (format: "alt text | caption")
        const parts = alt.split(' | ');
        if (parts.length === 2) {
            const imageAlt = parts[0];
            const caption = parts[1];
            return `<div class="image-with-caption">
                <img src="${src}" alt="${imageAlt}" data-size="medium" data-caption="${caption}">
                <div class="image-caption">${caption}</div>
            </div>`;
        } else {
            return `<img src="${src}" alt="${alt}" data-size="medium">`;
        }
    });
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Videos
    html = html.replace(/<video src="([^"]+)" controls[^>]*>/g, (match, src) => {
        return `<video src="${src}" controls data-size="medium">`;
    });
    
    // Audio files - convert to custom audio player
    html = html.replace(/!\[audio:([^\]]*)\]\(([^)]+)\)/g, (match, description, src) => {
        const parts = description.split(' | ');
        const title = parts[0] || 'Audio File';
        const desc = parts[1] || '';
        const playerId = 'audio-player-' + Math.random().toString(36).substr(2, 9);
        return `<div class="audio-player" data-src="${src}">
            <div class="audio-info">
                <div class="audio-title">${title}</div>
                ${desc ? `<div class="audio-description">${desc}</div>` : ''}
            </div>
            <div class="controls-container">
                <div class="skip-buttons">
                    <div class="skip-button" data-action="skip-back">⏮</div>
                    <div class="skip-button" data-action="skip-forward">⏭</div>
                </div>
                <div class="play-button" data-action="play-pause">▶</div>
                <div class="progress-container">
                    <div class="progress-bar" data-action="seek">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="time-display">0:00 / 0:00</div>
                </div>
                <div class="volume-container">
                    <div class="volume-icon">🔊</div>
                    <div class="volume-slider" data-action="volume">
                        <div class="volume-fill"></div>
                    </div>
                </div>
            </div>
            <audio preload="metadata">
                <source src="${src}" type="audio/mpeg">
                <source src="${src}" type="audio/wav">
                <source src="${src}" type="audio/ogg">
                Your browser does not support the audio element.
            </audio>
        </div>`;
    });
    
    // Lists
    html = html.replace(/^- \[([ x])\] (.*$)/gm, (match, checked, text) => {
        const checkmark = checked === 'x' ? '✅' : '⏳';
        return `<li>${checkmark} ${text}</li>`;
    });
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    // Paragraphs
    const paragraphs = html.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => {
        if (p.match(/^<[h1-6]|^<div|^<img|^<ul|^<ol|^<li|^<pre|^<code|^<video/)) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n\n');
    
    return paragraphs;
}

// Generate HTML page from markdown
function generateHTMLPage(markdownFile, title, weekNumber) {
    const markdown = fs.readFileSync(markdownFile, 'utf8');
    const content = parseMarkdown(markdown);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Claire's How to Make Almost Anything</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext y='14' font-size='14'%3E🗂️%3C/text%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:wght@300;400;500;600;700&display=block" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/98.css">
    <link rel="stylesheet" href="blog-style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
</head>
<body>
    <div class="window-container">
        <!-- Navigation -->
        <nav class="blog-nav">
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="week1.html">Week 1</a></li>
                <li><a href="week2.html">Week 2</a></li>
                <li><a href="week3.html">Week 3</a></li>
                <li><a href="week4.html">Week 4</a></li>
                <li><a href="finalproject.html">Final Project</a></li>
            </ul>
        </nav>

        <!-- Main window -->
        <div class="blog-window">
            <div class="blog-title-bar">
                <div class="blog-title-text">${title}</div>
                <div class="blog-title-controls">
                    <button onclick="window.close()" title="Close">×</button>
                </div>
            </div>
            
            <div class="blog-content">
                <div class="blog-layout">
                    ${content}
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <script src="blog-utils.js"></script>
</body>
</html>`;
    
    return html;
}

// Convert week3.md to HTML
if (require.main === module) {
    const week3HTML = generateHTMLPage('week3.md', 'Week 3 - Embedded Electronics', 3);
    fs.writeFileSync('week3.html', week3HTML);
    console.log('✅ Generated week3.html from week3.md');
}

module.exports = { parseMarkdown, generateHTMLPage };
