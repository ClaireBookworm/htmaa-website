// Draggable Windows Functionality for Retro Windows 95/98 Style

let draggedElement = null;
let draggedIcon = null;
let offset = { x: 0, y: 0 };
let topZIndex = 1000; // Track the highest z-index
let allowWindowDrag = false; // Only allow dragging when starting on title bar
let windowMaximized = {}; // Track maximized state and previous geometry

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
        
        // Update window width class for text formatting
        updateWindowSizeClass(resizeElement);
        
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
    if (windowId.includes('week') || windowId === 'finalProjectWindow') {
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

// Function to update window size classes for responsive text formatting
function updateWindowSizeClass(windowElement) {
    const width = windowElement.offsetWidth;
    
    // Remove existing size classes
    windowElement.classList.remove('small-window', 'medium-window', 'large-window');
    
    // Add appropriate class based on width
    if (width >= 600) {
        windowElement.classList.add('large-window');
    } else if (width >= 400) {
        windowElement.classList.add('medium-window');
    } else {
        windowElement.classList.add('small-window');
    }
}

// Update window size classes when windows are opened
function updateAllWindowSizes() {
    const allWindows = document.querySelectorAll('.modal-window .window, .window:not(.modal-window .window)');
    allWindows.forEach(updateWindowSizeClass);
}

// Toggle maximize within viewport while keeping title bar visible
function toggleMaxWindow(windowId) {
    let windowElement;
    if (windowId.includes('week')) {
        const modal = document.getElementById(windowId);
        if (!modal) return;
        windowElement = modal.querySelector('.window');
    } else {
        windowElement = document.querySelector(`.${windowId}`);
    }
    if (!windowElement) return;

    const key = windowId;
    const isMax = !!windowMaximized[key];
    if (!isMax) {
        // Save previous geometry
        windowMaximized[key] = {
            top: windowElement.style.top,
            left: windowElement.style.left,
            width: windowElement.style.width,
            height: windowElement.style.height,
            draggable: windowElement.getAttribute('draggable')
        };
        // Apply maximized geometry (small margin)
        const margin = 10;
        windowElement.style.top = margin + 'px';
        windowElement.style.left = margin + 'px';
        windowElement.style.width = (window.innerWidth - margin * 2) + 'px';
        windowElement.style.height = (window.innerHeight - margin * 2) + 'px';
        windowElement.setAttribute('draggable', 'false');
        windowElement.classList.add('maximized');
        
        // Update content area height to fill the window
        const content = windowElement.querySelector('.window-body');
        if (content) {
            const titlebarHeight = windowElement.querySelector('.title-bar').offsetHeight;
            const padding = 40; // Account for padding
            content.style.height = (window.innerHeight - margin * 2 - titlebarHeight - padding) + 'px';
        }
    } else {
        const prev = windowMaximized[key];
        delete windowMaximized[key];
        windowElement.style.top = prev.top;
        windowElement.style.left = prev.left;
        windowElement.style.width = prev.width;
        windowElement.style.height = prev.height;
        if (prev.draggable != null) windowElement.setAttribute('draggable', prev.draggable);
        windowElement.classList.remove('maximized');
        
        // Reset content area height to original
        const content = windowElement.querySelector('.window-body');
        if (content) {
            content.style.height = '';
        }
    }
}

// Keep maximized windows sized on viewport resize
window.addEventListener('resize', () => {
    const margin = 10;
    Object.keys(windowMaximized).forEach(key => {
        let windowElement;
        if (key.includes('week')) {
            const modal = document.getElementById(key);
            if (!modal) return;
            windowElement = modal.querySelector('.window');
        } else {
            windowElement = document.querySelector(`.${key}`);
        }
        if (!windowElement) return;
        windowElement.style.top = margin + 'px';
        windowElement.style.left = margin + 'px';
        windowElement.style.width = (window.innerWidth - margin * 2) + 'px';
        windowElement.style.height = (window.innerHeight - margin * 2) + 'px';
        
        // Update content area height to fill the window
        const content = windowElement.querySelector('.window-body');
        if (content) {
            const titlebarHeight = windowElement.querySelector('.title-bar').offsetHeight;
            const padding = 40; // Account for padding
            content.style.height = (window.innerHeight - margin * 2 - titlebarHeight - padding) + 'px';
        }
    });
});

// Modal window functions
// Generic modal window functions for weeks
function openWeekWindow(weekNumber) {
    const modalElement = document.getElementById(`week${weekNumber}Window`);
    if (!modalElement) return;
    const windowElement = modalElement.querySelector('.window');
    modalElement.style.display = 'block';
    bringToFront(windowElement);
    updateWindowSizeClass(windowElement); // Update size class when opening
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
        // Highlight code blocks after content is loaded
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(container);
        }
    } catch (error) {
        const fallback = `# Week ${weekNumber} (Fallback)\n\nContent unavailable.`;
        container.innerHTML = parseMarkdown(fallback);
    }
}

