// Draggable Windows Functionality for Retro Windows 95/98 Style

let draggedElement = null;
let draggedIcon = null;
let offset = { x: 0, y: 0 };
let topZIndex = 1000; // Track the highest z-index
let allowWindowDrag = false; // Only allow dragging when starting on title bar

// Window zoom levels - track zoom for each window
let windowZoomLevels = {};

// Resize functionality
let isResizing = false;
let resizeElement = null;
let resizeDirection = '';
let startMousePos = { x: 0, y: 0 };
let startWindowSize = { width: 0, height: 0 };
let startWindowPos = { x: 0, y: 0 };

// Function to bring window to front
function bringToFront(windowElement) {
    topZIndex++;
    
    // Check if this is a modal window (inside a modal container)
    const modalContainer = windowElement.closest('.modal-window');
    if (modalContainer) {
        modalContainer.style.zIndex = topZIndex;
    } else {
        windowElement.style.zIndex = topZIndex;
    }
}

// Function to calculate and set proper content height
function adjustContentHeight(windowElement) {
    const titlebar = windowElement.querySelector('.titlebar');
    const content = windowElement.querySelector('.content');
    
    if (titlebar && content) {
        const windowHeight = windowElement.offsetHeight;
        const titlebarHeight = titlebar.offsetHeight;
        const padding = 40; // Account for content padding
        const newHeight = windowHeight - titlebarHeight - padding;
        content.style.height = Math.max(newHeight, 100) + 'px';
    }
}

// Desktop icon dragging
document.addEventListener('mousedown', (e) => {
    // Check if clicking on a window (bring to front)
    const windowElement = e.target.closest('.window');
    if (windowElement) {
        bringToFront(windowElement);
    }
    
    if (e.target.closest('.desktop-icon') && !e.target.classList.contains('resize-handle')) {
        e.preventDefault();
        draggedIcon = e.target.closest('.desktop-icon');
        const rect = draggedIcon.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
        draggedIcon.classList.add('selected');
        document.body.style.userSelect = 'none';
    }
    // Allow window drag only if mousedown is on a title bar
    allowWindowDrag = !!e.target.closest('.title-bar');
});

document.addEventListener('mousemove', (e) => {
    if (draggedIcon) {
        e.preventDefault();
        const x = e.clientX - offset.x;
        const y = e.clientY - offset.y;
        
        draggedIcon.style.left = Math.max(0, Math.min(x, window.innerWidth - draggedIcon.offsetWidth)) + 'px';
        draggedIcon.style.top = Math.max(0, Math.min(y, window.innerHeight - draggedIcon.offsetHeight)) + 'px';
        draggedIcon.style.right = 'auto'; // Override right positioning
    }
    
    // Existing resize functionality
    if (isResizing && resizeElement) {
        const deltaX = e.clientX - startMousePos.x;
        const deltaY = e.clientY - startMousePos.y;
        
        let newWidth = startWindowSize.width;
        let newHeight = startWindowSize.height;
        
        if (resizeDirection.includes('e')) {
            newWidth = Math.max(200, startWindowSize.width + deltaX);
        }
        if (resizeDirection.includes('s')) {
            newHeight = Math.max(150, startWindowSize.height + deltaY);
        }
        
        resizeElement.style.width = newWidth + 'px';
        resizeElement.style.height = newHeight + 'px';
        
        // Update content area height
        const content = resizeElement.querySelector('.window-body');
        if (content) {
            const titlebarHeight = resizeElement.querySelector('.title-bar').offsetHeight;
            const padding = 40; // Account for padding
            content.style.height = (newHeight - titlebarHeight - padding) + 'px';
        }
    }
});

document.addEventListener('mouseup', (e) => {
    if (draggedIcon) {
        draggedIcon.classList.remove('selected');
        draggedIcon = null;
        document.body.style.userSelect = '';
    }
    
    if (isResizing) {
        isResizing = false;
        resizeElement = null;
        resizeDirection = '';
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
    allowWindowDrag = false;
});

document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('window')) {
        if (!allowWindowDrag) {
            e.preventDefault();
            return;
        }
        draggedElement = e.target;
        const rect = draggedElement.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
        e.dataTransfer.effectAllowed = 'move';
    }
});

document.addEventListener('dragover', (e) => {
    if (draggedElement) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
});

document.addEventListener('drop', (e) => {
    if (draggedElement) {
        e.preventDefault();
        const x = e.clientX - offset.x;
        const y = e.clientY - offset.y;
        
        draggedElement.style.left = Math.max(0, Math.min(x, window.innerWidth - draggedElement.offsetWidth)) + 'px';
        draggedElement.style.top = Math.max(0, Math.min(y, window.innerHeight - draggedElement.offsetHeight)) + 'px';
        
        draggedElement = null;
    }
});

