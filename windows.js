// Draggable Windows Functionality for Retro Windows 95/98 Style

let draggedElement = null;
let draggedIcon = null;
let offset = { x: 0, y: 0 };
let topZIndex = 1000; // Track the highest z-index

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
});

document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('window')) {
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

// Modal window functions
function openWeek1Window() {
    const modalElement = document.getElementById('week1Window');
    const windowElement = modalElement.querySelector('.window');
    modalElement.style.display = 'block';
    bringToFront(windowElement);
    loadWeek1Content();
}

function closeWeek1Window() {
    document.getElementById('week1Window').style.display = 'none';
}

function openWeek2Window() {
    const modalElement = document.getElementById('week2Window');
    const windowElement = modalElement.querySelector('.window');
    modalElement.style.display = 'block';
    bringToFront(windowElement);
    loadWeek2Content();
}

function closeWeek2Window() {
    document.getElementById('week2Window').style.display = 'none';
}

function openWeek3Window() {
    const modalElement = document.getElementById('week3Window');
    const windowElement = modalElement.querySelector('.window');
    modalElement.style.display = 'block';
    bringToFront(windowElement);
    loadWeek3Content();
}

function closeWeek3Window() {
    document.getElementById('week3Window').style.display = 'none';
}

// Load Week 3 content from markdown file
async function loadWeek3Content() {
    console.log('Attempting to load week3.md...');
    try {
        const response = await fetch('week3.md');
        console.log('Fetch response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const markdown = await response.text();
        console.log('Successfully loaded week3.md content:', markdown.substring(0, 100) + '...');
        const html = parseMarkdown(markdown);
        document.getElementById('week3Content').innerHTML = html;
    } catch (error) {
        console.error('Failed to load week3.md:', error);
        console.log('Using fallback content instead');

        // Fallback to embedded content if file can't be loaded
        const fallbackContent = `# Week 3: Electronics Production (Fallback)

⚠️ **Note**: This is fallback content. The actual week3.md file could not be loaded.`;

        const html = parseMarkdown(fallbackContent);
        document.getElementById('week3Content').innerHTML = html;
    }
}

// Load Week 1 content from markdown file
async function loadWeek1Content() {
    console.log('Attempting to load week1.md...');
    try {
        const response = await fetch('week1.md');
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const markdown = await response.text();
        console.log('Successfully loaded week1.md content:', markdown.substring(0, 100) + '...');
        const html = parseMarkdown(markdown);
        document.getElementById('week1Content').innerHTML = html;
    } catch (error) {
        console.error('Failed to load week1.md:', error);
        console.log('Using fallback content instead');
        
        // Fallback to embedded content if file can't be loaded
        const fallbackContent = `# Week 1: Introduction & Planning (Fallback)

⚠️ **Note**: This is fallback content. The actual week1.md file could not be loaded.`;
        
        const html = parseMarkdown(fallbackContent);
        document.getElementById('week1Content').innerHTML = html;
    }
}

// Load Week 2 content from markdown file
async function loadWeek2Content() {
    console.log('Attempting to load week2.md...');
    try {
        const response = await fetch('week2.md');
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const markdown = await response.text();
        console.log('Successfully loaded week2.md content:', markdown.substring(0, 100) + '...');
        const html = parseMarkdown(markdown);
        document.getElementById('week2Content').innerHTML = html;
    } catch (error) {
        console.error('Failed to load week2.md:', error);
        console.log('Using fallback content instead');
        
        // Fallback to embedded content if file can't be loaded
        const fallbackContent = `# Week 2: Computer-Aided Design (Fallback)

⚠️ **Note**: This is fallback content. The actual week2.md file could not be loaded.`;
        
        const html = parseMarkdown(fallbackContent);
        document.getElementById('week2Content').innerHTML = html;
    }
}// Simple markdown parser
function parseMarkdown(markdown) {
    return markdown
        // Code blocks - must come before other formatting
        .replace(/```([^`]*?)```/gs, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Images - must come before links
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: calc(100% - 20px); height: auto; margin: 10px 0;">')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Lists
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        // Wrap consecutive <li> elements in <ul>
        .replace(/(<li>.*<\/li>)/gs, function(match) {
            return '<ul>' + match + '</ul>';
        })
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.*)$/gim, function(match) {
            if (match.startsWith('<h') || match.startsWith('<ul') || match.startsWith('</ul') || match.startsWith('<li') || match.startsWith('<img') || match.startsWith('<pre') || match.startsWith('<code') || match.trim() === '') {
                return match;
            }
            return '<p>' + match + '</p>';
        })
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<h[1-6]>)/g, '$1')
        .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<ul>)/g, '$1')
        .replace(/(<\/ul>)<\/p>/g, '$1')
        .replace(/<p>(<pre>)/g, '$1')
        .replace(/(<\/pre>)<\/p>/g, '$1')
        .replace(/<p>(<img)/g, '$1')
        .replace(/(<\/img>)<\/p>/g, '$1');
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
});