// Final Project window functions
function openFinalProjectWindow() {
    const modalElement = document.getElementById('finalProjectWindow');
    if (!modalElement) return;
    const windowElement = modalElement.querySelector('.window');
    modalElement.style.display = 'block';
    bringToFront(windowElement);
    updateWindowSizeClass(windowElement); // Update size class when opening
    loadFinalProjectContent();
}

function closeFinalProjectWindow() {
    const modalElement = document.getElementById('finalProjectWindow');
    if (modalElement) modalElement.style.display = 'none';
}

async function loadFinalProjectContent() {
    const contentId = 'finalProjectContent';
    const container = document.getElementById(contentId);
    if (!container) return;
    container.innerHTML = '<p>Loading final project...</p>';
    
    try {
        const response = await fetch('finalproject.md', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const markdown = await response.text();
        const html = parseMarkdown(markdown);
        container.innerHTML = html;
        // Highlight code blocks after content is loaded
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(container);
        }
    } catch (error) {
        console.error('Failed to load finalproject.md:', error);
        const fallback = '# Final Project (Fallback)\n\nContent unavailable.';
        container.innerHTML = parseMarkdown(fallback);
    }
}

// Markdown parser using Marked
function parseMarkdown(markdown) {
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true, headerIds: true, mangle: false });
        let html = marked.parse(markdown);
        html = html.replace(/<img([^>]*?)>/g, (match, attrs) => {
            // Check if width attribute exists
            const widthMatch = attrs.match(/width="?(\d+)"?/);
            if (widthMatch) {
                const width = widthMatch[1];
                return `<img${attrs} style="max-width: min(100%, ${width}px); height: auto; margin: 16px 0; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: block;" loading="lazy">`;
            }
            return `<img${attrs} style="max-width: 100%; height: auto; margin: 16px 0; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: block;" loading="lazy">`;
        });
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


// Music Player Functions
function playMusic() {
    const audioPlayer = document.getElementById('audioPlayer');
    const trackInfo = document.getElementById('trackInfo');
    
    if (audioPlayer) {
        audioPlayer.play().then(() => {
            trackInfo.textContent = "Playing: Chinatown by Bleachers";
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
        trackInfo.textContent = "Paused: Chinatown by Bleachers";
    }
}

// function stopMusic() {
//     const audioPlayer = document.getElementById('audioPlayer');
//     const trackInfo = document.getElementById('trackInfo');
    
//     if (audioPlayer) {
//         audioPlayer.pause();``
//         audioPlayer.currentTime = 0;
//         trackInfo.textContent = "⏹ Stopped";
//     }
// }

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
        trackInfo.textContent = "Ready to play...";
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
    
    // Create static windows from configuration
    createStaticWindows();
    
    // Handle font loading to prevent glitchy text
    handleFontLoading();
});

