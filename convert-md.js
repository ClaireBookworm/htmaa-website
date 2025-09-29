#!/usr/bin/env node

// Easy markdown to HTML converter
// Usage: node convert-md.js <input.md> [output.html] [title]

const fs = require('fs');
const path = require('path');
const { parseMarkdown, generateHTMLPage } = require('./md-to-html.js');

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node convert-md.js <input.md> [output.html] [title]');
        console.log('Examples:');
        console.log('  node convert-md.js week3.md');
        console.log('  node convert-md.js week3.md week3.html "Week 3 - Electronics"');
        process.exit(1);
    }
    
    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace('.md', '.html');
    const title = args[2] || path.basename(inputFile, '.md').replace(/([A-Z])/g, ' $1').trim();
    
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ File not found: ${inputFile}`);
        process.exit(1);
    }
    
    try {
        const html = generateHTMLPage(inputFile, title, 0);
        fs.writeFileSync(outputFile, html);
        console.log(`✅ Generated ${outputFile} from ${inputFile}`);
    } catch (error) {
        console.error(`❌ Error converting ${inputFile}:`, error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