// Resize event listeners  
document.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('resize-handle')) {
        e.preventDefault();
        isResizing = true;
        resizeElement = e.target.closest('.window');
        resizeDirection = e.target.classList.contains('se') ? 'se' : 
                         e.target.classList.contains('s') ? 's' : 'e';
        
        startMousePos = { x: e.clientX, y: e.clientY };
        startWindowSize = { 
            width: resizeElement.offsetWidth, 
            height: resizeElement.offsetHeight 
        };
        startWindowPos = { 
            x: parseInt(resizeElement.style.left) || 0, 
            y: parseInt(resizeElement.style.top) || 0 
        };
        
        document.body.style.cursor = e.target.style.cursor;
        document.body.style.userSelect = 'none';
    }
});

// Zoom functionality for windows
function zoomWindow(windowId, direction) {
    // Initialize zoom level for this window if it doesn't exist
    if (!windowZoomLevels[windowId]) {
        windowZoomLevels[windowId] = 0; // 0 = 100% (default)
    }
    
    // Update zoom level (-3 to +5 range, where 0 is default)
    windowZoomLevels[windowId] += direction;
    windowZoomLevels[windowId] = Math.max(-3, Math.min(5, windowZoomLevels[windowId]));
    
    // Calculate zoom factor (80% to 180%)
    const zoomFactor = 1 + (windowZoomLevels[windowId] * 0.2);
    
    // Find the window element
    let windowElement;
    if (windowId.includes('week')) {
        windowElement = document.getElementById(windowId).querySelector('.window-body');
    } else {
        windowElement = document.querySelector(`.${windowId} .window-body`);
    }
    
    if (windowElement) {
        // Apply zoom by scaling font size for the entire window
        const baseFontSize = 11; // Base font size from CSS
        const newFontSize = Math.round(baseFontSize * zoomFactor);
        
        // Set base font size for the entire window
        windowElement.style.fontSize = newFontSize + 'px';
        
        // Scale all paragraphs and text elements
        const textElements = windowElement.querySelectorAll('p, div, span, li, td, th, a, strong, em');
        textElements.forEach(element => {
            element.style.fontSize = newFontSize + 'px';
        });
        
        // Scale headings proportionally (larger than base text)
        const headings = windowElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            const tagName = heading.tagName.toLowerCase();
            let baseSize;
            switch(tagName) {
                case 'h1': baseSize = 18; break;
                case 'h2': baseSize = 16; break;
                case 'h3': baseSize = 14; break;
                case 'h4': baseSize = 13; break;
                case 'h5': baseSize = 12; break;
                case 'h6': baseSize = 11; break;
                default: baseSize = 11; break;
            }
            heading.style.fontSize = Math.round(baseSize * zoomFactor) + 'px';
        });
        
        // Scale code elements
        const codeElements = windowElement.querySelectorAll('code, pre');
        codeElements.forEach(code => {
            const baseCodeSize = 10; // Slightly smaller than regular text
            code.style.fontSize = Math.round(baseCodeSize * zoomFactor) + 'px';
        });
        
        // Scale button text
        const buttons = windowElement.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.fontSize = newFontSize + 'px';
        });
        
        console.log(`Zoomed ${windowId} to ${Math.round(zoomFactor * 100)}%`);
    }
}

// Modal window functions
// Generic modal window functions for weeks
function openWeekWindow(weekNumber) {
    const modalElement = document.getElementById(`week${weekNumber}Window`);
    if (!modalElement) return;
    const windowElement = modalElement.querySelector('.window');
    modalElement.style.display = 'block';
    bringToFront(windowElement);
    loadWeekContent(weekNumber);
}

function closeWeekWindow(weekNumber) {
    const modalElement = document.getElementById(`week${weekNumber}Window`);
    if (modalElement) modalElement.style.display = 'none';
}

async function loadWeekContent(weekNumber) {
    const contentId = `week${weekNumber}Content`;
    const container = document.getElementById(contentId);
    if (!container) return;
    container.innerHTML = '<p>Loading content...</p>';
    const fileName = `week${weekNumber}.md`;
    try {
        const response = await fetch(fileName, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const markdown = await response.text();
        const html = parseMarkdown(markdown);
        container.innerHTML = html;
        addImageLoadingStates(contentId);
        // Highlight code blocks after content is loaded
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(container);
        }
    } catch (error) {
        const fallback = `# Week ${weekNumber} (Fallback)\n\nContent unavailable.`;
        container.innerHTML = parseMarkdown(fallback);
    }
}

// Markdown parser using Marked
function parseMarkdown(markdown) {
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true, headerIds: true, mangle: false });
        let html = marked.parse(markdown);
        html = html.replace(/<img([^>]*?)>/g, '<img$1 style="max-width: calc(100% - 20px); height: auto; margin: 10px 0;" loading="lazy">');
        return html;
    }
    // Minimal fallback
    let html = markdown
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    const paragraphs = html.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => {
        if (p.match(/^<[h1-6]|^<div|^<img|^<ul|^<ol|^<li|^<pre|^<code/)) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n\n');
    return paragraphs;
}

