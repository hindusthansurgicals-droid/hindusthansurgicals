/* Cylinder Desk — Firebase connection layer.
   Gives the app the same small database / user / downloads interface it used before,
   backed by Firebase Authentication (Google sign-in) and Cloud Firestore. */
(function(){
'use strict';
/* App version — change this on every update (all files show it). */
window.CD_VERSION='4.3.6';window.CD_BUILD='2026-10-21';

const firebaseConfig = {
  apiKey: "AIzaSyAALg0moWjoEqNGN1X8N0LpVrEWv6G96_Q",
  /* Sign-in pages served from the app's own address: phones (installed app, Safari, new Chrome)
     block sign-in when it runs on another domain ("missing initial state"). */
  authDomain: /\.web\.app$|\.firebaseapp\.com$/.test(location.hostname) ? location.hostname : "hindustha-surgicals.firebaseapp.com",
  projectId: "hindustha-surgicals",
  storageBucket: "hindustha-surgicals.firebasestorage.app",
  messagingSenderId: "1032226574990",
  appId: "1:1032226574990:web:7e8163071e3d41ddba6fdf"
};

/* The owner of the business. Must match firestore.rules. */
const OWNER_EMAILS = ['hindusthansurgicals@gmail.com', 'skmobilesdpi@gmail.com'];

/* ---------- value encoding ----------
   Firestore cannot store an array directly inside another array, which the old
   Excel history and purchase records use. Inner arrays are stored as {__j:"<json>"}
   and turned back into arrays when read. */
/* Marks a field to be removed when written (e.g. a customer merged into another). */
const DEL=Object.freeze({__cd_del:true});
function enc(v){
  if(v===DEL)return firebase.firestore.FieldValue.delete();
  if(Array.isArray(v)) return v.map(x=>Array.isArray(x)?{__j:JSON.stringify(x)}:enc(x));
  if(v&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype){
    const o={};for(const k in v){if(v[k]!==undefined)o[k]=enc(v[k])}return o;
  }
  return v;
}
function dec(v){
  if(Array.isArray(v)) return v.map(dec);
  if(v&&typeof v==='object'){
    const ks=Object.keys(v);
    if(ks.length===1&&ks[0]==='__j'&&typeof v.__j==='string'){try{return JSON.parse(v.__j)}catch(e){return []}}
    const o={};for(const k of ks)o[k]=dec(v[k]);return o;
  }
  return v;
}

/* ---------- error codes the app understands ---------- */
function mapErr(e){
  const c=e&&e.code||'';
  const code=c==='permission-denied'?'invalid_argument':c==='resource-exhausted'?'quota_exceeded':c==='unauthenticated'?'revoked':c||'error';
  const x=new Error(e&&e.message||code);x.code=code;x.cause=e;return x;
}
const wrapP=p=>p.catch(e=>{throw mapErr(e)});

/* ---------- cloud sync status ----------
   Every write is counted until Firebase's server confirms it. Offline, the write is kept on this
   device (and uploaded when the connection returns), so the app does not wait more than 1.5 s. */
const sync={pending:0,lastOk:null,err:null,errAt:null,online:navigator.onLine};
const emit=()=>window.dispatchEvent(new CustomEvent('cd-sync',{detail:Object.assign({},sync)}));
function track(p){
  sync.pending++;emit();
  const done=p.then(r=>{sync.pending--;sync.lastOk=Date.now();if(!sync.pending)sync.err=null;emit();return r},
    e=>{sync.pending--;const x=mapErr(e);sync.err=x.code;sync.errAt=Date.now();emit();window.dispatchEvent(new CustomEvent('cd-sync-error',{detail:x}));throw x});
  done.catch(()=>{});
  return Promise.race([done,new Promise(r=>setTimeout(()=>r('queued'),1500))]);
}
window.addEventListener('online',()=>{sync.online=true;emit()});
window.addEventListener('offline',()=>{sync.online=false;emit()});
window.addEventListener('beforeunload',e=>{if(sync.pending>0){e.preventDefault();e.returnValue='Some entries are still being saved to the cloud.';return e.returnValue}});

/* ---------- snapshot / ref wrappers ---------- */
function docSnap(s){
  return {id:s.id,exists:s.exists,data:()=>{const d=s.data();return d===undefined?undefined:dec(d)}};
}
function querySnap(q){
  const docs=q.docs.map(docSnap);
  return {docs,empty:docs.length===0,size:docs.length,forEach:f=>docs.forEach(f)};
}
function docRef(r){
  return {
    id:r.id,
    get:()=>wrapP(r.get()).then(docSnap),
    set:(data,opts)=>track(r.set(enc(data),opts||{})),
    /* The app's update merges nested fields (deep merge) and creates the
       document if needed; Firestore set+merge does exactly that. */
    update:data=>track(r.set(enc(data),{merge:true})),
    delete:()=>track(r.delete()),
    onSnapshot:(next,err)=>r.onSnapshot(s=>next(docSnap(s)),e=>err&&err(mapErr(e)))
  };
}
function query(q){
  return {
    where:(f,op,v)=>query(q.where(f,op,v)),
    orderBy:(f,d)=>query(q.orderBy(f,d)),
    limit:n=>query(q.limit(n)),
    get:()=>wrapP(q.get()).then(querySnap),
    onSnapshot:(next,err)=>q.onSnapshot(s=>next(querySnap(s)),e=>err&&err(mapErr(e))),
    doc:id=>docRef(q.doc(id))
  };
}

/* ---------- start Firebase ---------- */
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const fs=firebase.firestore();
try{fs.settings({ignoreUndefinedProperties:true,merge:true})}catch(e){}
/* Keep a copy on the device so the app opens fast and works through short network drops. */
const persist=fs.enablePersistence({synchronizeTabs:true}).catch(()=>{});

const db={collection:p=>query(fs.collection(p)),doc:p=>docRef(fs.doc(p))};
/* coming back from a Google Drive permission page (redirect on phones): keep the key */
auth.getRedirectResult().then(r=>{const t=r&&r.credential&&r.credential.accessToken;if(t&&r.user){try{sessionStorage.setItem('cd-drive',JSON.stringify({t,exp:Date.now()+50*60e3,uid:r.user.uid}));sessionStorage.removeItem('cd-drive-wait')}catch(e){}}}).catch(()=>{});

/* ---------- sign-in screen ---------- */
function signInScreen(msg){
  let el=document.getElementById('fb-signin');
  if(!el){
    el=document.createElement('div');el.id='fb-signin';
    el.setAttribute('style','position:fixed;inset:0;z-index:100;background:var(--bg,#F2F5F3);display:grid;place-items:center;padding:16px');
    document.body.appendChild(el);
  }
  el.innerHTML=`<div class="panel" style="max-width:420px;width:100%;text-align:center;padding:28px 22px">
    <div class="brand-mark" style="margin:0 auto 14px;width:64px;height:64px;border-radius:14px;background:#fff;border:1px solid #ddd;overflow:hidden"><img src="icon.svg?v=${window.CD_VERSION}" alt="" style="width:100%;height:100%"></div>
    <h2 style="font:800 22px var(--f-display,sans-serif);margin:0 0 6px">HSAP Cylinder Desk</h2>
    <p class="muted" style="margin:0 0 18px">Sign in with your Google account to continue.<br>தொடர உங்கள் Google கணக்கில் உள்நுழையவும்.</p>
    <button class="btn primary" id="fb-go" style="width:100%;padding:11px">Sign in with Google</button>
    ${msg?`<p class="small" style="color:var(--crit,#B3261E);margin:12px 0 0">${msg}</p>`:''}
  </div>`;
  el.querySelector('#fb-go').onclick=async()=>{
    const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
    try{await auth.signInWithPopup(p)}
    catch(e){
      if(e&&(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'))return auth.signInWithRedirect(p);
      if(e&&e.code==='auth/popup-closed-by-user')return;
      signInScreen('Sign-in failed ('+(e&&e.code||'error')+'). Try again.');
    }
  };
}

let resolveUser;const userReady=new Promise(r=>resolveUser=r);
let firstUid=null;
auth.getRedirectResult().catch(e=>signInScreen('Sign-in failed ('+(e&&e.code||'error')+').'));
auth.onAuthStateChanged(async u=>{
  if(!u){
    if(firstUid){location.reload();return}   // signed out: start clean
    signInScreen();return;
  }
  if(firstUid&&firstUid!==u.uid){location.reload();return}
  firstUid=u.uid;
  const el=document.getElementById('fb-signin');if(el)el.remove();
  const email=(u.email||'').toLowerCase();
  const me={id:u.uid,name:u.displayName||email||'You',email,avatarUrl:u.photoURL||'',
    isOwner:!!u.emailVerified&&OWNER_EMAILS.includes(email)};
  await persist;
  /* Save this person's name so the owner can recognise them in Settings. */
  try{
    const ref=fs.doc('profiles/'+u.uid);const s=await ref.get();const d=s.exists?s.data():{};
    if(d.name!==me.name||d.email!==email||d.photo!==me.avatarUrl)await ref.set({name:me.name,email,photo:me.avatarUrl},{merge:true});
  }catch(e){console.warn(e)}
  resolveUser(me);
});

const profileCache={};
const user={
  me:()=>userReady,
  profiles:async ids=>{
    const out={};
    await Promise.all(ids.map(async id=>{
      if(profileCache[id]){out[id]=profileCache[id];return}
      try{const s=await fs.doc('profiles/'+id).get();if(s.exists){const d=s.data();
        profileCache[id]=out[id]={name:d.email&&d.name!==d.email?d.name+' ('+d.email+')':(d.name||d.email),avatarUrl:d.photo||''}}}catch(e){}
    }));
    return out;
  }
};

/* ---------- downloads: an ordinary browser download ---------- */
const MIME={pdf:'application/pdf',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',csv:'text/csv',json:'application/json',txt:'text/plain'};
const dl={save:async({filename,data})=>{
  const ext=(filename.split('.').pop()||'').toLowerCase();
  const blob=data instanceof Blob?data:new Blob([data],{type:MIME[ext]||'application/octet-stream'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}};

/* ---------- full backup (same format import.html restores) ---------- */
/* The security rules allow the two settings documents to be read one by one, not the whole folder,
   so settings are read by name; every other folder is read whole. members/profiles are optional. */
const BACKUP_COLS=['settings','cust','cyl','hist','log','bill','trade','reg','fill','dealers','lpur','pday','rdoc','insp','att','logins','loc','members','profiles'];
const SETTINGS_DOCS=['company','roles'];
async function backupAll(source,opts){
  const o=source?{source}:undefined;const out={};const missing=[];
  for(const c of BACKUP_COLS){
    if(opts&&opts.skip&&opts.skip.includes(c))continue;
    try{
      if(c==='settings'){for(const id of SETTINGS_DOCS){const d=await fs.doc('settings/'+id).get(o);if(d.exists){(out.settings=out.settings||{})[id]=dec(d.data())}}}
      else{const q=await fs.collection(c).get(o);if(!q.docs.length)continue;out[c]={};q.docs.forEach(d=>{out[c][d.id]=dec(d.data())})}
    }catch(e){console.warn('backup',c,e);missing.push(c);if(e&&e.code==='unavailable'&&source==='server')throw mapErr(e)}
  }
  const must=['cust','cyl','hist','log'];
  if(missing.some(c=>must.includes(c))){const x=new Error('Could not read: '+missing.join(', '));x.code='incomplete';x.missing=missing;throw x}
  out._backup={app:'Cylinder Desk',version:window.CD_VERSION||'',at:new Date().toISOString(),project:firebaseConfig.projectId,missing};
  return out;
}

window.FBC={
  use:async name=>{
    if(name==='user'){await userReady;return user}
    if(name==='db'){await userReady;return db}
    if(name==='downloads')return dl;
    return null;
  },
  signOut:()=>auth.signOut(),
  /* Google Drive access for document scans (only files this app makes: drive.file).
     Asks the signed-in Google account once; the key lasts about an hour. */
  driveToken:async force=>{
    try{const c=JSON.parse(sessionStorage.getItem('cd-drive')||'null');if(!force&&c&&c.exp>Date.now()&&c.uid===(auth.currentUser&&auth.currentUser.uid))return c.t}catch(e){}
    const u=auth.currentUser;if(!u)throw {code:'unauthenticated'};
    const p=new firebase.auth.GoogleAuthProvider();p.addScope('https://www.googleapis.com/auth/drive.file');p.setCustomParameters({login_hint:u.email||''});
    let r;try{r=await u.reauthenticateWithPopup(p)}
    catch(e){if(e&&(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'||e.code==='auth/web-storage-unsupported')){try{sessionStorage.setItem('cd-drive-wait','1')}catch(x){}await u.reauthenticateWithRedirect(p);return new Promise(()=>{})}throw e}
    const t=r&&r.credential&&r.credential.accessToken;if(!t)throw {code:'no-token'};
    try{sessionStorage.setItem('cd-drive',JSON.stringify({t,exp:Date.now()+50*60e3,uid:u.uid}))}catch(e){}
    return t},
  ownerEmails:()=>OWNER_EMAILS.slice(),
  sync:()=>Object.assign({},sync),
  DEL,
  backupAll,
  /* what the Firebase server itself holds (not this device's copy) */
  serverData:()=>backupAll('server',{skip:['members','profiles']}),
  waitForSync:()=>fs.waitForPendingWrites(),
  /* used by the one-time import page */
  _raw:{fs,auth,enc,dec,userReady,OWNER_EMAILS}
};
})();
