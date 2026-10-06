const fs = require('fs');
const path = require('path');
const dir = '/Users/pranjalsoni/Desktop/NetworkX/Networkx/src/app';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // A simple heuristic: if the file has lots of dark colors, replace them.
  // This is a naive script to list the files that might need replacements.
  let darkMatches = content.match(/#(0[0-9a-fA-F]|1[0-9a-fA-F])[0-9a-fA-F]{4}/g);
  let whiteMatches = content.match(/#f[0-9a-fA-F]{5}/g);
  let rgbaMatches = content.match(/rgba\(\s*[0-2]?[0-9]\s*,\s*[0-2]?[0-9]\s*,\s*[0-2]?[0-9]\s*,/g);
  
  if (darkMatches || whiteMatches || rgbaMatches) {
    console.log(file, 'Dark:', darkMatches?.length || 0, 'White:', whiteMatches?.length || 0, 'RGBA:', rgbaMatches?.length || 0);
  }
}
