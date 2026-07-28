(()=>{
  const selectedIds=new Set();
  const panel=paymentList.closest('.panel');
  const bulkBar=document.createElement('div');
  bulkBar.className='bulk-bar';
  bulkBar.innerHTML=`
    <label class="bulk-select-all"><input id="bulkSelectAll" type="checkbox"><span>Tümünü seç</span></label>
    <span id="bulkSelectedCount" class="bulk-count">0 seçili</span>
    <button id="bulkDelete" class="bulk-delete" type="button" disabled>Seçilenleri sil</button>
    <button id="bulkClear" class="bulk-clear" type="button" hidden>Seçimi temizle</button>`;
  panel.insertBefore(bulkBar,paymentList);

  const selectAll=document.getElementById('bulkSelectAll');
  const selectedCount=document.getElementById('bulkSelectedCount');
  const deleteButton=document.getElementById('bulkDelete');
  const clearButton=document.getElementById('bulkClear');

  function existingIds(){return new Set(payments().map(x=>x.id))}
  function pruneSelection(){const existing=existingIds();[...selectedIds].forEach(id=>{if(!existing.has(id))selectedIds.delete(id)})}
  function visibleIds(){return filtered().map(x=>x.id)}
  function updateBulkBar(){
    pruneSelection();
    const visible=visibleIds(),visibleSelected=visible.filter(id=>selectedIds.has(id)).length;
    selectAll.checked=visible.length>0&&visibleSelected===visible.length;
    selectAll.indeterminate=visibleSelected>0&&visibleSelected<visible.length;
    selectedCount.textContent=`${selectedIds.size} seçili`;
    deleteButton.disabled=selectedIds.size===0;
    clearButton.hidden=selectedIds.size===0;
  }
  function deleteOne(id){
    const index=state.custom.findIndex(x=>x.id===id);
    if(index>=0)state.custom.splice(index,1);
    else state.deleted[id]=true;
    delete state.paid[id];
    delete state.overrides[id];
  }

  window.togglePaymentSelection=(id,checked)=>{
    if(checked)selectedIds.add(id);else selectedIds.delete(id);
    const row=document.querySelector(`.payment-row[data-payment-id="${CSS.escape(id)}"]`);
    if(row)row.classList.toggle('selected-row',checked);
    updateBulkBar();
  };

  selectAll.onchange=()=>{
    visibleIds().forEach(id=>selectAll.checked?selectedIds.add(id):selectedIds.delete(id));
    renderPayments();
  };
  clearButton.onclick=()=>{selectedIds.clear();renderPayments()};
  deleteButton.onclick=()=>{
    const count=selectedIds.size;
    if(!count)return;
    if(!confirm(`${count} ödeme silinsin mi?`))return;
    [...selectedIds].forEach(deleteOne);
    selectedIds.clear();
    save();
    fillFilters();
    renderAll();
  };

  renderPayments=function(){
    const a=filtered();
    paymentList.innerHTML=a.length?a.map(x=>{
      const series=x.seriesCount?`<span class="series-note">Aylık tekrar ${x.seriesIndex}/${x.seriesCount}</span>`:'';
      const selected=selectedIds.has(x.id);
      return `<div class="payment-row bulk-payment-row ${x.paid?'paid':''} ${selected?'selected-row':''}" data-payment-id="${esc(x.id)}" data-category="${esc(x.category)}">
        <div class="payment-select"><input type="checkbox" aria-label="${esc(x.name)} seç" ${selected?'checked':''} onchange="togglePaymentSelection('${x.id}',this.checked)"></div>
        <div><div>${fd.format(parse(x.date))}</div><div class="meta">${x.paid?'Ödendi':'Bekliyor'}</div></div>
        <div><div class="payment-name">${esc(x.name)}</div>${series}</div>
        <div class="category"><span class="tag category-tag" data-category="${esc(x.category)}">${esc(x.category)}</span></div>
        <div class="amount">${tl.format(x.amount)}</div>
        <div class="actions">
          <button onclick="togglePaid('${x.id}')">${x.paid?'Geri al':'Ödendi'}</button>
          <button onclick="editPayment('${x.id}')">Düzenle</button>
          <button onclick="repeatPayment('${x.id}')">Tekrarla</button>
          <button onclick="deletePayment('${x.id}')">Sil</button>
        </div>
      </div>`;
    }).join(''):'<div class="empty">Kayıt bulunamadı.</div>';
    updateBulkBar();
  };

  [searchInput,categoryFilter,statusFilter,monthFilter].forEach(x=>x.addEventListener('input',()=>setTimeout(updateBulkBar,0)));
  renderPayments();
})();