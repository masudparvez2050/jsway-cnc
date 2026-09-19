const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, '..', 'public'),
  path.join(__dirname, '..', 'reference_site')
];

function cleanHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Replace href="/page.html" with href="/page"
  content = content.replace(/href="\/([a-zA-Z0-9_\-]+)\.html(#?[^"]*)"/g, 'href="/$1$2"');
  
  // 2. Replace href="page.html" with href="/page" (if relative)
  content = content.replace(/href="([a-zA-Z0-9_\-]+)\.html(#?[^"]*)"/g, 'href="/$1$2"');

  // 3. Replace data-href="/page.html" with data-href="/page"
  content = content.replace(/data-href="\/([a-zA-Z0-9_\-]+)\.html(#?[^"]*)"/g, 'data-href="/$1$2"');
  content = content.replace(/data-href="([a-zA-Z0-9_\-]+)\.html(#?[^"]*)"/g, 'data-href="/$1$2"');

  // 4. Also replace full domain links like https://www.jsway-cnc.com/page.html -> /page
  content = content.replace(/href="https?:\/\/www\.jsway-cnc\.com\/([a-zA-Z0-9_\-]+)\.html(#?[^"]*)"/g, 'href="/$1$2"');
  content = content.replace(/href="https?:\/\/www\.jsway-cnc\.com\/?(#?[^"]*)"/g, 'href="/$1"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    let count = 0;
    for (const f of files) {
      if (cleanHtmlFile(path.join(dir, f))) {
        count++;
      }
    }
    console.log(`Updated ${count} files in ${path.basename(dir)}`);
  }
}

console.log('Finished route cleaning.');
