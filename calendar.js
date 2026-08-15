(()=>{
  const rangeStart=parse('2026-08-01');
  const rangeEnd=parse(APP.rangeEnd);
  const today=new Date();
  const initial=today<rangeStart?rangeStart:(today>rangeEnd?rangeEnd:today);
  let visibleMonth=new Date(initial.getFullYear(),initial.getMonth(),1);
  let selectedDate=iso(initial);

  const colors={
    'Kredi Kartı':'#df5a43',
    'Ek Hesap':'#b74736',
    'Kredi':'#d46b58',
    'Çek':'#6d74cf',
    'Aylık Gider':'#3aa36b',
    'Diğer':'#5b8def'
  };
  const summaryLabels={
    'Kredi Kartı':'Kredi Kartları',
    'Ek Hesap':'Ek Hesaplar',
    'Kredi':'Krediler',
    'Çek':'Çekler',
    'Aylık Gider':'Aylık Giderler'
  };
  const defaultCategories=()=>[...new Set([...(APP.once||[]).map(x=>x[2]),...(APP.recur||[]).map(x=>x[2])])];
  const summaryCategories=()=>window.getAllPaymentCategories?.()||defaultCategories();
  const colorFor=category=>colors[category]||'#596b7a';
  const compact=value=>{
    const n=Number(value)||0;
    if(n>=1000000)return `${(n/1000000).toFixed(n>=10000000?0:1).replace('.',',')} Mn`;
    if(n>=1000)return `${(n/1000).toFixed(n>=100000?0:1).replace('.',',')} B`;
    return String(Math.round(n));
  };
  const monthName=d=>fm.format(d).replace(/^./,c=>c.toLocaleUpperCase('tr'));
  const byDate=()=>{
    const map={};
    payments().forEach(x=>(map[x.date]||(map[x.date]=[])).push(x));
    Object.values(map).forEach(a=>a.sort((x,y)=>Number(y.amount)-Number(x.amount)||x.name.localeCompare(y.name,'tr')));
    return map;
  };
  const gridStartFor=monthDate=>{
    const first=new Date(monthDate.getFullYear(),monthDate.getMonth(),1);
    const mondayOffset=(first.getDay()+6)%7;
    const start=new Date(first);
    start.setDate(first.getDate()-mondayOffset);
    return start;
  };

  function renderSummary(monthRows,monthTotal,monthKey){
    const totals={},counts={};
    monthRows.forEach(x=>{
      totals[x.category]=(totals[x.category]||0)+Number(x.amount);
      counts[x.category]=(counts[x.category]||0)+1;
    });
    calendarSummary.innerHTML=summaryCategories().map(key=>`
      <button type="button" class="calendar-summary-card clickable-surface" style="--summary-color:${colorFor(key)}" data-calendar-summary-category="${esc(key)}" data-calendar-summary-month="${monthKey}">
        <span>${esc(summaryLabels[key]||key)}</span>
        <b>${tl.format(totals[key]||0)}</b>
        <small>${counts[key]||0} harcama</small>
      </button>`).join('')+`
      <button type="button" class="calendar-summary-card total-card clickable-surface" data-calendar-summary-month="${monthKey}">
        <span>Ay Toplamı</span>
        <b>${tl.format(monthTotal)}</b>
        <small>${monthRows.length} harcama</small>
      </button>`;
    calendarSummary.querySelectorAll('[data-calendar-summary-category]').forEach(button=>button.onclick=()=>{
      const category=button.dataset.calendarSummaryCategory;
      window.openPaymentList?.({category,month:monthKey,title:`${summaryLabels[category]||category} · ${monthName(visibleMonth)}`,source:'calendar'});
    });
    calendarSummary.querySelector('.total-card')?.addEventListener('click',()=>{
      window.openPaymentList?.({month:monthKey,title:`${monthName(visibleMonth)} harcamaları`,source:'calendar'});
    });
  }

  function renderDetail(map){
    const rows=map[selectedDate]||[];
    calendarDayDetail.innerHTML=`
      <div class="calendar-detail-head">
        <div><h3>${fd.format(parse(selectedDate))}</h3><div class="meta">${rows.length} harcama</div></div>
        <b>${tl.format(rows.reduce((s,x)=>s+Number(x.amount),0))}</b>
      </div>
      ${rows.length?rows.map(x=>{
        const info=window.getPaymentSeriesInfo?.(x.id);
        const seriesNote=info?`<div class="series-note">${esc(info.label)}</div>`:'';
        const seriesActions=info?`<button onclick="editPaymentSeries('${x.id}')">Seriyi düzenle</button><button onclick="deletePaymentSeries('${x.id}')">Seriyi sil</button>`:`<button onclick="repeatPayment('${x.id}')">Tekrarla</button>`;
        return `
        <div class="calendar-detail-row clickable-surface" data-category="${esc(x.category)}" data-calendar-detail-payment="${esc(x.id)}" role="button" tabindex="0" aria-label="${esc(x.name)} harcamasını düzenle">
          <div><div class="calendar-detail-name">${esc(x.name)}</div>${seriesNote}<div class="calendar-detail-meta"><span class="tag category-tag" data-category="${esc(x.category)}">${esc(x.category)}</span></div></div>
          <div class="calendar-detail-amount">${tl.format(x.amount)}</div>
          <div class="calendar-detail-meta">${fd.format(parse(x.date))}</div>
          <div class="calendar-detail-actions">
            <button onclick="editPayment('${x.id}')">Düzenle</button>
            ${seriesActions}
            <button class="danger-action" onclick="deletePayment('${x.id}')">Sil</button>
          </div>
        </div>`;
      }).join(''):'<div class="empty">Bu tarihte harcama yok.</div>'}`;
    calendarDayDetail.querySelectorAll('[data-calendar-detail-payment]').forEach(row=>{
      const open=()=>editPayment(row.dataset.calendarDetailPayment);
      row.onclick=event=>{if(!event.target.closest('button'))open()};
      row.onkeydown=event=>{if((event.key==='Enter'||event.key===' ')&&!event.target.closest('button')){event.preventDefault();open()}};
    });
  }

  function calendarHtml(map,start){
    const days=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
    let html=`<div class="calendar-weekdays">${days.map(x=>`<div class="calendar-weekday">${x}</div>`).join('')}</div><div class="calendar-grid">`;
    for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);
      const key=iso(d),rows=map[key]||[],sum=rows.reduce((s,x)=>s+Number(x.amount),0),other=d.getMonth()!==visibleMonth.getMonth();
      html+=`<div class="calendar-day ${other?'other':''} ${rows.length?'has':''} ${key===selectedDate?'selected':''}" data-calendar-date="${key}" role="button" tabindex="0" aria-label="${fd.format(d)} tarihini aç">
        <div class="calendar-day-top"><span class="calendar-day-number">${d.getDate()}</span>${rows.length?`<span class="calendar-day-total">${compact(sum)} TL</span>`:''}</div>
        ${rows.length?`<div class="calendar-dots">${rows.slice(0,7).map(x=>`<span class="calendar-dot" style="background:${colorFor(x.category)}"></span>`).join('')}</div><div class="calendar-day-names">${rows.slice(0,3).map(x=>`<div class="calendar-mini-entry"><button type="button" class="calendar-mini-row" data-calendar-edit-payment="${esc(x.id)}" title="Düzenle"><span class="calendar-mini-name">${esc(x.name)}</span><span class="calendar-mini-amount">${tl.format(x.amount)}</span></button><button type="button" class="calendar-mini-delete" data-calendar-delete-payment="${esc(x.id)}" aria-label="${esc(x.name)} harcamasını sil" title="Sil">×</button></div>`).join('')}</div>`:''}
      </div>`;
    }
    return html+'</div>';
  }

  function renderCalendar(){
    if(!calendarTitle)return;
    const map=byDate(),start=gridStartFor(visibleMonth),monthPrefix=iso(visibleMonth).slice(0,7);
    const monthRows=payments().filter(x=>x.date.startsWith(monthPrefix));
    const monthTotal=monthRows.reduce((s,x)=>s+Number(x.amount),0);
    calendarTitle.textContent=monthName(visibleMonth);
    calendarMonthTotal.textContent=`${monthRows.length} harcama · ${tl.format(monthTotal)}`;
    renderSummary(monthRows,monthTotal,monthPrefix);
    calendarStandard.innerHTML=calendarHtml(map,start);
    document.querySelectorAll('[data-calendar-date]').forEach(day=>{
      const select=()=>{
      selectedDate=day.dataset.calendarDate;
      const d=parse(selectedDate);
      if(d.getMonth()!==visibleMonth.getMonth()||d.getFullYear()!==visibleMonth.getFullYear())visibleMonth=new Date(d.getFullYear(),d.getMonth(),1);
      renderCalendar();
      };
      day.onclick=event=>{if(!event.target.closest('[data-calendar-edit-payment],[data-calendar-delete-payment]'))select()};
      day.onkeydown=event=>{if((event.key==='Enter'||event.key===' ')&&!event.target.closest('[data-calendar-edit-payment],[data-calendar-delete-payment]')){event.preventDefault();select()}};
    });
    calendarStandard.querySelectorAll('[data-calendar-edit-payment]').forEach(button=>button.onclick=event=>{
      event.stopPropagation();
      editPayment(button.dataset.calendarEditPayment);
    });
    calendarStandard.querySelectorAll('[data-calendar-delete-payment]').forEach(button=>button.onclick=event=>{
      event.stopPropagation();
      deletePayment(button.dataset.calendarDeletePayment);
    });
    renderDetail(map);
  }

  calendarPrev.onclick=()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1);selectedDate=iso(visibleMonth);renderCalendar()};
  calendarNext.onclick=()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1);selectedDate=iso(visibleMonth);renderCalendar()};
  calendarAddPayment.onclick=()=>addPayment.click();

  const originalSetView=setView;
  setView=function(id){originalSetView(id);if(id==='calendar')renderCalendar()};
  const originalRenderAll=renderAll;
  renderAll=function(){originalRenderAll();if(calendar.classList.contains('active'))renderCalendar()};
  window.renderFinanceCalendar=renderCalendar;
})();
