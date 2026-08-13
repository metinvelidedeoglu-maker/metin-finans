(()=>{
  const BASE_CATEGORIES=[...formCategory.options].map(x=>x.value).filter(Boolean);
  const categoryTag=category=>`<span class="tag category-tag" data-category="${esc(category)}">${esc(category)}</span>`;
  const manager=document.getElementById('categoryModal');
  const managerList=document.getElementById('categoryManagerList');
  const managerOpen=document.getElementById('manageCategories');
  const managerClose=document.getElementById('closeCategoryModal');
  const addForm=document.getElementById('categoryAddForm');
  const addInput=document.getElementById('newCategoryName');
  const dashboardTotals=document.getElementById('dashboardCategoryTotals');

  function normalizeCategories(){
    if(!Array.isArray(state.customCategories))state.customCategories=[];
    state.customCategories=[...new Set(state.customCategories.map(x=>String(x||'').trim()).filter(Boolean))];
  }

  function usedCategories(){return [...new Set(payments().map(x=>x.category).filter(Boolean))]}
  function allCategories(){
    normalizeCategories();
    const result=[...BASE_CATEGORIES,...state.customCategories];
    usedCategories().forEach(x=>{if(!result.includes(x))result.push(x)});
    return result;
  }
  window.getAllPaymentCategories=allCategories;

  function categoryCount(name){return payments().filter(x=>x.category===name).length}
  function isBase(name){return BASE_CATEGORIES.includes(name)}
  function isCustom(name){normalizeCategories();return state.customCategories.includes(name)}

  function refreshCategorySelects(){
    const cats=allCategories();
    const currentForm=formCategory.value;
    formCategory.innerHTML=cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    if(cats.includes(currentForm))formCategory.value=currentForm;
    else if(cats.length)formCategory.value=cats[0];

    const currentFilter=categoryFilter.value;
    categoryFilter.innerHTML='<option value="">Tüm kategoriler</option>'+cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    if(cats.includes(currentFilter))categoryFilter.value=currentFilter;
  }

  const originalFillFilters=fillFilters;
  fillFilters=function(){
    const selectedCategory=categoryFilter.value;
    originalFillFilters();
    refreshCategorySelects();
    if(allCategories().includes(selectedCategory))categoryFilter.value=selectedCategory;
  };

  function renderManager(){
    if(!managerList)return;
    normalizeCategories();
    managerList.innerHTML=allCategories().map(name=>{
      const count=categoryCount(name);
      const locked=isBase(name);
      const custom=isCustom(name);
      const action=locked
        ?'<span class="category-fixed">Sabit</span>'
        :custom
          ?`<button type="button" class="category-delete" onclick="deleteExpenseCategory('${String(name).replaceAll("'","\\'")}')">Sil</button>`
          :'<span class="category-fixed">Kullanımda</span>';
      return `<div class="category-manager-row">
        <div>${categoryTag(name)}<small>${count} kayıt</small></div>
        ${action}
      </div>`;
    }).join('');
  }

  window.deleteExpenseCategory=name=>{
    normalizeCategories();
    if(isBase(name))return;
    const count=categoryCount(name);
    if(count>0){
      alert(`“${name}” kategorisinde ${count} kayıtlı harcama var. Bu kategori silinemez. Önce bu harcamaları başka bir kategoriye taşı veya sil.`);
      return;
    }
    const index=state.customCategories.indexOf(name);
    if(index<0)return;
    if(!confirm(`“${name}” kategorisi silinsin mi?`))return;
    state.customCategories.splice(index,1);
    save();
    refreshCategorySelects();
    renderManager();
    renderAll();
  };

  if(addForm)addForm.onsubmit=e=>{
    e.preventDefault();
    normalizeCategories();
    const name=addInput.value.trim().replace(/\s+/g,' ');
    if(!name)return;
    const exists=allCategories().some(x=>x.toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr'));
    if(exists){alert('Bu kategori zaten var.');return}
    state.customCategories.push(name);
    save();
    addInput.value='';
    refreshCategorySelects();
    renderManager();
    renderDashboard();
  };

  if(managerOpen)managerOpen.onclick=()=>{renderManager();manager.classList.add('open');setTimeout(()=>addInput?.focus(),50)};
  if(managerClose)managerClose.onclick=()=>manager.classList.remove('open');
  if(manager)manager.onclick=e=>{if(e.target===manager)manager.classList.remove('open')};

  function renderCategoryTotals(a){
    if(!dashboardTotals)return;
    const totals={},counts={};
    a.forEach(x=>{
      totals[x.category]=(totals[x.category]||0)+Number(x.amount);
      counts[x.category]=(counts[x.category]||0)+1;
    });
    const cats=allCategories();
    dashboardTotals.innerHTML=cats.map(name=>`
      <div class="dashboard-category-card" data-category="${esc(name)}">
        <div>${categoryTag(name)}</div>
        <b>${tl.format(totals[name]||0)}</b>
        <small>${counts[name]||0} harcama</small>
      </div>`).join('');
  }

  renderDashboard=function(){
    const a=payments(),monthly={};
    a.forEach(x=>monthly[month(x.date)]=(monthly[month(x.date)]||0)+Number(x.amount));
    renderCategoryTotals(a);
    const keys=Object.keys(monthly).sort().slice(0,12),max=Math.max(1,...keys.map(k=>monthly[k]));
    monthlyBars.innerHTML=keys.map(k=>`<div class="bar-row"><span>${esc(fms.format(parse(k+'-01')))}</span><div class="bar-track"><div class="bar-fill" style="width:${monthly[k]/max*100}%"></div></div><span class="bar-value">${tl.format(monthly[k])}</span></div>`).join('');
    const up=a.slice(0,8);
    upcomingList.innerHTML=up.length?up.map(x=>`<div class="upcoming-row category-row" data-category="${esc(x.category)}"><div><div class="payment-name">${esc(x.name)}</div><div class="meta">${fd.format(parse(x.date))} · ${categoryTag(x.category)}</div></div><div class="amount">${tl.format(x.amount)}</div></div>`).join(''):'<div class="empty">Kayıtlı harcama yok.</div>';
  };

  renderDebts=function(){
    const grid=document.getElementById('debtGrid');
    if(!grid)return;
    grid.innerHTML='';
  };

  const previousRenderAll=renderAll;
  renderAll=function(){previousRenderAll();refreshCategorySelects();renderCategoryTotals(payments());if(manager?.classList.contains('open'))renderManager()};

  refreshCategorySelects();
  renderManager();
  renderDashboard();
})();