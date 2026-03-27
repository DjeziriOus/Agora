const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(path.join(dir, file), fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      if (content.includes('useSearchParams') || content.includes('usePathname')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}
console.log(walk(path.join(process.cwd(), 'src')));
