const KROWD_KEY = 'krwd_8ae6db996eae452c113564c7fac871b7ba9552dfa3ac79459a6f32ec78c';
  const COMPANY_ID = 1125;
  const BEER_URL = `https://api.getkrowd.com/v3/beer/index.cfm?companyId=${COMPANY_ID}&apiKey=${encodeURIComponent(KROWD_KEY)}`;
  const EVENTS_URL = `https://api.getkrowd.com/v3/events/index.cfm?companyId=${COMPANY_ID}&apiKey=${encodeURIComponent(KROWD_KEY)}`;

  document.getElementById('year').textContent = new Date().getFullYear();

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => { hamburger.classList.toggle('open'); mobileMenu.classList.toggle('open'); });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { hamburger.classList.remove('open'); mobileMenu.classList.remove('open'); }));

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  (async function loadBeers(){
    const box = document.getElementById('tapContainer');
    try {
      const res = await fetch(BEER_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const beers = (data.beers || []).filter(b => b && !b.is_archived && (b.status ? String(b.status).toLowerCase() === 'active' : true));
      if (!beers.length) { box.innerHTML = '<div class="tap-state">The tap list is being refreshed — check back in a bit.</div>'; return; }

      document.getElementById('statTaps').textContent = beers.length;
      document.getElementById('tapFoot').textContent = `${beers.length} beers on tap · updated live from the taproom`;

      const groups = []; const idx = {};
      beers.forEach(b => {
        const key = b.category_name || b.beer_type || 'On Tap';
        if (!(key in idx)) { idx[key] = groups.length; groups.push({ name: key, order: b.category_order != null ? b.category_order : 99, items: [] }); }
        groups[idx[key]].items.push(b);
      });
      groups.sort((a,b) => (a.order - b.order));

      box.innerHTML = groups.map(g => `
        <div class="tap-cat">
          <div class="tap-cat-name"><b>${esc(g.name)}</b> <span>${g.items.length} pour${g.items.length>1?'s':''}</span></div>
          <div class="tap-rows">
            ${g.items.map(b => {
              const guest = b.brewery_name && b.brewery_name !== 'Unrefined Brewing'
                ? `<span class="guest">Guest · ${esc(b.brewery_name)}</span>` : '';
              const abv = b.show_abv !== false && b.abv ? `<span class="abv">${esc(b.abv)} ABV</span>` : '';
              const style = b.beer_type ? `<span class="style">${esc(b.beer_type)}</span>` : '';
              const serve = b.description ? `<span>${esc(b.description)}</span>` : '';
              return `<div class="tap-row">
                <div class="tap-main">
                  <div class="tap-title">${esc(b.title)}</div>
                  <div class="tap-meta">${abv}${style}${serve}${guest}</div>
                </div>
                ${b.price ? `<div class="tap-price">${esc(b.price)}</div>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>`).join('');
    } catch (e) {
      box.innerHTML = '<div class="tap-state">Couldn\'t load the tap list right now. Give it a refresh, or come see us — it\'s better in person anyway.</div>';
    }
  })();

  (async function loadEvents(){
    const box = document.getElementById('eventsContainer');
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const emptyState = `
      <div class="events-empty">
        <div class="big">No shows on the books… yet</div>
        <p>We're between events right now. New tap takeovers, releases, and live nights land here the moment they're set.</p>
        <a href="https://www.facebook.com/unrefinedbrewing" target="_blank" rel="noopener" class="btn btn-ghost">Follow for updates</a>
      </div>`;
    try {
      const res = await fetch(EVENTS_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const events = data.events || [];
      if (!events.length) { box.innerHTML = emptyState; return; }

      box.innerHTML = '<div class="events-list">' + events.map(ev => {
        const raw = ev.start_date || ev.event_date || ev.date || ev.startDate || '';
        const d = raw ? new Date(String(raw).replace(' ', 'T')) : null;
        const valid = d && !isNaN(d);
        const dateBlock = valid
          ? `<div class="event-date"><div class="d">${d.getDate()}</div><div class="m">${MONTHS[d.getMonth()]} ${d.getFullYear()}</div></div>`
          : `<div class="event-date"><div class="m">TBA</div></div>`;
        const name = ev.title || ev.name || ev.event_name || 'Event';
        const desc = ev.description || ev.summary || '';
        const time = ev.time || ev.start_time || ev.event_time || '';
        return `<div class="event-row">
          ${dateBlock}
          <div><div class="event-name">${esc(name)}</div>${desc ? `<div class="event-desc">${esc(desc)}</div>` : ''}</div>
          ${time ? `<div class="event-time">${esc(time)}</div>` : ''}
        </div>`;
      }).join('') + '</div>';
    } catch (e) {
      box.innerHTML = emptyState;
    }
  })();

  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 40 ? 'rgba(11,11,15,0.95)' : 'rgba(11,11,15,0.82)';
  }, { passive: true });