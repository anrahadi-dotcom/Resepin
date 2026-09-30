export default async function run(page, ui) {
  await page.goto('http://localhost:8765/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  return await page.evaluate(() => {
    const grid = document.getElementById('recipesGrid');
    return {
      recipesDb: typeof RECIPES_DB,
      showPage: typeof showPage,
      renderGrid: typeof renderRecipesGrid,
      gridChildren: grid ? grid.children.length : 'no grid',
      imgs: document.querySelectorAll('.recipe-img-photo').length,
      mainJsTail: (document.querySelector('script[src*="main.js"]') || {}).src
    };
  });
}