async function initializeWeeks() {
    // Prefer manifest if available
    try {
        const manifestRes = await fetch('weeks.json', { cache: 'no-store' });
        if (manifestRes.ok) {
            const weeks = await manifestRes.json();
            if (Array.isArray(weeks)) {
                weeks.forEach(n => createWeekIconAndModal(Number(n)));
                // Check for final project after weeks
                checkAndCreateFinalProject();
                return;
            }
        }
    } catch (_) {}

    // Check for HTML files directly instead of markdown
    for (let i = 1; i <= 12; i++) {
        try {
            const res = await fetch(`week${i}.html`, { cache: 'no-store' });
            if (res.ok) {
                createWeekIconAndModal(i);
            }
        } catch (_) {
            // Continue checking other weeks even if one fails
        }
    }
    
    // Check for final project
    checkAndCreateFinalProject();
}

// Generic function to create desktop icon
function createDesktopIcon(config) {
    const { id, label, iconClass, onClick, position } = config;
    
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    if (position) {
        icon.style.top = position.top || '20px';
        icon.style.right = position.right || 'auto';
        icon.style.left = position.left || 'auto';
    }
    icon.onclick = onClick;
    
    icon.innerHTML = `
        <div class="app-icon">
            <div class="icon-image ${iconClass}"></div>
        </div>
        <div class="icon-label">${label}</div>
    `;
    
    document.body.appendChild(icon);
    return icon;
}

