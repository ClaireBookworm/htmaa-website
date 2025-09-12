// Draggable Windows Functionality for Retro Windows 95/98 Style

let draggedElement = null;
let draggedIcon = null;
let offset = { x: 0, y: 0 };

// Resize functionality
let isResizing = false;
let resizeElement = null;
let resizeDirection = '';
let startMousePos = { x: 0, y: 0 };
let startWindowSize = { width: 0, height: 0 };
let startWindowPos = { x: 0, y: 0 };

// Desktop icon dragging
document.addEventListener('mousedown', (e) => {
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
        const content = resizeElement.querySelector('.content');
        if (content) {
            const titlebarHeight = resizeElement.querySelector('.titlebar').offsetHeight;
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
    document.getElementById('week1Window').style.display = 'block';
    loadWeek1Content();
}

function closeWeek1Window() {
    document.getElementById('week1Window').style.display = 'none';
}

function openWeek2Window() {
    document.getElementById('week2Window').style.display = 'block';
    loadWeek2Content();
}

function closeWeek2Window() {
    document.getElementById('week2Window').style.display = 'none';
}

// Week 1 content (embedded to avoid CORS issues)
const week1Markdown = `# Week 1: Introduction & Planning

This week I'm getting started with the "How to Make Almost Anything" course!

## Goals for this week:

- Set up my workspace and tools
- Learn basic CAD software
- Plan my first project
- Document everything on this website

## What I learned:

- Getting familiar with the fab lab equipment
- Understanding the course structure
- Meeting other students in the program

## Next steps:

Moving into Week 2, I'll start working on my first actual project using the laser cutter for some wood art pieces.

*Last updated: September 11, 2025*`;

// Week 2 content
const week2Markdown = `# Week 2: Computer-Aided Design

This week I'm diving into CAD software and learning how to design things digitally!

## Goals for this week:

- Master basic CAD operations
- Design my first 3D model
- Learn about parametric design
- Prepare files for 3D printing

## What I learned:

- Getting comfortable with Fusion 360
- Understanding constraints and sketching
- Learning about design for manufacturing
- Basic 3D modeling techniques

## Projects:

- Designed a simple phone stand
- Created parametric bracket design
- Experimented with organic shapes

## Next steps:

Week 3 will focus on computer-controlled cutting - taking my designs to the laser cutter!

*Last updated: September 11, 2025*`;

// Simple markdown parser
function parseMarkdown(markdown) {
    return markdown
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
            if (match.startsWith('<h') || match.startsWith('<ul') || match.startsWith('</ul') || match.startsWith('<li') || match.trim() === '') {
                return match;
            }
            return '<p>' + match + '</p>';
        })
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<h[1-6]>)/g, '$1')
        .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<ul>)/g, '$1')
        .replace(/(<\/ul>)<\/p>/g, '$1');
}

// Load Week 1 content
function loadWeek1Content() {
    try {
        const html = parseMarkdown(week1Markdown);
        document.getElementById('week1Content').innerHTML = html;
    } catch (error) {
        document.getElementById('week1Content').innerHTML = '<p>Error loading content. Please try again.</p>';
        console.error('Error loading week1 content:', error);
    }
}

// Load Week 2 content
function loadWeek2Content() {
    try {
        const html = parseMarkdown(week2Markdown);
        document.getElementById('week2Content').innerHTML = html;
    } catch (error) {
        document.getElementById('week2Content').innerHTML = '<p>Error loading content. Please try again.</p>';
        console.error('Error loading week2 content:', error);
    }
}
