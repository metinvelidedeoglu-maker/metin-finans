(()=>{
  const rangeStart=parse('2026-08-01');
  const rangeEnd=parse(APP.rangeEnd);
  const today=new Date();
  const initial=today<rangeStart?rangeStart:(today>rangeEnd?rangeEnd:today);
  let visibleMonth=new Date(initial.getFullYear(),initial.getMonth(),1);
  let selectedDate=iso(initial);
  let mode='standard';

  const colors={
    'Kredi Kartı':'#df5a43',
    'Ek Hesap':'#b74736',
    'Kredi':'#d46b58',
    'Çek':'#6d74cf',
    'Aylık Gider':'#3da56d',
    'Diğer':'#5b8def'
  };
  const colorFor=category=>colors[category]||colors.Diğer;
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
  const selectedRows=map=>map[selectedDate]||[];

  function renderDetail(map){
    const rows=selectedRows(map);
    calendarDayDetail.innerHTML=`
      <div class="calendar-detail-head">
        <div><h3>${fd.format(parse(selectedDate))}</h3><div class="meta">${rows.length} ödeme</div></div>
        <b>${tl.format(rows.reduce((s,x)=>s+Number(x.amount),0))}</b>
      </div>
      ${rows.length?rows.map(x=>`
        <div class="calendar-detail-row ${x.paid?'paid':''}">
          <div><div class="calendar-detail-name">${esc(x.name)}</div><div class="calendar-detail-meta"><span class="tag">${esc(x.category)}</span> · ${x.paid?'Ödendi':'Bekliyor'}</div></div>
          <div class="calendar-detail-amount">${tl.format(x.amount)}</div>
          <div class="calendar-detail-meta">${fd.format(parse(x.date))}</div>
          <div class="calendar-detail-actions">
            <button onclick="togglePaid('${x.id}')">${x.paid?'Geri al':'Ödendi'}</button>
            <button onclick="editPayment('${x.id}')">Düzenle</button>
          </div>
        </div>`).join(''):'<div class="empty">Bu tarihte ödeme yok.</div>'}`;
  }

  function standardHtml(map,start){
    const days=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
    let html=`<div class="calendar-weekdays">${days.map(x=>`<div class="calendar-weekday">${x}</div>`).join('')}</div><div class="calendar-grid">`;
    for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);
      const key=iso(d),rows=map[key]||[],sum=rows.reduce((s,x)=>s+Number(x.amount),0),other=d.getMonth()!==visibleMonth.getMonth();
      html+=`<button class="calendar-day ${other?'other':''} ${rows.length?'has':''} ${key===selectedDate?'selected':''}" data-calendar-date="${key}">
        <div class="calendar-day-top"><span class="calendar-day-number">${d.getDate()}</span>${rows.length?`<span class="calendar-day-total">${compact(sum)} TL</span>`:''}</div>
        ${rows.length?`<div class="calendar-dots">${rows.slice(0,7).map(x=>`<span class="calendar-dot" style="background:${colorFor(x.category)}"></span>`).join('')}</div><div class="calendar-day-names">${rows.slice(0,3).map(x=>`<span class="calendar-mini-name">${esc(x.name)}</span>`).join('')}</div>`:''}
      </button>`;
    }
    return html+'</div>';
  }

  function agendaHtml(map,start){
    const days=['P','S','Ç','P','C','C','P'];
    let html=`<div class="agenda-grid">${days.map(x=>`<div class="agenda-weekday">${x}</div>`).join('')}`;
    for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);
      const key=iso(d),rows=map[key]||[],sum=rows.reduce((s,x)=>s+Number(x.amount),0),other=d.getMonth()!==visibleMonth.getMonth();
      const chips=rows.slice(0,4).map(x=>`<span class="agenda-chip" style="background:${colorFor(x.category)}" title="${esc(x.name)} · ${tl.format(x.amount)}">${esc(x.name)} -${compact(x.amount)}</span>`).join('');
      html+=`<button class="agenda-day ${other?'other':''} ${rows.length?'has':''} ${key===selectedDate?'selected':''}" data-calendar-date="${key}">
        <div class="agenda-day-head"><span class="agenda-day-number">${d.getDate()}</span>${rows.length?`<span class="agenda-day-total">${compact(sum)} TL</span>`:''}</div>
        <div class="agenda-events">${chips}${rows.length>4?`<span class="agenda-more">+${rows.length-4} kayıt</span>`:''}</div>
      </button>`;
    }
    return html+'</div>';
  }

  function renderCalendar(){
    if(!calendarTitle)return;
    const map=byDate(),start=gridStartFor(visibleMonth),monthPrefix=iso(visibleMonth).slice(0,7);
    const monthRows=payments().filter(x=>x.date.startsWith(monthPrefix));
    const monthTotal=monthRows.reduce((s,x)=>s+Number(x.amount),0);
    calendarTitle.textContent=monthName(visibleMonth);
    calendarMonthTotal.textContent=`${monthRows.length} ödeme · ${tl.format(monthTotal)}`;
    calendarStandardBtn.classList.toggle('active',mode==='standard');
    calendarAgendaBtn.classList.toggle('active',mode==='agenda');
    calendarStandard.hidden=mode!=='standard';
    calendarAgenda.hidden=mode!=='agenda';
    if(mode==='standard')calendarStandard.innerHTML=standardHtml(map,start);
    else calendarAgenda.innerHTML=agendaHtml(map,start);
    document.querySelectorAll('[data-calendar-date]').forEach(button=>button.onclick=()=>{
      selectedDate=button.dataset.calendarDate;
      const d=parse(selectedDate);
      if(d.getMonth()!==visibleMonth.getMonth()||d.getFullYear()!==visibleMonth.getFullYear())visibleMonth=new Date(d.getFullYear(),d.getMonth(),1);
      renderCalendar();
    });
    renderDetail(map);
  }

  calendarPrev.onclick=()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1);selectedDate=iso(visibleMonth);renderCalendar()};
  calendarNext.onclick=()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1);selectedDate=iso(visibleMonth);renderCalendar()};
  calendarStandardBtn.onclick=()=>{mode='standard';renderCalendar()};
  calendarAgendaBtn.onclick=()=>{mode='agenda';renderCalendar()};
  calendarAddPayment.onclick=()=>addPayment.click();

  const originalSetView=setView;
  setView=function(id){originalSetView(id);if(id==='calendar')renderCalendar()};
  const originalRenderAll=renderAll;
  renderAll=function(){originalRenderAll();if(calendar.classList.contains('active'))renderCalendar()};
  window.renderFinanceCalendar=renderCalendar;
})();