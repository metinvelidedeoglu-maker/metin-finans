(()=>{
  const drilldown=document.getElementById('paymentDrilldown');
  const drilldownTitle=document.getElementById('paymentDrilldownTitle');
  const drilldownMeta=document.getElementById('paymentDrilldownMeta');
  const backButton=document.getElementById('paymentBack');
  const backLabel=document.getElementById('paymentBackLabel');
  const clearButton=document.getElementById('clearDrilldownFilters');
  const paymentNav=document.querySelector('nav [data-view="payments"]');
  const viewNames={dashboard:'Özete',calendar:'Takvime',payments:'Harcamalara'};
  let returnView='dashboard';

  const capitalize=value=>String(value||'').replace(/^./,c=>c.toLocaleUpperCase('tr'));
  const monthLabel=key=>key?capitalize(fm.format(parse(`${key}-01`))):'';
  const sum=rows=>rows.reduce((total,x)=>total+Number(x.amount),0);
  const isActionTarget=target=>!!target.closest('button,input,select,a,label');
  const hasOption=(select,value)=>[...select.options].some(option=>option.value===value);

  function clearFilters(){
    searchInput.value='';
    categoryFilter.value='';
    statusFilter.value='';
    monthFilter.value='';
  }

  function hideDrilldown(){drilldown.hidden=true}

  function updateDrilldownMeta(){
    if(drilldown.hidden)return;
    const rows=filtered();
    drilldownMeta.textContent=`${rows.length} harcama · ${tl.format(sum(rows))}`;
  }

  function showDrilldown(title,source){
    returnView=source&&source!=='payments'?source:'dashboard';
    backLabel.textContent=`${viewNames[returnView]||'Özete'} dön`;
    drilldownTitle.textContent=title||'Harcamalar';
    drilldown.hidden=false;
    updateDrilldownMeta();
  }

  function refreshPaymentView(){
    renderPayments();
    renderPaymentSummary();
    updateDrilldownMeta();
  }

  window.openPaymentList=({category='',month:monthValue='',title='',source='dashboard'}={})=>{
    fillFilters();
    clearFilters();
    if(category&&hasOption(categoryFilter,category))categoryFilter.value=category;
    if(monthValue&&hasOption(monthFilter,monthValue))monthFilter.value=monthValue;
    const fallback=[category,monthLabel(monthValue)].filter(Boolean).join(' · ')||'Tüm harcamalar';
    showDrilldown(title||fallback,source);
    setView('payments');
    refreshPaymentView();
    requestAnimationFrame(()=>document.getElementById('payments')?.scrollIntoView({block:'start'}));
  };

  function makeClickable(element,handler,label){
    if(!element)return;
    element.classList.add('clickable-surface');
    element.tabIndex=0;
    element.setAttribute('role','button');
    if(label)element.setAttribute('aria-label',label);
    element.onclick=event=>{if(!isActionTarget(event.target))handler()};
    element.onkeydown=event=>{
      if((event.key==='Enter'||event.key===' ')&&!isActionTarget(event.target)){
        event.preventDefault();
        handler();
      }
    };
  }

  function decorateDashboard(){
    document.querySelectorAll('#dashboardCategoryTotals .dashboard-category-card').forEach(card=>{
      const category=card.dataset.category||'';
      makeClickable(card,()=>openPaymentList({category,title:`${category} harcamaları`,source:'dashboard'}),`${category} harcamalarını aç`);
      card.title=`${category} harcamalarını aç`;
    });

    const totals={};
    payments().forEach(x=>totals[month(x.date)]=(totals[month(x.date)]||0)+Number(x.amount));
    const keys=Object.keys(totals).sort().slice(0,12);
    document.querySelectorAll('#monthlyBars .bar-row').forEach((row,index)=>{
      const key=keys[index];
      if(!key)return;
      const label=monthLabel(key);
      row.dataset.month=key;
      makeClickable(row,()=>openPaymentList({month:key,title:`${label} harcamaları`,source:'dashboard'}),`${label} harcamalarını aç`);
      row.title=`${label} harcamalarını aç`;
    });

    const visible=payments().slice(0,8);
    document.querySelectorAll('#upcomingList .category-row').forEach((row,index)=>{
      const payment=visible[index];
      if(!payment)return;
      row.dataset.paymentId=payment.id;
      row.classList.add('dashboard-upcoming-row');
      if(!row.querySelector('.inline-record-actions')){
        const actions=document.createElement('div');
        actions.className='inline-record-actions';
        const edit=document.createElement('button');
        edit.type='button';
        edit.textContent='Düzenle';
        edit.onclick=event=>{event.stopPropagation();editPayment(payment.id)};
        const remove=document.createElement('button');
        remove.type='button';
        remove.className='danger-action';
        remove.textContent='Sil';
        remove.onclick=event=>{event.stopPropagation();deletePayment(payment.id)};
        actions.append(edit,remove);
        row.append(actions);
      }
      makeClickable(row,()=>editPayment(payment.id),`${payment.name} harcamasını düzenle`);
    });
  }

  function decoratePaymentRows(){
    document.querySelectorAll('#paymentList .payment-row[data-payment-id]').forEach(row=>{
      const id=row.dataset.paymentId;
      const payment=payments().find(x=>x.id===id);
      makeClickable(row,()=>editPayment(id),`${payment?.name||'Harcama'} kaydını düzenle`);
    });
  }

  function decoratePaymentSummary(){
    const categories=Object.keys(payments().reduce((result,x)=>{
      result[x.category]=(result[x.category]||0)+Number(x.amount);
      return result;
    },{})).sort((a,b)=>a.localeCompare(b,'tr'));
    document.querySelectorAll('#paymentCategoryTotals .payment-category-item').forEach((card,index)=>{
      const category=categories[index];
      if(!category)return;
      card.dataset.category=category;
      makeClickable(card,()=>{
        categoryFilter.value=category;
        const currentMonth=monthFilter.value;
        showDrilldown([category,monthLabel(currentMonth)].filter(Boolean).join(' · '),returnView);
        refreshPaymentView();
      },`${category} kategorisini filtrele`);
    });
    const allTotalCard=document.getElementById('allPaymentTotal')?.closest('.payment-total-card');
    makeClickable(allTotalCard,()=>{
      clearFilters();
      hideDrilldown();
      refreshPaymentView();
    },'Tüm filtreleri temizle');
    if(allTotalCard)allTotalCard.title='Tüm filtreleri temizle';
  }

  const baseRenderDashboard=renderDashboard;
  const baseRenderPayments=renderPayments;
  const baseRenderPaymentSummary=renderPaymentSummary;
  const baseRenderAll=renderAll;

  renderDashboard=function(){baseRenderDashboard();decorateDashboard()};
  renderPayments=function(){baseRenderPayments();decoratePaymentRows();updateDrilldownMeta()};
  renderPaymentSummary=function(a=filtered()){baseRenderPaymentSummary(a);decoratePaymentSummary();updateDrilldownMeta()};
  renderAll=function(){baseRenderAll();decorateDashboard();decoratePaymentRows();decoratePaymentSummary();updateDrilldownMeta()};

  if(paymentNav)paymentNav.onclick=()=>{
    clearFilters();
    hideDrilldown();
    setView('payments');
    refreshPaymentView();
  };
  backButton.onclick=()=>{hideDrilldown();setView(returnView)};
  clearButton.onclick=()=>{clearFilters();hideDrilldown();refreshPaymentView()};
  [searchInput,categoryFilter,monthFilter].forEach(control=>control.addEventListener('input',updateDrilldownMeta));

  const calendarRoot=document.getElementById('calendar');
  const calendarStandardEl=document.getElementById('calendarStandard');
  const calendarDayDetailEl=document.getElementById('calendarDayDetail');
  let desktopDragId='';
  let dragTarget=null;
  let touchDrag=null;
  let undoTimer=null;
  let suppressCalendarClickUntil=0;

  const cloneState=()=>JSON.parse(JSON.stringify(state));
  const paymentIdForSource=source=>source?.dataset.calendarEditPayment||source?.dataset.calendarDetailPayment||'';

  function clearDragTarget(){
    if(dragTarget)dragTarget.classList.remove('calendar-drag-target');
    dragTarget=null;
  }

  function setDragTarget(day){
    if(day===dragTarget)return;
    clearDragTarget();
    if(day){
      dragTarget=day;
      day.classList.add('calendar-drag-target');
    }
  }

  function updatePaymentDate(id,date){
    const i=state.custom.findIndex(x=>x.id===id);
    if(i>=0)state.custom[i]={...state.custom[i],date};
    else state.overrides[id]={...(state.overrides[id]||{}),date};
  }

  function seriesDescriptor(payment){
    if(!payment)return null;
    const all=payments();
    if(payment.seriesId){
      const members=all.filter(x=>x.seriesId===payment.seriesId).sort((a,b)=>a.date.localeCompare(b.date));
      if(members.length<2)return null;
      return {
        members,
        ordinal:x=>Number(x.seriesIndex)||members.findIndex(m=>m.id===x.id)+1
      };
    }
    for(const r of (APP.recur||[])){
      const baseId=r[0];
      if(!payment.id.startsWith(`${baseId}-`))continue;
      const raw=recurring(r);
      const rawOrder=new Map(raw.map((x,i)=>[x.id,i+1]));
      const members=all.filter(x=>x.id.startsWith(`${baseId}-`)).sort((a,b)=>a.date.localeCompare(b.date));
      if(members.length<2)return null;
      return {
        members,
        ordinal:x=>rawOrder.get(x.id)||members.findIndex(m=>m.id===x.id)+1
      };
    }
    return null;
  }

  function moveWholeSeries(id,targetDate){
    const selected=payments().find(x=>x.id===id);
    const descriptor=seriesDescriptor(selected);
    if(!selected||!descriptor)return false;
    const selectedOrdinal=descriptor.ordinal(selected);
    const selectedNewDate=parse(targetDate);
    const base=plusMonth(selectedNewDate,-(selectedOrdinal-1),selectedNewDate.getDate());
    descriptor.members.forEach(member=>{
      const ordinal=descriptor.ordinal(member);
      const d=plusMonth(base,ordinal-1,base.getDate());
      updatePaymentDate(member.id,iso(d));
    });
    return true;
  }

  function showUndo(snapshot,message){
    document.querySelector('.calendar-drag-toast')?.remove();
    clearTimeout(undoTimer);
    const toast=document.createElement('div');
    toast.className='calendar-drag-toast';
    toast.setAttribute('role','status');
    const text=document.createElement('span');
    text.textContent=message;
    const undo=document.createElement('button');
    undo.type='button';
    undo.textContent='Geri al';
    undo.onclick=()=>{
      state=snapshot;
      save();
      fillFilters();
      renderAll();
      toast.remove();
      clearTimeout(undoTimer);
    };
    toast.append(text,undo);
    document.body.append(toast);
    undoTimer=setTimeout(()=>toast.remove(),6000);
  }

  function commitCalendarMove(id,targetDate,wholeSeries=false){
    const payment=payments().find(x=>x.id===id);
    if(!payment||!targetDate||payment.date===targetDate)return;
    const snapshot=cloneState();
    const movedSeries=wholeSeries&&moveWholeSeries(id,targetDate);
    if(!movedSeries)updatePaymentDate(id,targetDate);
    save();
    fillFilters();
    renderAll();
    const suffix=movedSeries?' · tüm seri':'';
    showUndo(snapshot,`${payment.name}: ${fd.format(parse(targetDate))}${suffix}`);
  }

  function closeSeriesChoice(){document.querySelector('.calendar-drag-choice-backdrop')?.remove()}

  function requestCalendarMove(id,targetDate){
    const payment=payments().find(x=>x.id===id);
    if(!payment||!targetDate||payment.date===targetDate)return;
    const info=window.getPaymentSeriesInfo?.(id);
    if(!info){
      commitCalendarMove(id,targetDate,false);
      return;
    }
    closeSeriesChoice();
    const backdrop=document.createElement('div');
    backdrop.className='calendar-drag-choice-backdrop';
    backdrop.innerHTML=`<div class="calendar-drag-choice" role="dialog" aria-modal="true" aria-label="Tekrarlanan harcama tarihini değiştir">
      <strong>${esc(payment.name)}</strong>
      <span>${fd.format(parse(targetDate))} tarihine taşınacak.</span>
      <small>Bu harcama aylık tekrar serisinin parçası.</small>
      <div class="calendar-drag-choice-actions">
        <button type="button" data-drag-choice="one">Sadece bu ödeme</button>
        <button type="button" class="primary" data-drag-choice="series">Tüm seri</button>
        <button type="button" data-drag-choice="cancel">Vazgeç</button>
      </div>
    </div>`;
    backdrop.onclick=event=>{
      if(event.target===backdrop)closeSeriesChoice();
      const choice=event.target.closest('[data-drag-choice]')?.dataset.dragChoice;
      if(!choice)return;
      closeSeriesChoice();
      if(choice==='one')commitCalendarMove(id,targetDate,false);
      if(choice==='series')commitCalendarMove(id,targetDate,true);
    };
    document.body.append(backdrop);
  }

  function decorateCalendarDragSources(){
    if(!calendarRoot)return;
    calendarRoot.querySelectorAll('[data-calendar-edit-payment],[data-calendar-detail-payment]').forEach(source=>{
      if(source.dataset.calendarDragReady==='1')return;
      source.dataset.calendarDragReady='1';
      source.classList.add('payment-drag-source');
      source.draggable=true;
      source.title=source.title?`${source.title} · sürükleyerek tarihini değiştir`:'Sürükleyerek tarihini değiştir';
      if(source.matches('[data-calendar-detail-payment]')){
        source.addEventListener('mousedown',event=>source._calendarDragBlocked=!!event.target.closest('button'));
      }
      source.addEventListener('dragstart',event=>{
        if(source._calendarDragBlocked){
          source._calendarDragBlocked=false;
          event.preventDefault();
          return;
        }
        const id=paymentIdForSource(source);
        if(!id){event.preventDefault();return}
        desktopDragId=id;
        source.classList.add('payment-dragging');
        event.dataTransfer.effectAllowed='move';
        event.dataTransfer.setData('text/plain',id);
      });
      source.addEventListener('dragend',()=>{
        source.classList.remove('payment-dragging');
        desktopDragId='';
        clearDragTarget();
        suppressCalendarClickUntil=Date.now()+350;
      });
      source.addEventListener('touchstart',event=>{
        if(event.touches.length!==1)return;
        if(source.matches('[data-calendar-detail-payment]')&&event.target.closest('button'))return;
        const touch=event.changedTouches[0];
        const id=paymentIdForSource(source);
        if(!id)return;
        if(touchDrag?.timer)clearTimeout(touchDrag.timer);
        touchDrag={
          id,
          source,
          identifier:touch.identifier,
          startX:touch.clientX,
          startY:touch.clientY,
          active:false,
          timer:setTimeout(()=>{
            if(!touchDrag||touchDrag.id!==id)return;
            touchDrag.active=true;
            source.classList.add('payment-dragging');
            navigator.vibrate?.(18);
          },360)
        };
      },{passive:true});
    });
  }

  function touchById(list,id){return [...list].find(touch=>touch.identifier===id)}

  function cancelTouchDrag(){
    if(!touchDrag)return;
    clearTimeout(touchDrag.timer);
    touchDrag.source?.classList.remove('payment-dragging');
    touchDrag=null;
    clearDragTarget();
  }

  if(calendarStandardEl){
    calendarStandardEl.addEventListener('dragover',event=>{
      if(!desktopDragId)return;
      const day=event.target.closest('[data-calendar-date]');
      if(!day)return;
      event.preventDefault();
      event.dataTransfer.dropEffect='move';
      setDragTarget(day);
    });
    calendarStandardEl.addEventListener('dragleave',event=>{
      if(dragTarget&&!dragTarget.contains(event.relatedTarget))clearDragTarget();
    });
    calendarStandardEl.addEventListener('drop',event=>{
      const day=event.target.closest('[data-calendar-date]');
      if(!day)return;
      event.preventDefault();
      const id=event.dataTransfer.getData('text/plain')||desktopDragId;
      const targetDate=day.dataset.calendarDate;
      suppressCalendarClickUntil=Date.now()+500;
      clearDragTarget();
      desktopDragId='';
      requestCalendarMove(id,targetDate);
    });
  }

  document.addEventListener('touchmove',event=>{
    if(!touchDrag)return;
    const touch=touchById(event.touches,touchDrag.identifier);
    if(!touch)return;
    if(!touchDrag.active){
      if(Math.hypot(touch.clientX-touchDrag.startX,touch.clientY-touchDrag.startY)>10)cancelTouchDrag();
      return;
    }
    event.preventDefault();
    const day=document.elementFromPoint(touch.clientX,touch.clientY)?.closest?.('[data-calendar-date]');
    setDragTarget(day&&calendarStandardEl?.contains(day)?day:null);
  },{passive:false});

  document.addEventListener('touchend',event=>{
    if(!touchDrag)return;
    const touch=touchById(event.changedTouches,touchDrag.identifier);
    if(!touch)return;
    const wasActive=touchDrag.active;
    const id=touchDrag.id;
    const source=touchDrag.source;
    const targetDate=dragTarget?.dataset.calendarDate||'';
    clearTimeout(touchDrag.timer);
    source?.classList.remove('payment-dragging');
    touchDrag=null;
    clearDragTarget();
    if(!wasActive)return;
    event.preventDefault();
    suppressCalendarClickUntil=Date.now()+600;
    if(targetDate)requestCalendarMove(id,targetDate);
  },{passive:false});

  document.addEventListener('touchcancel',cancelTouchDrag,{passive:true});

  calendarRoot?.addEventListener('click',event=>{
    if(Date.now()<suppressCalendarClickUntil){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);

  if(calendarStandardEl||calendarDayDetailEl){
    const observer=new MutationObserver(decorateCalendarDragSources);
    if(calendarStandardEl)observer.observe(calendarStandardEl,{childList:true,subtree:true});
    if(calendarDayDetailEl)observer.observe(calendarDayDetailEl,{childList:true,subtree:true});
  }
  decorateCalendarDragSources();

  renderAll();
})();