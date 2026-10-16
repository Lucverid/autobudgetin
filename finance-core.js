/* Shared data rules. No network, credentials, or application state. */
(function(root){
  'use strict';
  const PREFS=['agis_finance_monthly_archive_v28_5','agis_finance_auto_budget_v28','agis_finance_auto_budget_applied_v28','agis_finance_smart_controls_v24_4','agis_finance_spending_class_v24_4','agis_finance_heatmap_month_v28_5_1','agis_theme','agis_privacy'];
  function validDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;
    const date=new Date(value+'T00:00:00Z');
    return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
  }
  function validMonth(value){return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value));}
  function amount(value,label,negative=false){
    if(typeof value!=='number'||!Number.isSafeInteger(value)||(!negative&&value<0))throw new Error(`${label}: nominal tidak valid.`);
    return value;
  }
  function validateBackup(payload){
    if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Format backup tidak dikenali.');
    const d=payload.data||payload;
    if(!d.wallets||!Array.isArray(d.trans))throw new Error('Backup harus berisi wallet dan transaksi.');
    // Guard object keys before any imported state reaches object spreads or map lookups.
    JSON.stringify(d,(key,value)=>{if(['__proto__','constructor','prototype'].includes(key))throw new Error('Backup mengandung nama field yang tidak diizinkan.');return value;});
    ['Tunai','Bank','E-Wallet'].forEach(key=>amount(d.wallets[key]??0,'Wallet '+key,true));
    const result={...d,wallets:{...d.wallets},goal:amount(d.goal??0,'Tabungan'),limits:d.limits||{}};
    if(typeof result.limits!=='object'||Array.isArray(result.limits))throw new Error('Format limit tidak valid.');
    Object.values(result.limits).forEach(v=>amount(v,'Limit'));
    for(const key of ['trans','incomes','transfers','goals','recurring','audit']){
      const rows=d[key]??[];
      if(!Array.isArray(rows))throw new Error(`Format ${key} harus berupa daftar.`);
      const ids=new Set();
      result[key]=rows.map(row=>{
        if(!row||typeof row!=='object'||Array.isArray(row))throw new Error(`Data ${key} tidak valid.`);
        if(key==='audit')return {...row};
        if(typeof row.id!=='string'||!row.id||row.id.includes('/')||row.id.length>1500||ids.has(row.id))throw new Error(`ID ${key} kosong, duplikat, atau tidak valid.`);
        ids.add(row.id);
        if(['trans','incomes','transfers'].includes(key)){
          if(!validDate(row.tanggal))throw new Error(`Tanggal ${key} tidak valid.`);
          amount(row.nominal,key);
          if(row.nominal===0)throw new Error('Nominal transaksi harus lebih dari nol.');
          const wallets=['Tunai','Bank','E-Wallet'];
          if(key==='transfers'){
            if(!wallets.includes(row.dari)||!wallets.includes(row.ke)||row.dari===row.ke)throw new Error('Wallet transfer tidak valid.');
          }else if(!wallets.includes(row.dompet))throw new Error('Wallet transaksi tidak valid.');
        }
        if(key==='goals'){amount(row.target??0,'Target');amount(row.saved??0,'Tersimpan');}
        if(key==='recurring')amount(row.nominal,'Transaksi rutin');
        const clean={...row};delete clean.pendingSync;return clean;
      });
    }
    return result;
  }
  // Largest remainder: all integer rupiah sum exactly to the available budget.
  function allocate(total,weights){
    total=Math.max(0,Math.floor(Number(total)||0));
    const keys=Object.keys(weights),sum=keys.reduce((n,k)=>n+Math.max(0,Number(weights[k])||0),0),out={};
    const fractions=keys.map((key,index)=>{const raw=sum?total*Math.max(0,Number(weights[key])||0)/sum:0;out[key]=Math.floor(raw);return {key,index,fraction:raw-out[key]};});
    let rest=total-Object.values(out).reduce((a,b)=>a+b,0);
    if(sum)fractions.sort((a,b)=>b.fraction-a.fraction||a.index-b.index).forEach(item=>{if(rest>0){out[item.key]++;rest--;}});
    return out;
  }
  function capturePreferences(storage){const out={};for(const key of PREFS){const value=storage.getItem(key);if(value!==null)out[key]=value;}return out;}
  function restorePreferences(storage,values){for(const key of PREFS){if(typeof values[key]==='string')storage.setItem(key,values[key]);}}
  const api={validDate,validMonth,validateBackup,allocate,capturePreferences,restorePreferences};
  root.FinanceCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
