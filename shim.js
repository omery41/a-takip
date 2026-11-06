/* a-takip · Firebase uyumluluk katmanı (window.claude yerine) */
(function(){
  if(!window.FB_CONFIG||!window.firebase){return}
  window.SA=true;
  const app=firebase.initializeApp(window.FB_CONFIG),fs=firebase.firestore();
  try{fs.settings({experimentalForceLongPolling:true,merge:true})}catch(_){}
  try{fs.enablePersistence({synchronizeTabs:true}).catch(()=>{})}catch(_){}
  const TO=(p,ms=12000)=>Promise.race([p,new Promise((_,rj)=>setTimeout(()=>rj(new Error("Sunucuya bağlanılamadı (zaman aşımı)")),ms))]);
  const clean=o=>JSON.parse(JSON.stringify(o===undefined?null:o));
  const dsnap=s=>({exists:s.exists,id:s.id,data:()=>s.data()});
  const qsnap=q=>({docs:q.docs.map(d=>({id:d.id,data:()=>d.data()})),size:q.size});
  const DB={
    collection:p=>{const c=fs.collection(p);return{
      onSnapshot:(cb,er)=>c.onSnapshot(q=>cb(qsnap(q)),e=>er&&er(e)),
      add:async d=>{const r=await c.add(clean(d));return{id:r.id}},
      get:async()=>qsnap(await TO(c.get()))}},
    doc:p=>{const r=fs.doc(p);return{
      onSnapshot:(cb,er)=>r.onSnapshot(s=>cb(dsnap(s)),e=>er&&er(e)),
      get:async()=>dsnap(await TO(r.get())),
      set:d=>r.set(clean(d)),update:d=>r.update(clean(d)),delete:()=>r.delete()}},
    batchSet:async(items,onProg)=>{for(let i=0;i<items.length;i+=400){const b=fs.batch();items.slice(i,i+400).forEach(([p,d])=>b.set(fs.doc(p),clean(d)));await b.commit();onProg&&onProg(Math.min(i+400,items.length),items.length)}}
  };
  /* kimlik: bu cihazdaki hesap */
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(_){}
  const sha=async t=>{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(t).trim().toLowerCase()));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")};
  let aid="";try{aid=localStorage.getItem("at_acc")||""}catch(_){}
  if(!aid){aid="a"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);try{localStorage.setItem("at_acc",aid)}catch(_){}}
  let ACCS={};fs.collection("accounts").onSnapshot(q=>{ACCS={};q.docs.forEach(d=>ACCS[d.id]=d.data())},()=>{});
  const accGet=async()=>{try{const s=await TO(fs.doc("accounts/"+aid).get(),8000);return s.exists?s.data():null}catch(_){return null}};
  const USER={
    id:async()=>aid,
    isOwner:async()=>{try{const q=await TO(fs.collection("accounts").get(),10000);const L=q.docs.map(d=>({id:d.id,...d.data()}));if(!L.length)return false;
      if(window.OWNER_H){const H=await Promise.all(L.map(x=>x.email?sha(x.email):""));const k=L.findIndex((x,i)=>H[i]===window.OWNER_H);if(k>=0)return L[k].id===aid}
      let o=L.find(x=>x.owner);if(!o){try{const m=await TO(fs.doc("meta/owner").get(),8000);if(m.exists&&m.data().pending)return false}catch(_){}o=L.sort((x,y)=>(x.at||0)-(y.at||0))[0]}return o.id===aid}catch(_){const a=await accGet();return !!(a&&a.owner)}},
    name:async()=>{const a=await accGet();return a?a.name:""},
    profiles:async ids=>{const o={};(ids||[]).forEach(i=>{if(ACCS[i])o[i]={name:ACCS[i].name}});return o},
    search:async q=>{q=(q||"").toLocaleLowerCase("tr");return Object.entries(ACCS).filter(([i,a])=>i!==aid&&(a.name||"").toLocaleLowerCase("tr").includes(q)).slice(0,8).map(([i,a])=>({id:i,name:a.name}))}
  };
  const DL={save:async({filename,data})=>{const u=URL.createObjectURL(new Blob([data],{type:"text/plain;charset=utf-8"})),a=document.createElement("a");a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}};
  window.SA_setAccount=id=>{try{localStorage.setItem("at_acc",id)}catch(_){}};
  window.SA_accounts=()=>ACCS;
  window.SA_db=DB;
  /* fotoğraf: ücretsiz planda küçültülüp kaydın içine gömülür */
  const toJpeg=async(blob,max,q)=>{const b=await createImageBitmap(blob),k=Math.min(1,max/Math.max(b.width,b.height)),c=document.createElement("canvas");c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);c.getContext("2d").drawImage(b,0,0,c.width,c.height);return c.toDataURL("image/jpeg",q)};
  const ASSETS={upload:async blob=>{if(!/^image\//.test(blob.type||""))throw new Error("Bu sürümde yalnızca fotoğraf eklenebilir");
    let d=await toJpeg(blob,1280,.72);if(d.length>330000)d=await toJpeg(blob,960,.6);if(d.length>330000)d=await toJpeg(blob,720,.5);
    return{id:"i"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),contentType:"image/jpeg",d}}};
  window.claude={use:async k=>k==="db"?DB:k==="user"?USER:k==="downloads"?DL:k==="assets"?ASSETS:null};
})();
