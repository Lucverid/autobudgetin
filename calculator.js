/* Standalone calculator rules + floating UI. No eval, network or wallet writes. */
(function(root){
'use strict';
function calculate(expression){
 const input=String(expression).replace(/\s/g,'');
 if(!input||input.length>160)throw Error('Perhitungan belum lengkap.');
 const tokens=input.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[+\-*/]/gi);
 if(!tokens||tokens.join('')!==input)throw Error('Perhitungan tidak valid.');
 let i=0;
 function factor(){const t=tokens[i++];if(t==='+'||t==='-')return (t==='-'?-1:1)*factor();if(!t||!/^(?:\d|\.)/.test(t))throw Error('Perhitungan belum lengkap.');const n=Number(t);if(!Number.isFinite(n))throw Error('Angka terlalu besar.');return n;}
 function term(){let n=factor();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],r=factor();if(op==='/'&&r===0)throw Error('Tidak bisa dibagi nol.');n=op==='*'?n*r:n/r;}return n;}
 function sum(){let n=term();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],r=term();n=op==='+'?n+r:n-r;}return n;}
 let value=sum();if(i!==tokens.length||!Number.isFinite(value))throw Error('Hasil tidak valid.');
 // Remove ordinary binary floating-point noise without truncating safe integer rupiah.
 if(!Number.isSafeInteger(value))value=Number(value.toPrecision(14));return Object.is(value,-0)?0:value;
}
function rupiah(value){const rounded=Math.round(value);return Number.isFinite(value)&&Number.isSafeInteger(rounded)&&rounded>0?rounded:null;}
function clampPosition(x,y,width,height,viewport){const pad=8,left=Number(viewport.left)||0,top=Number(viewport.top)||0;return {x:Math.max(left+pad,Math.min(Number(x)||left+pad,left+Math.max(pad,viewport.width-width-pad))),y:Math.max(top+pad,Math.min(Number(y)||top+pad,top+Math.max(pad,viewport.height-height-pad)))};}
const api={calculate,rupiah,clampPosition};root.CalculatorCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
if(!root.document)return;
function init(){
 const doc=root.document,panel=doc.getElementById('calc-container'),launcher=doc.getElementById('calcLauncher');if(!panel||!launcher)return;
 const header=doc.getElementById('calcHeader'),display=doc.getElementById('calcDisplay'),expressionEl=doc.getElementById('calcExpression'),use=doc.getElementById('calcUse'),note=doc.getElementById('calcNote');
 let expression='',result=null,completed=false,error=false,opened=false;
 const viewport=()=>root.visualViewport?{left:root.visualViewport.offsetLeft,top:root.visualViewport.offsetTop,width:root.visualViewport.width,height:root.visualViewport.height}:{left:0,top:0,width:root.innerWidth,height:root.innerHeight};
 const position=(node,x,y)=>{const box=node.getBoundingClientRect(),p=clampPosition(x,y,box.width,box.height,viewport());node.style.left=p.x+'px';node.style.top=p.y+'px';node.style.right='auto';node.style.bottom='auto';return p;};
 const read=key=>{try{const p=JSON.parse(localStorage.getItem(key));return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?p:null;}catch{return null;}};
 const save=(key,p)=>{try{localStorage.setItem(key,JSON.stringify(p));}catch{}};
 const launcherKey='agis_finance_calc_launcher_v28_9',panelKey='agis_finance_calc_panel_v28_9';
 function show(){opened=true;panel.hidden=false;panel.style.display='block';launcher.setAttribute('aria-expanded','true');const p=read(panelKey),v=viewport(),box=panel.getBoundingClientRect();position(panel,p?.x??v.left+v.width-box.width-16,p?.y??v.top+Math.max(8,(v.height-box.height)/2));doc.getElementById('calcClose').focus({preventScroll:true});}
 function close(){opened=false;panel.hidden=true;panel.style.display='none';launcher.setAttribute('aria-expanded','false');launcher.focus({preventScroll:true});}
 function draw(){expressionEl.textContent=completed?expression.replaceAll('*','×').replaceAll('/','÷')+' =':'Kalkulator';display.textContent=error?'Tidak valid':completed?new Intl.NumberFormat('id-ID',{maximumFractionDigits:12}).format(result):expression.replaceAll('*','×').replaceAll('/','÷')||'0';const amount=completed&&!error?rupiah(result):null;use.disabled=amount===null;use.textContent=amount===null?'Gunakan nominal':'Gunakan Rp '+new Intl.NumberFormat('id-ID').format(amount);note.textContent=error?'Periksa angka atau pembagian dengan nol.':amount!==null&&amount!==result?'Nominal transaksi dibulatkan ke rupiah terdekat.':'Hasil tidak mengubah transaksi sampai dipilih.';}
 root.toggleCalc=()=>opened?close():show();
 root.calcPush=value=>{const v=String(value);if(!/^[0-9.+\-*/]$/.test(v))return;if(error){expression='';error=false;completed=false;}if(completed){expression=/\d|\./.test(v)?'':String(result);completed=false;}result=null;if(expression.length>=160)return;const operand=expression.split(/[+\-*/]/).pop();if(v==='.'&&operand.includes('.'))return;if(v==='.'&&!operand)expression+='0';if(/[+*/]/.test(v)&&!expression)return;if(/[+*/]/.test(v)&&/[+\-*/]$/.test(expression))expression=expression.slice(0,-1);expression+=v;draw();};
 root.calcClear=()=>{expression='';result=null;completed=false;error=false;draw();};
 root.calcPop=()=>{if(error)return root.calcClear();if(completed)expression=String(result);expression=expression.slice(0,-1);result=null;completed=false;draw();};
 root.calcEqual=()=>{try{result=calculate(expression);completed=true;error=false;}catch{result=null;error=true;completed=false;}draw();};
 use.addEventListener('click',()=>{const amount=completed&&!error?rupiah(result):null;if(amount===null)return;root.nav('add');doc.getElementById('t-amount-display').value=new Intl.NumberFormat('id-ID').format(amount);doc.getElementById('t-amount').value=String(amount);close();doc.getElementById('t-amount-display').focus({preventScroll:true});});
 doc.getElementById('calcClose').addEventListener('click',close);
 // Pointer capture works with mouse, touch and pen. Moving never toggles the panel.
 function draggable(node,handle,key){let active=null,suppressUntil=0;
 handle.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button')&&handle!==launcher)return;const b=node.getBoundingClientRect();active={id:e.pointerId,x:e.clientX,y:e.clientY,left:b.left,top:b.top,moved:false};handle.setPointerCapture(e.pointerId);});
 handle.addEventListener('pointermove',e=>{if(!active||active.id!==e.pointerId)return;const dx=e.clientX-active.x,dy=e.clientY-active.y;if(!active.moved&&Math.hypot(dx,dy)<6)return;active.moved=true;node.classList.add('is-dragging');position(node,active.left+dx,active.top+dy);e.preventDefault();});
 function end(e){if(!active||active.id!==e.pointerId)return;if(active.moved){suppressUntil=performance.now()+400;const b=node.getBoundingClientRect();save(key,{x:b.left,y:b.top});}node.classList.remove('is-dragging');active=null;if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);}
 handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',()=>{active=null;node.classList.remove('is-dragging');});
 if(handle===launcher)handle.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();return;}root.toggleCalc();});
 handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||e.target!==handle)return;const b=node.getBoundingClientRect(),step=e.shiftKey?40:8,p=position(node,b.left+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),b.top+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0));save(key,p);e.preventDefault();});
 }
 draggable(launcher,launcher,launcherKey);draggable(panel,header,panelKey);
 function confine(){const p=read(launcherKey),v=viewport(),b=launcher.getBoundingClientRect();position(launcher,p?.x??v.left+v.width-b.width-18,p?.y??v.top+v.height-156);if(opened){const b=panel.getBoundingClientRect();position(panel,b.left,b.top);}}
 root.addEventListener('resize',confine);root.visualViewport?.addEventListener('resize',confine);root.visualViewport?.addEventListener('scroll',confine);
 doc.addEventListener('keydown',e=>{if(!opened||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(/^[0-9.+\-*/]$/.test(e.key)){root.calcPush(e.key);e.preventDefault();}else if(e.key==='Enter'||e.key==='='){if(e.key==='Enter'&&e.target.closest('#calcClose,#calcUse'))return;root.calcEqual();e.preventDefault();}else if(e.key==='Backspace'){root.calcPop();e.preventDefault();}else if(e.key==='Escape'){close();e.preventDefault();}});
 panel.hidden=true;confine();draw();
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
