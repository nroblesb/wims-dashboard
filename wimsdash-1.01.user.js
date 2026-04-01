// ==UserScript==
// @name         wimsdash
// @namespace    http://tampermonkey.net/
// @version      1.01
// @description  WIMS Dashboard - Live queue metrics with parent/sub-team hierarchy, dwell time tracking, customizable thresholds, lobby auto-detection, and theme-adaptive UI. Created by Jeffrey Robles Bataz @nroblesb
// @match        https://optimus-internal.amazon.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/nroblesb/wims-dashboard/main/wimsdash-1.01.user.js
// @downloadURL  https://raw.githubusercontent.com/nroblesb/wims-dashboard/main/wimsdash-1.01.user.js
// ==/UserScript==

(function(){
setTimeout(function(){
const origFetch=window.fetch;
let lastLobbies=[];
window.fetch=function(url,opts){
 if(typeof url==='string'&&url.includes('/wims/counters')&&opts&&opts.body){
   try{const b=JSON.parse(opts.body);const l=(b.skills||{}).unassigned||{};if(l.LOBBY)lastLobbies=l.LOBBY}catch(e){}
if(Object.keys(data).length&&!editTarget&&!addSubTarget){Object.keys(data).forEach(k=>delete data[k]);render();fetchAll()} }
 return origFetch.apply(this,arguments);
};
const origXHR=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send=function(body){
 if(body&&typeof body==='string'&&body.includes('savedSearchIds')){
   try{const b=JSON.parse(body);const l=(b.skills||{}).unassigned||{};if(l.LOBBY)lastLobbies=l.LOBBY}catch(e){}
 }
 return origXHR.apply(this,arguments);
};
let Q=JSON.parse(localStorage.getItem('wd2-teams')||'null')||{
 c2c:{name:'C2C',collapsed:true,subs:{
   c2c_core:{name:'C2C',lobbies:['NA_C2C_R4C','NA_C2C_R4D'],thresholds:{green:1,yellow:3,red:null}},
   crits_high:{name:'Crits & High',lobbies:['NA_WIMS_CRITICAL_PLUS','NA_WIMS_HIGH_PLUS'],thresholds:{green:5,yellow:10,red:null}}
 }},
 cases:{name:'Cases',collapsed:true,subs:{
   ca_dm:{name:'CA DM',lobbies:['NA_C2C_WIMS_CANADA','NA_WIMS_PRILO_CASES_CANADA','NA_WIMS_SUPPORT_CASES_CANADA','NA_WIMS_CANADA'],thresholds:null},
   grocery:{name:'Grocery',lobbies:['NA_AMAZON_GROCERY','NA_AMAZON_GROCERY_C2C','NA_AMAZON_GROCERY_CASES'],thresholds:null}
 }}
};
function save(){localStorage.setItem('wd2-teams',JSON.stringify(Q))}
const data={};
let showConfig=false,editTarget=null,addSubTarget=null;
function mkBody(lobbies){
 const s={};['unassigned','escalated','assigned','snoozed'].forEach(k=>s[k]={LOBBY:lobbies});
 return JSON.stringify({savedSearchIds:['unassigned','escalated','assigned','snoozed'],skills:s});
}
async function fetchSub(pk,sk){
 try{
   const lobbies=Q[pk].subs[sk].lobbies;
   const [cRes,dRes]=await Promise.all([
     origFetch('/wims/counters',{method:'POST',headers:{'Content-Type':'application/json'},body:mkBody(lobbies),credentials:'include'}),
     origFetch('/wims/savedsearch/unassigned',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page:{page:0,size:1},sortCriteria:[{field:'CREATION_DATE',direction:'ASC'}],overriddenFilter:{owners:[],escalatedBy:[],skills:{LOBBY:lobbies}},isAutoRefresh:false}),credentials:'include'})
   ]);
   const counters=await cRes.json();const dwellData=await dRes.json();
   const d={};counters.forEach(i=>d[i.searchId]=i.numFilteredResults);
   let dwell=0;
   if(dwellData.items&&dwellData.items[0])dwell=Date.now()-dwellData.items[0].creationEvent.when;
   data[pk+'_'+sk]={unassigned:d.unassigned||0,escalated:d.escalated||0,inProgress:d.assigned||0,dwell:dwell,ts:Date.now()};
   render();
 }catch(e){console.error('[WD2]',pk,sk,e)}
}
function fetchAll(){if(editTarget||addSubTarget)return;Object.entries(Q).forEach(([pk,p])=>{Object.keys(p.subs).forEach(sk=>fetchSub(pk,sk))})}function getParentData(pk){
 let u=0,e=0,ip=0,mx=0;
 Object.keys(Q[pk].subs).forEach(sk=>{const d=data[pk+'_'+sk];if(d){u+=d.unassigned;e+=d.escalated;ip+=d.inProgress;if(d.dwell>mx)mx=d.dwell}});
 return{unassigned:u,escalated:e,inProgress:ip,dwell:mx};
}
function hasData(pk){return Object.keys(Q[pk].subs).some(sk=>data[pk+'_'+sk])}
function fmtDwell(ms){if(!ms&&ms!==0)return'—';const m=Math.floor(ms/60000);if(m<60)return m+'m';return Math.floor(m/60)+'h '+(m%60)+'m'}
function dwellColor(ms,th){
 if(!th)return null;const m=Math.floor(ms/60000);
 if(m<=th.green)return'#2ecc71';if(m<=th.yellow)return'#f39c12';
 if(th.red&&m<th.red)return'#f39c12';return'#e74c3c';
}
function parentDwellColor(pk){
 let worst=null,wl=0;
 Object.entries(Q[pk].subs).forEach(([sk,sub])=>{const d=data[pk+'_'+sk];if(d&&sub.thresholds){const m=Math.floor(d.dwell/60000);let l=0;if(sub.thresholds.red){if(m>=sub.thresholds.red)l=2;else if(m>sub.thresholds.green)l=1}else{if(m>sub.thresholds.yellow)l=2;else if(m>sub.thresholds.green)l=1}if(l>wl){wl=l;worst=l===2?'#e74c3c':'#f39c12'}}});
 return worst;
}
function fmt(v){return v!=null?v:'—'}
function ago(ts){if(!ts)return'';const s=Math.floor((Date.now()-ts)/1000);return s<60?s+'s ago':s<3600?Math.floor(s/60)+'m ago':Math.floor(s/3600)+'h ago'}
function getTheme(){
 const t=document.querySelector('[mdn-tile] > div[class]');
 if(!t)return{bg:'rgb(28,37,44)',border:'1px solid rgb(160,149,133)',color:'#fff',sub:'#8899a6'};
 const s=getComputedStyle(t);const h=t.querySelector('h6');
 return{bg:s.backgroundColor,border:s.borderLeft,color:h?getComputedStyle(h).color:'#fff',sub:'#8899a6'};
}
function tile(label,value,color){
 const th=getTheme();
 return`<div class="wd2-tile" style="font-family:'Amazon Ember','Amazon Ember Arabic',Arial,sans-serif;background:${th.bg};border-radius:4px;border-left:${th.border};flex:1;height:104px;display:flex;flex-direction:column;justify-content:center;padding-left:14px"><h6 style="color:${th.color};font-size:18px;margin:0;font-weight:600">${label}</h6><p style="color:${color||th.color};font-size:36px;margin:4px 0 0;font-weight:200">${value}</p></div>`;
}
function miniTile(label,value,color){
 const th=getTheme();
 return`<div class="wd2-mini" style="font-family:'Amazon Ember','Amazon Ember Arabic',Arial,sans-serif;background:${th.bg};border-radius:4px;border-left:${th.border};flex:1;height:64px;display:flex;flex-direction:column;justify-content:center;padding-left:10px"><h6 style="color:${th.sub};font-size:12px;margin:0;font-weight:600">${label}</h6><p style="color:${color||th.color};font-size:22px;margin:2px 0 0;font-weight:200">${value}</p></div>`;
}
function moveObj(obj,key,dir){
 const keys=Object.keys(obj);const idx=keys.indexOf(key);const ni=idx+dir;
 if(ni<0||ni>=keys.length)return;
 const e=Object.entries(obj);const tmp=e[idx];e[idx]=e[ni];e[ni]=tmp;
 const nObj={};e.forEach(([k,v])=>nObj[k]=v);return nObj;
}
function inject(){
 if(document.getElementById('wd2-embed'))return;
 const nco=document.querySelector('.css-nco09c');
 if(!nco)return;
 nco.style.cssText+=';display:flex!important;flex-direction:column!important;';
 const el=document.createElement('div');el.id='wd2-embed';
el.style.cssText='width:100%;margin-bottom:8px;order:-1;overflow-y:auto;max-height:80vh'; el.setAttribute('data-darkreader-inline-bgcolor','');
 el.setAttribute('data-darkreader-inline-color','');
 nco.prepend(el);
 render();
}
function render(){
 const el=document.getElementById('wd2-embed');if(!el)return;
 if(!document.getElementById('wd2-styles')){
   const style=document.createElement('style');style.id='wd2-styles';
   style.textContent=`
     .wd2-tile{cursor:pointer;transition:all 0.2s ease}
     .wd2-tile:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.3)}
     .wd2-tile:active{transform:translateY(0)}
     .wd2-mini{cursor:pointer;transition:all 0.2s ease}
     .wd2-mini:hover{transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,0.2)}
     .wd2-mini:active{transform:translateY(0)}
     .wd2-spinner{display:inline-block;width:24px;height:24px;border:3px solid transparent;border-top:3px solid #3498db;border-radius:50%;animation:wd2spin 0.8s linear infinite}
     @keyframes wd2spin{to{transform:rotate(360deg)}}
   `;
   document.head.appendChild(style);
 }
 const pKeys=Object.keys(Q);
 const th=getTheme();
 let h=`<div style="display:flex;align-items:center;justify-content:space-between;margin:8px 0 10px"><span style="font-size:15px;font-weight:700;color:${th.color}">📊 WIMS Dashboard <span style="font-size:10px;color:#2ecc71;margin-left:6px">● LIVE</span></span><div style="display:flex;gap:8px"><button onclick="window._wd2Refresh()" style="background:none;border:none;color:#8899a6;cursor:pointer;font-size:14px" title="Refresh">⟳</button><button onclick="window._wd2Cfg()" style="background:none;border:none;color:${showConfig?'#3498db':'#8899a6'};cursor:pointer;font-size:14px" title="Settings">⚙</button></div></div>`;

 if(editTarget){
   const [pk,sk]=editTarget.split('.');const sub=Q[pk].subs[sk];const thr=sub.thresholds||{green:'',yellow:'',red:''};
   h+=`<div style="background:${th.bg};border-radius:4px;padding:12px;margin-bottom:10px">
     <div style="font-size:12px;font-weight:700;color:${th.color};margin-bottom:8px">Edit: ${sub.name}</div>
     <input id="wd2-en" value="${sub.name}" placeholder="Sub-team name" style="width:100%;padding:6px;margin-bottom:6px;background:${th.bg};border:1px solid ${th.border.split(' ').pop()};border-radius:4px;color:${th.color};font-size:12px">
     <div style="font-size:10px;color:#8899a6;margin-bottom:2px">Lobbies:</div>
     <input id="wd2-el" value="${sub.lobbies.join(', ')}" style="width:100%;padding:6px;margin-bottom:4px;background:${th.bg};border:1px solid ${th.border.split(' ').pop()};border-radius:4px;color:${th.color};font-size:11px">
     <div style="font-size:10px;color:#556677;margin-bottom:8px;padding:4px;background:${th.bg};border-radius:4px">WIMS detected: ${lastLobbies.length?'<span style="color:#2ecc71">'+lastLobbies.join(', ')+'</span>':'<span style="color:#f39c12">None</span>'} ${lastLobbies.length?`<button onclick="window._wd2UseDetected()" style="background:#2ecc7133;color:#2ecc71;border:1px solid #2ecc7155;border-radius:4px;padding:1px 6px;cursor:pointer;font-size:10px;margin-left:4px">Use these</button>`:''}</div>
     <div style="font-size:10px;color:#8899a6;margin-bottom:4px">Dwell Thresholds (minutes):</div>
     <div style="display:flex;gap:6px;margin-bottom:8px">
       <div style="flex:1"><div style="font-size:9px;color:#2ecc71;margin-bottom:2px">Green ≤</div><input id="wd2-tg" value="${thr.green||''}" placeholder="min" style="width:100%;padding:6px;background:${th.bg};border:1px solid ${th.border.split(' ').pop()};border-radius:4px;color:#2ecc71;font-size:12px;text-align:center"></div>
       <div style="flex:1"><div style="font-size:9px;color:#f39c12;margin-bottom:2px">Yellow ≤</div><input id="wd2-ty" value="${thr.yellow||''}" placeholder="min" style="width:100%;padding:6px;background:${th.bg};border:1px solid ${th.border.split(' ').pop()};border-radius:4px;color:#f39c12;font-size:12px;text-align:center"></div>
       <div style="flex:1"><div style="font-size:9px;color:#e74c3c;margin-bottom:2px">Red ≥</div><input id="wd2-tr" value="${thr.red||''}" placeholder="auto" style="width:100%;padding:6px;background:${th.bg};border:1px solid ${th.border.split(' ').pop()};border-radius:4px;color:#e74c3c;font-size:12px;text-align:center"></div>
     </div>
     <div style="font-size:9px;color:#556677;margin-bottom:8px">Leave green/yellow empty to disable. Red blank = auto (yellow+1)</div>
     <div style="display:flex;gap:6px"><button onclick="window._wd2SaveEdit()" style="flex:1;padding:6px;background:#2ecc7133;color:#2ecc71;border:1px solid #2ecc7155;border-radius:4px;cursor:pointer;font-size:12px">Save</button><button onclick="window._wd2CancelEdit()" style="flex:1;padding:6px;background:#25334133;color:#8899a6;border:1px solid #253341;border-radius:4px;cursor:pointer;font-size:12px">Cancel</button></div>
   </div>`;
 } else if(addSubTarget){
   h+=`<div style="background:${th.bg};border-radius:4px;padding:12px;margin-bottom:10px">
     <div style="font-size:12px;font-weight:700;color:${th.color};margin-bottom:8px">Add Sub-team to ${Q[addSubTarget].name}</div>
     <input id="wd2-an" placeholder="Sub-team name" style="width:100%;padding:6px;margin-bottom:6px;background:${th.bg};border:1px solid ${th.border.split(' ').pop()};border-radius:4px;color:${th.color};font-size:12px">
     <div style="font-size:10px;color:#8899a6;margin-bottom:4px">Lobbies:</div>
     <div style="font-size:10px;color:#556677;margin-bottom:4px;padding:4px;background:${th.bg};border-radius:4px">WIMS detected: ${lastLobbies.length?'<span style="color:#2ecc71">'+lastLobbies.join(', ')+'</span>':'<span style="color:#f39c12">None — select lobbies on WIMS via Skills first</span>'}</div>
     ${lastLobbies.length?`<button onclick="window._wd2AddSubFromWims()" style="width:100%;padding:6px;background:#2ecc7133;color:#2ecc71;border:1px solid #2ecc7155;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;margin-bottom:6px">+ Add from current WIMS selection</button>`:''}
     <div style="font-size:10px;color:#8899a6;margin-bottom:4px">Or enter manually:</div>
     <input id="wd2-al" placeholder="Lobby codes (comma separated)" style="width:100%;padding:6px;margin-bottom:6px;background:${th.bg};border:1px solid ${th.border.split(' ').pop()};border-radius:4px;color:${th.color};font-size:11px">
     <div style="display:flex;gap:6px">
       <button onclick="window._wd2AddSubManual()" style="flex:1;padding:6px;background:#3498db33;color:#3498db;border:1px solid #3498db55;border-radius:4px;cursor:pointer;font-size:12px">Add manually</button>
       <button onclick="window._wd2CancelAdd()" style="flex:1;padding:6px;background:#25334133;color:#8899a6;border:1px solid #253341;border-radius:4px;cursor:pointer;font-size:12px">Cancel</button>
     </div>
   </div>`;
 } else if(showConfig){
   Object.entries(Q).forEach(([pk,parent],pi)=>{
     h+=`<div style="background:${th.bg};border-radius:4px;padding:10px;margin-bottom:8px">
       <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
         <div style="display:flex;flex-direction:column;gap:2px;margin-right:2px">
           ${pi>0?`<button onclick="window._wd2MoveParent('${pk}',-1)" style="background:none;border:none;color:#556677;cursor:pointer;font-size:10px;padding:0;line-height:1">▲</button>`:'<div style="height:12px"></div>'}
           ${pi<pKeys.length-1?`<button onclick="window._wd2MoveParent('${pk}',1)" style="background:none;border:none;color:#556677;cursor:pointer;font-size:10px;padding:0;line-height:1">▼</button>`:'<div style="height:12px"></div>'}
         </div>
         <span style="font-size:13px;font-weight:700;color:${th.color};flex:1">${parent.name}</span>
         <button onclick="window._wd2AddSub('${pk}')" style="background:#2ecc7133;color:#2ecc71;border:1px solid #2ecc7155;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:10px">+ Sub</button>
         <button onclick="window._wd2DelParent('${pk}')" style="background:#e74c3c33;color:#e74c3c;border:1px solid #e74c3c55;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:10px">✕</button>
       </div>`;
     Object.entries(parent.subs).forEach(([sk,sub],i,arr)=>{
       const thr=sub.thresholds;
       h+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;padding:4px 6px;background:${th.bg};border:1px solid ${th.border.split(' ').pop()};border-radius:4px">
         <div style="display:flex;flex-direction:column;gap:2px;margin-right:2px">
           ${i>0?`<button onclick="window._wd2Move('${pk}','${sk}',-1)" style="background:none;border:none;color:#556677;cursor:pointer;font-size:10px;padding:0;line-height:1">▲</button>`:'<div style="height:12px"></div>'}
           ${i<arr.length-1?`<button onclick="window._wd2Move('${pk}','${sk}',1)" style="background:none;border:none;color:#556677;cursor:pointer;font-size:10px;padding:0;line-height:1">▼</button>`:'<div style="height:12px"></div>'}
         </div>
         <span style="font-size:11px;color:${th.color};flex:1">${sub.name}</span>
         <span style="font-size:9px;color:#556677">${sub.lobbies.length}L</span>
         ${thr?`<span style="font-size:9px;color:#556677">≤${thr.green}m <span style="color:#2ecc71">●</span> ≤${thr.yellow}m <span style="color:#f39c12">●</span> ${thr.red?'≥'+thr.red+'m':thr.yellow+'+m'} <span style="color:#e74c3c">●</span></span>`:'<span style="font-size:9px;color:#556677">no thresholds</span>'}
         <button onclick="window._wd2EditSub('${pk}.${sk}')" style="background:#3498db33;color:#3498db;border:1px solid #3498db55;border-radius:4px;padding:1px 6px;cursor:pointer;font-size:10px">✎</button>
         <button onclick="window._wd2DelSub('${pk}','${sk}')" style="background:#e74c3c33;color:#e74c3c;border:1px solid #e74c3c55;border-radius:4px;padding:1px 6px;cursor:pointer;font-size:10px">✕</button>
       </div>`;
     });
     h+=`</div>`;
   });
   h+=`<button onclick="window._wd2AddParent()" style="width:100%;padding:8px;background:#3498db33;color:#3498db;border:1px solid #3498db55;border-radius:4px;cursor:pointer;font-size:12px;margin-top:4px">+ Add Parent Team</button>`;
 } else {
   Object.entries(Q).forEach(([pk,parent])=>{
     const pd=getParentData(pk);const pdColor=parentDwellColor(pk);const loaded=hasData(pk);
     h+=`<div style="margin-bottom:12px"><div onclick="window._wd2Toggle('${pk}')" style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:6px"><span style="color:#8899a6;font-size:12px">${parent.collapsed?'▶':'▼'}</span><span style="font-size:15px;font-weight:700;color:${th.color}">${parent.name}</span></div>
       <div style="display:flex;gap:8px">${loaded?tile('Unassigned',fmt(pd.unassigned),null)+tile('Escalated',fmt(pd.escalated),null)+tile('In Progress',fmt(pd.inProgress),null)+tile('Dwell Time',fmtDwell(pd.dwell),pdColor):'<div style="flex:1;height:104px;display:flex;align-items:center;justify-content:center"><div class="wd2-spinner"></div></div>'}</div>`;
     if(!parent.collapsed){
       Object.entries(parent.subs).forEach(([sk,sub])=>{
         const d=data[pk+'_'+sk];const dc=d?dwellColor(d.dwell,sub.thresholds):null;
         h+=`<div style="margin:8px 0 0 20px"><div style="font-size:12px;color:#8899a6;margin-bottom:4px">${sub.name} <span style="font-size:9px;color:#556677">${d?ago(d.ts):''}</span></div>
           <div style="display:flex;gap:6px">${d?miniTile('Unassigned',fmt(d.unassigned),null)+miniTile('Escalated',fmt(d.escalated),null)+miniTile('In Progress',fmt(d.inProgress),null)+miniTile('Dwell',fmtDwell(d.dwell),dc):'<div style="flex:1;height:64px;display:flex;align-items:center;justify-content:center"><div class="wd2-spinner"></div></div>'}</div></div>`;
       });
     }
     h+=`</div>`;
   });
 }
 el.innerHTML=h;
}
window._wd2Toggle=function(pk){Q[pk].collapsed=!Q[pk].collapsed;save();render()};
window._wd2Refresh=function(){Object.keys(data).forEach(k=>delete data[k]);render();fetchAll()};
window._wd2Cfg=function(){showConfig=!showConfig;editTarget=null;addSubTarget=null;render()};
window._wd2EditSub=function(t){editTarget=t;addSubTarget=null;render()};
window._wd2CancelEdit=function(){editTarget=null;render()};
window._wd2UseDetected=function(){if(lastLobbies.length){const el=document.getElementById('wd2-el');if(el)el.value=lastLobbies.join(', ')}};
window._wd2SaveEdit=function(){
 if(!editTarget)return;const [pk,sk]=editTarget.split('.');const sub=Q[pk].subs[sk];
 const n=document.getElementById('wd2-en').value.trim();const l=document.getElementById('wd2-el').value.trim();
 const tg=document.getElementById('wd2-tg').value.trim();const ty=document.getElementById('wd2-ty').value.trim();const tr=document.getElementById('wd2-tr').value.trim();
 if(n)sub.name=n;if(l)sub.lobbies=l.split(',').map(s=>s.trim());
 if(tg&&ty)sub.thresholds={green:parseInt(tg),yellow:parseInt(ty),red:tr?parseInt(tr):null};else sub.thresholds=null;
 save();editTarget=null;render();fetchSub(pk,sk);
};
window._wd2AddSub=function(pk){addSubTarget=pk;editTarget=null;render()};
window._wd2CancelAdd=function(){addSubTarget=null;render()};
window._wd2AddSubFromWims=function(){
 if(!addSubTarget)return;const n=document.getElementById('wd2-an').value.trim();
 if(!n){alert('Enter a sub-team name');return}if(!lastLobbies.length){alert('No lobbies detected');return}
 const sk=n.toLowerCase().replace(/[^a-z0-9]/g,'_');
 Q[addSubTarget].subs[sk]={name:n,lobbies:[...lastLobbies],thresholds:null};
 save();const fpk=addSubTarget;addSubTarget=null;render();fetchSub(fpk,sk);
};
window._wd2AddSubManual=function(){
 if(!addSubTarget)return;const n=document.getElementById('wd2-an').value.trim();const l=document.getElementById('wd2-al').value.trim();
 if(!n||!l){alert('Enter name and lobby codes');return}
 const sk=n.toLowerCase().replace(/[^a-z0-9]/g,'_');
 Q[addSubTarget].subs[sk]={name:n,lobbies:l.split(',').map(s=>s.trim()),thresholds:null};
 save();const fpk=addSubTarget;addSubTarget=null;render();fetchSub(fpk,sk);
};
window._wd2DelSub=function(pk,sk){if(confirm('Remove '+Q[pk].subs[sk].name+'?')){delete Q[pk].subs[sk];delete data[pk+'_'+sk];save();render()}};
window._wd2AddParent=function(){const name=prompt('Parent team name:');if(!name)return;const pk=name.toLowerCase().replace(/[^a-z0-9]/g,'_');Q[pk]={name:name,collapsed:true,subs:{}};save();render()};
window._wd2DelParent=function(pk){if(!confirm('Remove "'+Q[pk].name+'" and all sub-teams?'))return;Object.keys(Q[pk].subs).forEach(sk=>delete data[pk+'_'+sk]);delete Q[pk];save();render()};
window._wd2Move=function(pk,sk,dir){const r=moveObj(Q[pk].subs,sk,dir);if(r){Q[pk].subs=r;save();render()}};
window._wd2MoveParent=function(pk,dir){const r=moveObj(Q,pk,dir);if(r){Object.keys(Q).forEach(k=>delete Q[k]);Object.entries(r).forEach(([k,v])=>Q[k]=v);save();render()}};
setInterval(()=>{if(!document.getElementById('wd2-embed'))inject()},3000);
inject();fetchAll();setInterval(fetchAll,15000);
},3000);
})();