// Add loading states for images to improve perceived performance
function addImageLoadingStates(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
        // Skip if image already has loading handling
        if (img.dataset.loadingHandled) return;
        img.dataset.loadingHandled = 'true';
        
        // Create loading placeholder
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            width: ${img.getAttribute('width') || '300'}px;
            height: 200px;
            background: #c0c0c0;
            border: 1px solid #808080;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #000;
            margin: 10px 0;
            border-radius: 2px;
        `;
        placeholder.textContent = 'Loading image...';
        
        // Insert placeholder before image
        img.parentNode.insertBefore(placeholder, img);
        img.style.display = 'none';
        
        img.onload = function() {
            placeholder.remove();
            img.style.display = 'block';
            console.log('Image loaded:', img.src.substring(0, 50) + '...');
        };
        
        img.onerror = function() {
            placeholder.textContent = '❌ Failed to load image';
            placeholder.style.backgroundColor = '#ffcccc';
            placeholder.style.color = '#cc0000';
            console.error('Failed to load image:', img.src);
        };
        
        // Add timeout to show error after 10 seconds
        setTimeout(() => {
            if (img.style.display === 'none' && placeholder.parentNode) {
                placeholder.textContent = 'Image loading slowly...';
                placeholder.style.backgroundColor = '#ffffcc';
            }
        }, 10000);
    });
}

// Music Player Functions
function playMusic() {
    const audioPlayer = document.getElementById('audioPlayer');
    const trackInfo = document.getElementById('trackInfo');
    
    if (audioPlayer) {
        audioPlayer.play().then(() => {
            trackInfo.textContent = "♪ Playing: Bleachers ♪";
        }).catch(error => {
            trackInfo.textContent = "Error: Could not load track";
            console.error('Audio play error:', error);
        });
    }
}

function pauseMusic() {
    const audioPlayer = document.getElementById('audioPlayer');
    const trackInfo = document.getElementById('trackInfo');
    
    if (audioPlayer) {
        audioPlayer.pause();
        trackInfo.textContent = "⏸ Paused: Bleachers";
    }
}

function stopMusic() {
    const audioPlayer = document.getElementById('audioPlayer');
    const trackInfo = document.getElementById('trackInfo');
    
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        trackInfo.textContent = "⏹ Stopped";
    }
}

function setVolume(value) {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
        audioPlayer.volume = value / 100;
    }
}

// Initialize audio player when page loads
document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audioPlayer');
    const trackInfo = document.getElementById('trackInfo');
    
    if (audioPlayer && trackInfo) {
        audioPlayer.volume = 0.5;
        trackInfo.textContent = "Ready to play";
    }
    
    // Ensure zoomWindow is available globally
    window.zoomWindow = zoomWindow;
    
    console.log('Windows.js loaded successfully');
    // Ensure background image loads from local file
    const bgImg = new Image();
    bgImg.onload = function() {
        document.body.style.backgroundImage = "url('https://i.redd.it/02dw11nuqf681.jpg')";
    };
    bgImg.src = 'https://i.redd.it/02dw11nuqf681.jpg';
    
    // Build week icons and windows dynamically
    initializeWeeks();
});

async function initializeWeeks() {
    // Prefer manifest if available
    try {
        const manifestRes = await fetch('weeks.json', { cache: 'no-store' });
        if (manifestRes.ok) {
            const weeks = await manifestRes.json();
            if (Array.isArray(weeks)) {
                weeks.forEach(n => createWeekIconAndModal(Number(n)));
                return;
            }
        }
    } catch (_) {}

    // Fallback: only probe week1..week4 to avoid 404 spam
    for (let i = 1; i <= 4; i++) {
        try {
            const res = await fetch(`week${i}.md`, { cache: 'no-store' });
            if (!res.ok) break;
            const text = await res.text();
            if (!text || !text.trim()) break;
            createWeekIconAndModal(i);
        } catch (_) {
            break;
        }
    }
}

function createWeekIconAndModal(weekNumber) {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.onclick = () => openWeekWindow(weekNumber);
    // initial placement on the top-right to avoid overlap
    const spacing = 80;
    icon.style.top = '20px';
    icon.style.right = `${20 + (weekNumber - 1) * spacing}px`;
    icon.style.left = 'auto';
    icon.innerHTML = `
        <div class="app-icon">
            <div class="icon-image folder"></div>
        </div>
        <div class="icon-label">Week ${weekNumber}</div>
    `;
    document.body.appendChild(icon);

    const modal = document.createElement('div');
    modal.id = `week${weekNumber}Window`;
    modal.className = 'modal-window';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="window" style="width: 600px; height: 400px; top: 100px; left: 150px;" draggable="true">
            <div class="title-bar">
                <div class="title-bar-text">Week ${weekNumber} - How to Make Almost Anything</div>
                <div class="title-bar-controls">
                    <button aria-label="Zoom Out" onclick="zoomWindow('week${weekNumber}Window', -1)">-</button>
                    <button aria-label="Zoom In" onclick="zoomWindow('week${weekNumber}Window', 1)">+</button>
                    <button aria-label="Close" onclick="closeWeekWindow(${weekNumber})"></button>
                </div>
            </div>
            <div class="window-body" style="height: 350px; overflow-y: auto;">
                <div id="week${weekNumber}Content">Loading...</div>
            </div>
            <div class="resize-handle se"></div>
            <div class="resize-handle s"></div>
            <div class="resize-handle e"></div>
        </div>
    `;
    document.body.appendChild(modal);
}
