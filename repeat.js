(()=>{
  const repeatToggle=document.getElementById('formRepeat');
  const repeatFields=document.getElementById('repeatFields');
  const repeatCountInput=document.getElementById('formRepeatCount');
  const repeatToggleWrap=repeatToggle.closest('.repeat-toggle');
  let editingSeries=null;

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

  function setSeriesEditMode(enabled){
    if(repeatToggleWrap)repeatToggleWrap.hidden=!!enabled;
    if(enabled){
      repeatFields.hidden=true;
      repeatCountInput.disabled=true;
      repeatToggle.checked=false;
    }
  }

  function fillModal(x,title,repeat=false,seriesContext=null){
    normalizeState();
    editingSeries=seriesContext;
    editId.value=x?.id||'';
    formName.value=x?.name||'';
    formCategory.value=x?.category||'Kredi Kartı';
    formDate.value=x?.date||iso(new Date());
    formAmount.value=x?.amount||'';
    modalTitle.textContent=title;
    setSeriesEditMode(!!seriesContext);
    if(!seriesContext)setRepeat(repeat,2);
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
    if(i>=0)state.custom[i]={...state.custom[i],...v,...meta};
    else state.overrides[id]={...(state.overrides[id]||{}),...v,...meta};
  }

  function deleteOne(id){
    normalizeState();
    const i=state.custom.findIndex(x=>x.id===id);
    if(i>=0)state.custom.splice(i,1);
    else state.deleted[id]=true;
    delete state.paid[id];
    delete state.overrides[id];
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

  function getSeriesDescriptor(payment){
    if(!payment)return null;
    const all=payments();
    if(payment.seriesId){
      const members=all.filter(x=>x.seriesId===payment.seriesId).sort((a,b)=>a.date.localeCompare(b.date));
      if(members.length<2)return null;
      return {
        kind:'custom',
        key:payment.seriesId,
        members,
        total:Number(payment.seriesCount)||members.length,
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
        kind:'base',
        key:baseId,
        members,
        total:raw.length,
        ordinal:x=>rawOrder.get(x.id)||members.findIndex(m=>m.id===x.id)+1
      };
    }
    return null;
  }

  function applySeriesUpdate(context,v){
    const selected=payments().find(x=>x.id===context.selectedId);
    const descriptor=getSeriesDescriptor(selected)||context.descriptor;
    if(!descriptor)return false;
    const selectedOrdinal=descriptor.ordinal(selected);
    const selectedNewDate=parse(v.date);
    const base=plusMonth(selectedNewDate,-(selectedOrdinal-1),selectedNewDate.getDate());
    descriptor.members.forEach(member=>{
      const ordinal=descriptor.ordinal(member);
      const d=plusMonth(base,ordinal-1,base.getDate());
      updateExisting(member.id,{name:v.name,category:v.category,amount:v.amount,date:iso(d)});
    });
    return true;
  }

  function infoFor(id){
    const x=payments().find(p=>p.id===id);
    const descriptor=getSeriesDescriptor(x);
    if(!descriptor)return null;
    const ordinal=descriptor.ordinal(x);
    return {
      key:descriptor.key,
      count:descriptor.members.length,
      total:descriptor.total,
      index:ordinal,
      label:`Aylık tekrar ${ordinal}/${descriptor.total}`
    };
  }

  window.getPaymentSeriesInfo=infoFor;

  addPayment.onclick=()=>{
    paymentForm.reset();
    editingSeries=null;
    editId.value='';
    formCategory.value='Kredi Kartı';
    formDate.value=iso(new Date());
    modalTitle.textContent='Yeni ödeme';
    setSeriesEditMode(false);
    setRepeat(false,2);
    openModal();
  };

  window.editPayment=id=>{
    const x=payments().find(p=>p.id===id);
    if(x)fillModal(x,'Ödemeyi düzenle',false,null);
  };

  window.repeatPayment=id=>{
    const x=payments().find(p=>p.id===id);
    if(x)fillModal(x,'Ödemeyi tekrarla',true,null);
  };

  window.editPaymentSeries=id=>{
    const x=payments().find(p=>p.id===id);
    const descriptor=getSeriesDescriptor(x);
    if(!x||!descriptor)return;
    fillModal(x,`Seriyi düzenle · ${descriptor.members.length} ödeme`,false,{selectedId:id,descriptor});
  };

  window.deletePaymentSeries=id=>{
    const x=payments().find(p=>p.id===id);
    const descriptor=getSeriesDescriptor(x);
    if(!descriptor)return;
    const count=descriptor.members.length;
    if(!confirm(`${count} tekrarlanan ödemenin tamamı silinsin mi?`))return;
    descriptor.members.map(x=>x.id).forEach(deleteOne);
    save();
    fillFilters();
    renderAll();
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

    if(editingSeries){
      applySeriesUpdate(editingSeries,v);
      editingSeries=null;
    }else{
      const repeated=repeatToggle.checked;
      const count=repeated?Math.min(120,Math.max(2,parseInt(repeatCountInput.value,10)||2)):1;
      if(repeated)addSeries(v,count,id);
      else if(id)updateExisting(id,v);
      else state.custom.push({id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,...v});
    }

    save();
    close();
    setSeriesEditMode(false);
    fillFilters();
    renderAll();
    setView('payments');
  };

  renderPayments=function(){
    const a=filtered();
    paymentList.innerHTML=a.length?a.map(x=>{
      const info=infoFor(x.id);
      const series=info?`<span class="series-note">${info.label}</span>`:'';
      const seriesActions=info?`<button onclick="editPaymentSeries('${x.id}')">Seriyi düzenle</button><button onclick="deletePaymentSeries('${x.id}')">Seriyi sil</button>`:`<button onclick="repeatPayment('${x.id}')">Tekrarla</button>`;
      return `<div class="payment-row ${x.paid?'paid':''}">
        <div><div>${fd.format(parse(x.date))}</div><div class="meta">${x.paid?'Ödendi':'Bekliyor'}</div></div>
        <div><div class="payment-name">${esc(x.name)}</div>${series}</div>
        <div class="category"><span class="tag">${esc(x.category)}</span></div>
        <div class="amount">${tl.format(x.amount)}</div>
        <div class="actions">
          <button onclick="togglePaid('${x.id}')">${x.paid?'Geri al':'Ödendi'}</button>
          <button onclick="editPayment('${x.id}')">Düzenle</button>
          ${seriesActions}
          <button onclick="deletePayment('${x.id}')">Sil</button>
        </div>
      </div>`;
    }).join(''):'<div class="empty">Kayıt bulunamadı.</div>';
  };

  normalizeState();
  setSeriesEditMode(false);
  setRepeat(false,2);
  renderPayments();
})();