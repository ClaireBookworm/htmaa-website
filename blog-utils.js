// Blog utilities for enhanced functionality

// Auto-resize images based on data-size attribute
function initializeImageSizing() {
    const images = document.querySelectorAll('img[data-size]');
    images.forEach(img => {
        // Add loading state
        img.style.opacity = '0.7';
        img.style.transition = 'opacity 0.3s ease';
        
        img.onload = function() {
            this.style.opacity = '1';
        };
        
        // Handle error state
        img.onerror = function() {
            this.style.opacity = '0.5';
            this.alt = 'Image failed to load: ' + this.alt;
        };
    });
}

// Smooth scroll for anchor links
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Copy code blocks functionality
function initializeCodeCopying() {
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        const pre = block.parentElement;
        if (pre.children.length === 1) { // Only has code, no copy button yet
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy';
            copyButton.className = 'copy-button';
            copyButton.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                background: #4a5568;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
            `;
            
            pre.style.position = 'relative';
            pre.appendChild(copyButton);
            
            copyButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(block.textContent);
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy code:', err);
                }
            });
            
            copyButton.addEventListener('mouseenter', () => {
                copyButton.style.opacity = '1';
            });
            
            copyButton.addEventListener('mouseleave', () => {
                copyButton.style.opacity = '0.7';
            });
        }
    });
}

// Generate table of contents
function generateTableOfContents() {
    const headings = document.querySelectorAll('.blog-layout h2, .blog-layout h3, .blog-layout h4');
    if (headings.length === 0) return;
    
    const toc = document.createElement('div');
    toc.className = 'blog-toc';
    toc.innerHTML = '<h4>Table of Contents</h4><ul></ul>';
    
    const tocList = toc.querySelector('ul');
    
    headings.forEach((heading, index) => {
        // Create ID for heading if it doesn't exist
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }
        
        // Create TOC item
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;
        a.className = `toc-${heading.tagName.toLowerCase()}`;
        
        li.appendChild(a);
        tocList.appendChild(li);
    });
    
    // Insert TOC into the blog content area
    const blogContent = document.querySelector('.blog-content');
    if (blogContent) {
        blogContent.appendChild(toc);
    }
}

// Fullscreen image viewer
function initializeFullscreenImages() {
    // Create fullscreen viewer element
    const fullscreenViewer = document.createElement('div');
    fullscreenViewer.className = 'image-fullscreen';
    fullscreenViewer.innerHTML = `
        <img src="" alt="">
        <button class="close-button" onclick="closeFullscreenImage()">×</button>
    `;
    document.body.appendChild(fullscreenViewer);
    
    // Add double-click event listeners to all images
    const images = document.querySelectorAll('.blog-layout img');
    images.forEach(img => {
        img.addEventListener('dblclick', function(e) {
            e.preventDefault();
            openFullscreenImage(this.src, this.alt);
        });
        
        // Add visual feedback for double-click
        img.style.cursor = 'pointer';
        img.title = 'Double-click to view fullscreen';
    });
}

function openFullscreenImage(src, alt) {
    const viewer = document.querySelector('.image-fullscreen');
    const img = viewer.querySelector('img');
    
    img.src = src;
    img.alt = alt;
    
    // Check if there's a caption for this image
    const originalImg = document.querySelector(`img[src="${src}"]`);
    const caption = originalImg ? originalImg.getAttribute('data-caption') : null;
    
    // Update or create caption element for fullscreen
    let captionEl = viewer.querySelector('.image-caption');
    if (caption) {
        if (!captionEl) {
            captionEl = document.createElement('div');
            captionEl.className = 'image-caption';
            viewer.appendChild(captionEl);
        }
        captionEl.textContent = caption;
        captionEl.style.display = 'block';
    } else if (captionEl) {
        captionEl.style.display = 'none';
    }
    
    viewer.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeFullscreenImage() {
    const viewer = document.querySelector('.image-fullscreen');
    viewer.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Make closeFullscreenImage globally available
window.closeFullscreenImage = closeFullscreenImage;

// Custom Audio Player functionality
function initializeAudioPlayers() {
    const audioPlayers = document.querySelectorAll('.audio-player');
    
    audioPlayers.forEach(player => {
        const audio = player.querySelector('audio');
        const playButton = player.querySelector('.play-button');
        const progressBar = player.querySelector('.progress-bar');
        const progressFill = player.querySelector('.progress-fill');
        const timeDisplay = player.querySelector('.time-display');
        const volumeSlider = player.querySelector('.volume-slider');
        const volumeFill = player.querySelector('.volume-fill');
        const skipBackButton = player.querySelector('[data-action="skip-back"]');
        const skipForwardButton = player.querySelector('[data-action="skip-forward"]');
        
        let isPlaying = false;
        let isDragging = false;
        
        // Play/Pause functionality
        playButton.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
                playButton.textContent = '▶';
                isPlaying = false;
            } else {
                audio.play();
                playButton.textContent = '⏸';
                isPlaying = true;
            }
        });
        
        // Skip functionality
        skipBackButton.addEventListener('click', () => {
            audio.currentTime = Math.max(0, audio.currentTime - 10);
        });
        
        skipForwardButton.addEventListener('click', () => {
            audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        });
        
        // Progress bar functionality
        progressBar.addEventListener('click', (e) => {
            if (audio.duration) {
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                audio.currentTime = percentage * audio.duration;
            }
        });
        
        // Volume control
        volumeSlider.addEventListener('click', (e) => {
            const rect = volumeSlider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, clickX / rect.width));
            audio.volume = percentage;
            volumeFill.style.width = (percentage * 100) + '%';
        });
        
        // Audio event listeners
        audio.addEventListener('loadedmetadata', () => {
            updateTimeDisplay();
        });
        
        audio.addEventListener('timeupdate', () => {
            if (!isDragging) {
                updateProgress();
                updateTimeDisplay();
            }
        });
        
        audio.addEventListener('ended', () => {
            playButton.textContent = '▶';
            isPlaying = false;
            progressFill.style.width = '0%';
        });
        
        audio.addEventListener('play', () => {
            playButton.textContent = '⏸';
            isPlaying = true;
        });
        
        audio.addEventListener('pause', () => {
            playButton.textContent = '▶';
            isPlaying = false;
        });
        
        function updateProgress() {
            if (audio.duration) {
                const percentage = (audio.currentTime / audio.duration) * 100;
                progressFill.style.width = percentage + '%';
            }
        }
        
        function updateTimeDisplay() {
            const current = formatTime(audio.currentTime || 0);
            const total = formatTime(audio.duration || 0);
            timeDisplay.textContent = `${current} / ${total}`;
        }
        
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        
        // Initialize volume
        audio.volume = 0.7;
        volumeFill.style.width = '70%';
    });
}

// Initialize all blog utilities
document.addEventListener('DOMContentLoaded', function() {
    initializeImageSizing();
    initializeSmoothScrolling();
    initializeCodeCopying();
    generateTableOfContents();
    initializeFullscreenImages();
    initializeAudioPlayers();
    
    // Add keyboard navigation for accessibility
    document.addEventListener('keydown', function(e) {
        // ESC key closes fullscreen image or returns to home
        if (e.key === 'Escape') {
            const fullscreenViewer = document.querySelector('.image-fullscreen');
            if (fullscreenViewer && fullscreenViewer.classList.contains('active')) {
                closeFullscreenImage();
            } else if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        }
    });
    
    // Close fullscreen when clicking outside the image
    document.addEventListener('click', function(e) {
        const fullscreenViewer = document.querySelector('.image-fullscreen');
        if (fullscreenViewer && fullscreenViewer.classList.contains('active') && e.target === fullscreenViewer) {
            closeFullscreenImage();
        }
    });
    
    // Add print stylesheet dynamically
    const printLink = document.createElement('link');
    printLink.rel = 'stylesheet';
    printLink.href = 'blog-style.css';
    printLink.media = 'print';
    document.head.appendChild(printLink);
});

// Utility function to convert markdown-style images to blog format
function convertMarkdownImages(markdown) {
    return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        // Determine size based on context or add data-size attribute
        return `<img src="${src}" alt="${alt}" data-size="medium">`;
    });
}

// Export for use in other scripts
window.BlogUtils = {
    initializeImageSizing,
    initializeSmoothScrolling,
    initializeCodeCopying,
    generateTableOfContents,
    initializeFullscreenImages,
    openFullscreenImage,
    closeFullscreenImage,
    initializeAudioPlayers,
    convertMarkdownImages
};
