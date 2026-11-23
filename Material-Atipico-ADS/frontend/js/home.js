const navSearch      = document.querySelector('.nav-search-input');
const sectionSearch  = document.querySelector('.search-input-wrap input');
const categorySelect = document.querySelectorAll('.filter-select')[0];
const typeSelect     = document.querySelectorAll('.filter-select')[1];
const cards          = document.querySelectorAll('.material-card');

function filtrarCards() {
  const texto     = (navSearch?.value || sectionSearch?.value || '').toLowerCase();
  const categoria = categorySelect?.value || '';

  cards.forEach(card => {
    const titulo = card.querySelector('h3')?.textContent.toLowerCase() || '';
    const desc   = card.querySelector('p')?.textContent.toLowerCase()  || '';
    const tagEl  = card.querySelector('.material-tag');
    const tag    = tagEl ? tagEl.className : '';

    const okTexto     = !texto     || titulo.includes(texto) || desc.includes(texto);
    const okCategoria = !categoria || tag.includes('tag-' + categoria);

    card.style.display = okTexto && okCategoria ? '' : 'none';
  });
}

navSearch?.addEventListener('input', filtrarCards);
sectionSearch?.addEventListener('input', filtrarCards);
categorySelect?.addEventListener('change', filtrarCards);
typeSelect?.addEventListener('change', filtrarCards);
