(()=>{
  const repeatToggle=document.getElementById('formRepeat');
  const repeatFields=document.getElementById('repeatFields');
  const repeatCountInput=document.getElementById('formRepeatCount');

  function normalizeState(){
    state.paid=state.paid||{};
    state.deleted=state.deleted||{};
    state.overrides=state.overrides||{};
    state.custom=state.custom||[];
  }

  function setRepeat(enabled,count=2){
    repeatToggle.checked=!!enabled;
    repeatFields.hidden=!enabled;
    repeatCountInput.disabled=!enabled;
    repeatCountInput.value=String(Math.min(120,Math.max(2,Number(count)||2)));
  }

  function fillModal(x,title,repeat=false){
    normalizeState();
    editId.value=x?.id||'';
    formName.value=x?.name||'';
    formCategory.value=x?.category||'Diğer';
    formDate.value=x?.date||iso(new Date());
    formAmount.value=x?.amount||'';
    modalTitle.textContent=title;
    setRepeat(repeat,2);
    openModal();
  }

  function seriesId(){
    return `series-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  }

  function occurrence(v,startDate,index){
    const start=parse(startDate);
    const date=plusMonth(start,index,start.getDate());
    return {...v,date:iso(date)};
  }

  function updateExisting(id,v,meta={}){
    normalizeState();
    const i=state.custom.findIndex(x=>x.id===id);
    if(i>=0) state.custom[i]={...state.custom[i],...v,...meta};
    else state.overrides[id]={...(state.overrides[id]||{}),...v,...meta};
  }

  function addSeries(v,count,existingId=''){
    normalizeState();
    const sid=seriesId();
    if(existingId){
      updateExisting(existingId,v,{seriesId:sid,seriesIndex:1,seriesCount:count,repeatUnit:'monthly'});
      for(let i=1;i<count;i++){
        state.custom.push({
          id:`${sid}-${i+1}`,
          ...occurrence(v,v.date,i),
          seriesId:sid,
          seriesIndex:i+1,
          seriesCount:count,
          repeatUnit:'monthly'
        });
      }
      return;
    }
    for(let i=0;i<count;i++){
      state.custom.push({
        id:`${sid}-${i+1}`,
        ...occurrence(v,v.date,i),
        seriesId:sid,
        seriesIndex:i+1,
        seriesCount:count,
        repeatUnit:'monthly'
      });
    }
  }

  addPayment.onclick=()=>{
    paymentForm.reset();
    editId.value='';
    formCategory.value='Diğer';
    formDate.value=iso(new Date());
    modalTitle.textContent='Yeni ödeme';
    setRepeat(false,2);
    openModal();
  };

  window.editPayment=id=>{
    const x=payments().find(p=>p.id===id);
    if(x) fillModal(x,'Ödemeyi düzenle',false);
  };

  window.repeatPayment=id=>{
    const x=payments().find(p=>p.id===id);
    if(x) fillModal(x,'Ödemeyi tekrarla',true);
  };

  repeatToggle.onchange=()=>setRepeat(repeatToggle.checked,repeatCountInput.value);

  paymentForm.onsubmit=e=>{
    e.preventDefault();
    normalizeState();
    const id=editId.value;
    const v={
      name:formName.value.trim(),
      category:formCategory.value,
      date:formDate.value,
      amount:Number(formAmount.value)
    };
    if(!v.name||!v.date||!(v.amount>0))return;

    const repeated=repeatToggle.checked;
    const count=repeated?Math.min(120,Math.max(2,parseInt(repeatCountInput.value,10)||2)):1;

    if(repeated){
      addSeries(v,count,id);
    }else if(id){
      updateExisting(id,v);
    }else{
      state.custom.push({id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,...v});
    }

    save();
    close();
    fillFilters();
    renderAll();
    setView('payments');
  };

  renderPayments=function(){
    const a=filtered();
    paymentList.innerHTML=a.length?a.map(x=>{
      const series=x.seriesCount?`<span class="series-note">Aylık tekrar ${x.seriesIndex}/${x.seriesCount}</span>`:'';
      return `<div class="payment-row ${x.paid?'paid':''}">
        <div><div>${fd.format(parse(x.date))}</div><div class="meta">${x.paid?'Ödendi':'Bekliyor'}</div></div>
        <div><div class="payment-name">${esc(x.name)}</div>${series}</div>
        <div class="category"><span class="tag">${esc(x.category)}</span></div>
        <div class="amount">${tl.format(x.amount)}</div>
        <div class="actions">
          <button onclick="togglePaid('${x.id}')">${x.paid?'Geri al':'Ödendi'}</button>
          <button onclick="editPayment('${x.id}')">Düzenle</button>
          <button onclick="repeatPayment('${x.id}')">Tekrarla</button>
          <button onclick="deletePayment('${x.id}')">Sil</button>
        </div>
      </div>`;
    }).join(''):'<div class="empty">Kayıt bulunamadı.</div>';
  };

  normalizeState();
  setRepeat(false,2);
  renderPayments();
})();