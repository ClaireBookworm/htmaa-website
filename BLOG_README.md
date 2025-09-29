# Blog-Style Website Revamp

## Overview

Your website has been successfully revamped to combine the Windows 95 aesthetic you love with modern, blog-style content presentation. Each week now has its own dedicated page with clean typography, consistent media sizing, and easy-to-read layouts.

## New Architecture

### File Structure
```
├── index.html              # Original Windows 95 desktop (unchanged)
├── blog-style.css          # New modern blog styling with serif fonts
├── blog-utils.js           # Enhanced functionality utilities
├── md-to-html.js           # Markdown to HTML converter
├── convert-md.js           # Easy conversion script
├── week1.html              # Week 1 blog page
├── week2.html              # Week 2 blog page  
├── week3.html              # Week 3 blog page (generated from week3.md)
├── week4.html              # Week 4 blog page
├── finalproject.html       # Final project page
└── BLOG_README.md          # This file
```

### Key Features

#### 🎨 **Preserved Windows 95 Aesthetic**
- Window frames with title bars and controls
- Classic Windows 95 color scheme and borders
- Draggable window feel maintained

#### 📝 **Modern Blog Layout**
- Clean typography with Newsreader serif font
- Left-aligned text with asymmetric margins (20px left, 300px right)
- Generous right margin ensures TOC doesn't overlap content
- Responsive design for all screen sizes
- Professional code highlighting
- Automatic table of contents generation

#### 🖼️ **Standardized Media System**
- Consistent image heights with `data-size` attributes:
  - `data-size="small"` - 200px height
  - `data-size="medium"` - 300px height  
  - `data-size="large"` - 400px height
  - `data-size="full"` - 500px height
- All images use `object-fit: cover` for consistent appearance
- No border radius or shadows for clean, minimal look
- Image galleries can extend beyond right margin for full visibility
- Video embedding with consistent sizing
- Automatic loading states and error handling

#### 🧭 **Enhanced Navigation**
- Folder icons on main page link directly to blog pages
- Breadcrumb navigation on each blog page
- **Automatic table of contents** in top-right corner of each page
- Keyboard shortcuts (ESC to go back)
- Mobile-responsive navigation (TOC hidden on mobile)

## How to Use

### Adding New Content

#### Option 1: From Markdown (Recommended)
1. **Write in markdown**: Create a `.md` file with your content
2. **Convert to HTML**: Run `node convert-md.js yourfile.md`
3. **Update navigation**: Add the new page to all navigation menus

#### Option 2: Direct HTML
1. **Create a new week page**: Copy `week3.html` as a template
2. **Update navigation**: Add the new page to all navigation menus
3. **Add content**: Use the standardized HTML structure
4. **Size your media**: Add appropriate `data-size` attributes to images/videos

### Image Sizing Guidelines

All images now have consistent heights and no border radius for a clean, uniform look:

```html
<!-- Small images (thumbnails, icons) - 200px height -->
<img src="image.jpg" alt="Description" data-size="small">

<!-- Medium images (most content) - 300px height -->
<img src="image.jpg" alt="Description" data-size="medium">

<!-- Large images (featured content) - 400px height -->
<img src="image.jpg" alt="Description" data-size="large">

<!-- Full-width images (hero images) - 500px height -->
<img src="image.jpg" alt="Description" data-size="full">

<!-- Image galleries -->
<div class="image-gallery">
    <img src="img1.jpg" alt="Image 1" data-size="small">
    <img src="img2.jpg" alt="Image 2" data-size="small">
    <img src="img3.jpg" alt="Image 3" data-size="small">
</div>
```

### Video Embedding

```html
<!-- Standard video -->
<video src="video.mp4" controls data-size="medium"></video>

<!-- Large video -->
<video src="video.mp4" controls data-size="large"></video>
```

### Code Blocks

```html
<!-- Code with copy button (automatic) -->
<pre><code class="language-python">
def hello_world():
    print("Hello, World!")
</code></pre>
```

## Benefits of the New System

### ✅ **SEO-Friendly**
- Each week has its own URL (`/week1.html`, `/week2.html`, etc.)
- Proper HTML structure for search engines
- Fast loading times

### ✅ **Easy to Maintain**
- Clean separation between styling and content
- Consistent formatting across all pages
- Easy to add new weeks

### ✅ **Professional Appearance**
- Modern typography and spacing
- Consistent media presentation
- Mobile-responsive design

### ✅ **Preserves Your Aesthetic**
- Keeps the Windows 95 window frames you love
- Maintains the nostalgic desktop feel
- Best of both worlds: retro frames + modern content

## Migration from Markdown

Your existing markdown content has been converted to HTML with:
- Proper heading hierarchy
- Consistent image sizing with fixed heights
- Enhanced code blocks with syntax highlighting
- Improved link styling
- Better list formatting
- Left-aligned text with serif typography

### Easy Markdown Conversion

Use the included converter to easily convert any markdown file:

```bash
# Convert week3.md to week3.html
node convert-md.js week3.md

# Convert with custom output name and title
node convert-md.js myfile.md output.html "My Custom Title"
```

The converter automatically:
- Converts markdown syntax to HTML
- Adds consistent image sizing
- Generates proper page structure
- Includes navigation and styling

## Future Enhancements

Consider adding:
- Search functionality
- Tag system for posts
- RSS feed
- Comments system
- Dark mode toggle
- Print-optimized styles (already included!)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Print-friendly
- Accessibility features included

---

**Your website now combines the best of both worlds: the nostalgic Windows 95 aesthetic you love with modern, professional blog presentation!** 🎉
