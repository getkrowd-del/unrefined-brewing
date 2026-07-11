const KROWD_KEY = 'krwd_8ae6db996eae452c113564c7fac871b7ba9552dfa3ac79459a6f32ec78c';
  const COMPANY_ID = 1125;
  const BEER_URL = `https://api.getkrowd.com/v3/beer/index.cfm?companyId=${COMPANY_ID}&apiKey=${encodeURIComponent(KROWD_KEY)}`;
  const EVENTS_URL = `https://api.getkrowd.com/v3/events/index.cfm?companyId=${COMPANY_ID}&apiKey=${encodeURIComponent(KROWD_KEY)}`;
  document.getElementById('year').textContent = new Date().getFullYear();
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => { hamburger.classList.toggle('open'); mobileMenu.classList.toggle('open'); });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { hamburger.classList.remove('open'); mobileMenu.classList.remove('open'); }));
  document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', e => { const t = document.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } }); });
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => { nav.style.background = window.scrollY > 60 ? 'rgba(7,23,34,0.98)' : 'rgba(7,23,34,0.92)'; }, { passive: true });
  const heroSlides = document.getElementById('heroSlides');
  const heroDots = document.getElementById('heroDots');
  const heroCount = heroSlides.children.length;
  let heroIdx = 0, heroTimer;
  for (let i = 0; i < heroCount; i++) { const d = document.createElement('button'); d.className = 'hero-dot' + (i===0?' active':''); d.addEventListener('click', () => { heroGo(i); heroReset(); }); heroDots.appendChild(d); }
  function heroGo(n){ heroIdx=(n+heroCount)%heroCount; heroSlides.style.transform=`translateX(-${heroIdx*100}%)`; document.querySelectorAll('.hero-dot').forEach((d,i)=>d.classList.toggle('active',i===heroIdx)); }
  function heroReset(){ clearInterval(heroTimer); heroTimer=setInterval(()=>heroGo(heroIdx+1),5000); }
  heroReset();
  let hTX=0;
  heroSlides.addEventListener('touchstart', e => hTX=e.touches[0].clientX, {passive:true});
  heroSlides.addEventListener('touchend', e => { const d=hTX-e.changedTouches[0].clientX; if(Math.abs(d)>50){ d>0?heroGo(heroIdx+1):heroGo(heroIdx-1); heroReset(); } });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  (async function loadBeers(){
    const box = document.getElementById('tapContainer');
    try {
      const res = await fetch(BEER_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const beers = (data.beers || []).filter(b => b && !b.is_archived && (b.status ? String(b.status).toLowerCase() === 'active' : true));
      if (!beers.length) { box.innerHTML = '<div class="tap-state">The tap list is being refreshed — check back soon.</div>'; return; }
      document.getElementById('statTaps').textContent = beers.length;
      document.getElementById('tapFoot').textContent = `${beers.length} beers on tap · updated live from the taproom`;
      const groups = []; const idx = {};
      beers.forEach(b => { const key = b.category_name || b.beer_type || 'On Tap'; if(!(key in idx)){ idx[key]=groups.length; groups.push({name:key, order:b.category_order!=null?b.category_order:99, items:[]}); } groups[idx[key]].items.push(b); });
      groups.sort((a,b)=>a.order-b.order);
      const dot = t => esc(t).replace(/&amp;middot;|&amp;#183;|&amp;#xb7;/gi,'·');
      box.innerHTML = groups.map(g => `
        <div class="tap-cat">
          <div class="tap-cat-name">${esc(g.name)} <span class="count">${g.items.length} pour${g.items.length>1?'s':''}</span></div>
          <div class="tap-grid">
            ${g.items.map(b => {
              const guest = b.brewery_name && b.brewery_name !== 'Unrefined Brewing' ? `<span class="guest">Guest · ${esc(b.brewery_name)}</span>` : '';
              const abv = b.show_abv !== false && b.abv ? `<span class="abv">${esc(b.abv)} ABV</span>` : '';
              const style = b.beer_type ? `<span>${esc(b.beer_type)}</span>` : '';
              const serve = b.description ? `<span>${dot(b.description)}</span>` : '';
              return `<div class="tap-item"><div><div class="tap-item-name">${esc(b.title)}</div><div class="tap-item-meta">${abv}${style}${serve}${guest}</div></div>${b.price?`<div class="tap-item-price">${dot(b.price)}</div>`:''}</div>`;
            }).join('')}
          </div>
        </div>`).join('');
    } catch(e) { box.innerHTML = '<div class="tap-state">Couldn\'t load the tap list right now — please refresh, or come see us. It\'s better in person anyway.</div>'; }
  })();
  (async function loadEvents(){
    const box = document.getElementById('eventsContainer');
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const empty = `<div class="events-empty"><h3>No events on the calendar yet</h3><p>We're between events right now. New tap takeovers, releases, and live nights show up here the moment they're scheduled.</p><a href="https://www.facebook.com/unrefinedbrewing" target="_blank" rel="noopener" class="btn-outline">Follow for Updates</a></div>`;
    try {
      const res = await fetch(EVENTS_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const events = data.events || [];
      if (!events.length) { box.innerHTML = empty; return; }
      box.innerHTML = '<div class="events-list">' + events.map(ev => {
        const raw = ev.start_date || ev.event_date || ev.date || ev.startDate || '';
        const d = raw ? new Date(String(raw).replace(' ','T')) : null;
        const valid = d && !isNaN(d);
        const dateBlock = valid ? `<div class="event-date"><div class="d">${d.getDate()}</div><div class="m">${MONTHS[d.getMonth()]}</div></div>` : `<div class="event-date"><div class="m">TBA</div></div>`;
        const name = ev.title || ev.name || ev.event_name || 'Event';
        const desc = ev.description || ev.summary || '';
        const time = ev.time || ev.start_time || ev.event_time || '';
        return `<div class="event-row">${dateBlock}<div><div class="event-name">${esc(name)}</div>${desc?`<div class="event-desc">${esc(desc)}</div>`:''}</div>${time?`<div class="event-time">${esc(time)}</div>`:''}</div>`;
      }).join('') + '</div>';
    } catch(e) { box.innerHTML = empty; }
  })();

(function(){
  var btn=document.getElementById('ub-btn'), panel=document.getElementById('ub-panel'),
      teaser=document.getElementById('ub-teaser'), x=document.getElementById('ub-teaser-x'),
      iframe=document.getElementById('ub-iframe'), closed=false;
  setTimeout(function(){ if(!closed && !panel.classList.contains('open')) teaser.classList.add('show'); }, 2000);
  x.addEventListener('click', function(e){ e.stopPropagation(); teaser.classList.remove('show'); closed=true; });
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    if(panel.classList.contains('open')){ panel.classList.remove('open'); }
    else {
      panel.classList.add('open'); teaser.classList.remove('show'); closed=true;
      if(!iframe.src) iframe.src='https://paymegpt.com/agents/46866772/embed';
    }
  });
  document.addEventListener('click', function(ev){
    if(panel.classList.contains('open') && !panel.contains(ev.target) && !btn.contains(ev.target)) panel.classList.remove('open');
  });
})();