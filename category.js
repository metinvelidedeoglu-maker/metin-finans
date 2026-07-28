(()=>{
  const categoryTag=category=>`<span class="tag category-tag" data-category="${esc(category)}">${esc(category)}</span>`;

  renderDashboard=function(){
    const a=payments(),sum=a.reduce((s,x)=>s+Number(x.amount),0),paid=a.filter(x=>x.paid).reduce((s,x)=>s+Number(x.amount),0),monthly={};
    a.forEach(x=>monthly[month(x.date)]=(monthly[month(x.date)]||0)+Number(x.amount));
    kpiTotal.textContent=tl.format(sum);
    kpiPaid.textContent=tl.format(paid);
    kpiRemaining.textContent=tl.format(sum-paid);
    kpiAugust.textContent=tl.format(monthly['2026-08']||0);
    const keys=Object.keys(monthly).sort().slice(0,12),max=Math.max(1,...keys.map(k=>monthly[k]));
    monthlyBars.innerHTML=keys.map(k=>`<div class="bar-row"><span>${esc(fms.format(parse(k+'-01')))}</span><div class="bar-track"><div class="bar-fill" style="width:${monthly[k]/max*100}%"></div></div><span class="bar-value">${tl.format(monthly[k])}</span></div>`).join('');
    const up=a.filter(x=>!x.paid).slice(0,8);
    upcomingList.innerHTML=up.length?up.map(x=>`<div class="upcoming-row category-row" data-category="${esc(x.category)}"><div><div class="payment-name">${esc(x.name)}</div><div class="meta">${fd.format(parse(x.date))} · ${categoryTag(x.category)}</div></div><div class="amount">${tl.format(x.amount)}</div></div>`).join(''):'<div class="empty">Bekleyen ödeme yok.</div>';
  };

  renderDebts=function(){
    const groups={};
    APP.debts.forEach(([,c,n])=>groups[c]=(groups[c]||0)+n);
    const total=Object.values(groups).reduce((a,b)=>a+b,0);
    debtGrid.innerHTML=[...Object.entries(groups),['Toplam',total]].map(([k,v])=>`<article class="debt-card"><h3>${esc(k)}</h3><b>${tl.format(v)}</b></article>`).join('')+`<article class="panel" style="grid-column:1/-1"><h2>Borç kalemleri</h2>${APP.debts.map(([n,c,v])=>`<div class="upcoming-row category-row" data-category="${esc(c)}"><div><div class="payment-name">${esc(n)}</div><div class="meta">${categoryTag(c)}</div></div><div class="amount">${tl.format(v)}</div></div>`).join('')}</article>`;
  };

  renderDashboard();
  renderDebts();
})();