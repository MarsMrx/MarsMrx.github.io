(() => {
  const archive = document.querySelector('#archive .article-sort');
  if (!archive) return;
  const years = [...archive.querySelectorAll('.article-sort-item.year')];
  years.forEach((year, index) => {
    let month = '';
    let current = year.nextElementSibling;
    while (current && !current.classList.contains('year')) {
      if (current.classList.contains('article-sort-item')) {
        const time = current.querySelector('time');
        const value = time ? (time.getAttribute('datetime') || '') : '';
        const nextMonth = value.slice(0, 7);
        if (nextMonth && nextMonth !== month) {
          month = nextMonth;
          const label = document.createElement('div');
          label.className = 'archive-month';
          label.textContent = `${Number(nextMonth.slice(5))}月`;
          current.before(label);
        }
      }
      current = current.nextElementSibling;
    }

    const entries = [];
    let next = year.nextElementSibling;
    while (next && !next.classList.contains('year')) {
      entries.push(next);
      next = next.nextElementSibling;
    }
    year.classList.add('archive-year-toggle');
    year.setAttribute('role', 'button');
    year.setAttribute('tabindex', '0');
    year.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
    const toggle = () => {
      const expanded = year.getAttribute('aria-expanded') === 'true';
      year.setAttribute('aria-expanded', String(!expanded));
      entries.forEach(entry => { entry.hidden = expanded; });
    };
    year.addEventListener('click', toggle);
    year.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });
    if (index !== 0) entries.forEach(entry => { entry.hidden = true; });
  });
})();