// Generic function to create window modal
function createWindowModal(config) {
    const { 
        id, 
        title, 
        contentId, 
        width = '600px', 
        height = '400px', 
        top = '100px', 
        left = '150px',
        showMaximize = true,
        showZoom = true,
        showClose = true,
        onClose = null,
        content = 'Loading...'
    } = config;
    
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal-window';
    modal.style.display = 'none';
    
    const controls = [];
    if (showMaximize) {
        controls.push(`<button aria-label="Maximize" onclick="toggleMaxWindow('${id}')">^</button>`);
    }
    if (showZoom) {
        controls.push(`<button aria-label="Zoom Out" onclick="zoomWindow('${id}', -1)">-</button>`);
        controls.push(`<button aria-label="Zoom In" onclick="zoomWindow('${id}', 1)">+</button>`);
    }
    if (showClose && onClose) {
        controls.push(`<button aria-label="Close" onclick="${onClose}"></button>`);
    }
    
    modal.innerHTML = `
        <div class="window" style="width: ${width}; height: ${height}; top: ${top}; left: ${left};" draggable="true">
            <div class="title-bar">
                <div class="title-bar-text">${title}</div>
                <div class="title-bar-controls">
                    ${controls.join('')}
                </div>
            </div>
            <div class="window-body" style="height: calc(${height} - 50px); overflow-y: auto;">
                <div id="${contentId}">${content}</div>
            </div>
            <div class="resize-handle se"></div>
            <div class="resize-handle s"></div>
            <div class="resize-handle e"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

function createWeekIconAndModal(weekNumber) {
    const spacing = 80;
    const rightPosition = 20 + (weekNumber - 1) * spacing;
    
    // Create desktop icon that links to blog page
    createDesktopIcon({
        id: `week${weekNumber}Icon`,
        label: `Week ${weekNumber}`,
        iconClass: 'folder',
        onClick: () => window.location.href = `week${weekNumber}.html`,
        position: { top: '20px', right: `${rightPosition}px`, left: 'auto' }
    });
    
    // No longer create window modal - we're using blog pages instead
}

// Check for final project and create icon/modal if it exists
async function checkAndCreateFinalProject() {
    try {
        const res = await fetch('finalproject.html', { cache: 'no-store' });
        if (res.ok) {
            createFinalProjectIconAndModal();
        }
    } catch (_) {
        // Final project doesn't exist, that's okay
    }
}

// Create Final Project desktop icon that links to blog page
function createFinalProjectIconAndModal() {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon final-project-icon';
    icon.onclick = () => window.location.href = 'finalproject.html';
    // Place it at the bottom right with fixed dimensions
    icon.style.bottom = '20px';
    icon.style.right = '20px';
    icon.style.left = 'auto';
    icon.style.top = 'auto';
    icon.style.width = '64px'; // Ensure consistent width
    icon.style.height = '80px'; // Fixed height to prevent stretching
    icon.innerHTML = `
        <div class="app-icon">
            <div class="icon-image folder" style="background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: 2px solid #333;"></div>
        </div>
        <div class="icon-label">Final Project</div>
    `;
    document.body.appendChild(icon);

    // No longer create modal - we're using blog page instead
}

// Configuration for static windows
const staticWindowsConfig = [
    {
        id: 'window1',
        title: "claire's website",
        content: `<h1>welcome to claire's<br>how to make almost anything<br>website</h1>
                  <button>ok</button>
                  <button>cancel</button>`,
        position: { top: '50px', left: '50px' },
        size: { width: 'auto', height: 'auto' }
    },
    // {
    //     id: 'window2',
    //     title: 'todos.txt',
    //     content: `this is where i document my journey through making stuff for htmaa.<br><br>
    //               current projects:<br>
    //               - learning cad<br>
    //               - doing some laser cut wood art<br>
    //               - helping build a microscope<br><br>
    //               status: [undefined, week 1?]`,
    //     position: { top: '300px', left: '300px' },
    //     size: { width: '300px', height: 'auto' }
    // },
    {
        id: 'window3',
        title: 'about.txt',
        content: `i am currently a junior at MIT studing eecs and neuroscience. <br><br>
                  i'm really interested in building interactive music art projects and music in general. I occasionally produce music and have a weekly radio show in Boston with MIT's WMBR. Most of my projects in this class will be / are music inspired. Please send any music recs:)<br><br>
                  I've also been doing some neurotech research and work, so I'm hoping to learn to build smaller-scale BCI stuff from this class. Otherwise, I've worked on whole brain emulation research at MIT, helped construct and build microscopes, did some wet lab experimentation, and trained embodied intelligence models to simulate C. elegans movements. Recently, I just took a gap semester to work at <a href="https://e11.bio">e11.bio</a> as an ML engineer, processing our petabytes of brain slicing imaging and segmenting them in order to trace axons across brain slices.<br><br>
                  feel free to reach out! my website is <a href="https://clairebookworm.com">clairebookworm.com</a> to learn more.<br>`,
        position: { top: '150px', left: '500px' },
        size: { width: '550px', height: 'auto' }
    }
];

// Create static windows from configuration
function createStaticWindows() {
    staticWindowsConfig.forEach(config => {
        const window = document.createElement('div');
        window.className = `window ${config.id}`;
        window.draggable = 'true';
        window.style.top = config.position.top;
        window.style.left = config.position.left;
        if (config.size.width !== 'auto') window.style.width = config.size.width;
        if (config.size.height !== 'auto') window.style.height = config.size.height;
        
        window.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">${config.title}</div>
                <div class="title-bar-controls">
                    <button aria-label="Maximize" onclick="toggleMaxWindow('${config.id}')">^</button>
                    <button aria-label="Zoom Out" onclick="zoomWindow('${config.id}', -1)">-</button>
                    <button aria-label="Zoom In" onclick="zoomWindow('${config.id}', 1)">+</button>
                </div>
            </div>
            <div class="window-body static-window">
                ${config.content}
            </div>
        `;
        
        document.body.appendChild(window);
    });
}

// Handle font loading to prevent glitchy text rendering
function handleFontLoading() {
    // Check if fonts are already loaded
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            document.body.classList.add('fonts-loaded');
        });
    } else {
        // Fallback for older browsers
        setTimeout(() => {
            document.body.classList.add('fonts-loaded');
        }, 1000);
    }
}
