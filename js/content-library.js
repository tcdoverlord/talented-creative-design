(() => {
  const DATA_URL = 'data/content-library.json';
  const categoryLabels = {cam:'Cam Creator',streaming:'Streaming & OBS',hardware:'Tech Hardware',software:'Tech Software',security:'Privacy & Security',buying:'Buying Guides',troubleshooting:'Troubleshooting',ai:'AI & Automation',windows:'Windows & PC',homelab:'Raspberry Pi & Home Lab',editorial:'Editorial'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const card = item => `<a class="content-card" href="${esc(item.href)}"><span class="content-label">${esc(item.label || categoryLabels[item.category] || 'Guide')}</span><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p><span class="card-arrow">Open guide →</span></a>`;
  async function start(){
    let data;
    try { const response = await fetch(DATA_URL, {cache:'no-store'}); if(!response.ok) throw new Error('Could not load content library'); data = await response.json(); }
    catch { document.querySelectorAll('[data-content-target],#guide-library').forEach(el => el.innerHTML='<div class="content-note">The content library could not be loaded. Run the site through its local web server and check public/data/content-library.json.</div>'); return; }
    const guides = Array.isArray(data.guides) ? data.guides : [];
    document.querySelectorAll('[data-content-target="featured"]').forEach(el => { const items=guides.filter(x=>x.featured).slice(0,3); el.innerHTML=items.length?items.map(card).join(''):'<p class="content-note">No featured guides yet. Add them in Content Studio.</p>'; });
    document.querySelectorAll('[data-content-target="creator-featured"]').forEach(el => { const items=guides.filter(x=>x.category==='cam'||x.category==='streaming').slice(0,3); el.innerHTML=items.length?items.map(card).join(''):'<p class="content-note">No creator guides yet.</p>'; });
    const grid=document.getElementById('guide-library'); if(!grid)return;
    const search=document.getElementById('guide-search'), filter=document.getElementById('guide-category'), count=document.getElementById('guide-results-count'), empty=document.getElementById('guide-empty');
    function render(){ const q=(search?.value||'').trim().toLowerCase(), cat=filter?.value||'all'; const items=guides.filter(x=>(cat==='all'||x.category===cat)&&[x.title,x.summary,x.label,x.category].join(' ').toLowerCase().includes(q)); grid.innerHTML=items.map(card).join(''); count.textContent=`${items.length} ${items.length===1?'guide':'guides'} shown`; empty.hidden=items.length!==0; }
    search?.addEventListener('input',render); filter?.addEventListener('change',render); render();
  }
  document.addEventListener('DOMContentLoaded',start);
})();
