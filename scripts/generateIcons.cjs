const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');

function walk(dir, category) {
  let results = [];

  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath, category || file));    
    } else if (file.endsWith('.svg')) {
      results.push({
        id: file.replace('.svg', ''),
        name: file.replace('.svg', '').replace(/-/g, ' '),
        category: category || 'general',
        tags: [],
        svg_url: `/icons/${dir.replace(path.join(__dirname, '../public/icons'), '').replace(/\\/g, '/')}/${file}`,
        attribution_required: true,
        author: 'BioIcons',
        license: 'CC BY 3.0',
        source_url: 'https://bioicons.com'
      });
    }
  });

  return results;
}

const icons = walk(ICONS_DIR, '');

fs.mkdirSync(path.join(__dirname, '../src/data'), { recursive: true });

fs.writeFileSync(
  path.join(__dirname, '../src/data/icons.json'),
  JSON.stringify(icons, null, 2)
);

console.log(`✅ Generated ${icons.length} icons`);