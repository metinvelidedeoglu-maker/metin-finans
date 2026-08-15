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

  renderAll();
})();
