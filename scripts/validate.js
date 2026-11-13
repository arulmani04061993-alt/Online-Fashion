const fs = require('fs');

const index = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('assets/js/main.js', 'utf8');
const css = fs.readFileSync('assets/css/styles.css', 'utf8');

console.log('index.html characters:', index.length);
console.log('main.js characters:', js.length);
console.log('styles.css characters:', css.length);

const sections = [
  'header', 'hero', 'categories', 'catalog-section', 
  'new-arrivals', 'trending', 'best-sellers', 
  'special-offers', 'testimonials', 'newsletter', 'footer'
];

sections.forEach(s => {
  const present = index.includes(`id="${s}"`) || index.includes(`class="${s}`);
  console.log(`Section [${s}]: ${present ? 'PASSED' : 'FAILED'}`);
});

const modals = ['product-modal-overlay', 'order-modal-overlay', 'cart-drawer'];
modals.forEach(m => {
  const present = index.includes(m);
  console.log(`Component [${m}]: ${present ? 'PASSED' : 'FAILED'}`);
});

try {
  new Function(js);
  console.log('JavaScript syntax test: PASSED (No errors)');
} catch (e) {
  console.error('JavaScript syntax test: FAILED', e);
  process.exit(1);
}
