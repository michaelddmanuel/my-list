// My List — no-login auto-sync layer (Supabase REST). Dormant until CONFIG is filled.
// To enable: set url + anonKey (Project Settings -> API) and a private listId.
// Table needed (run once in Supabase SQL editor):
//   create table if not exists lists (id text primary key, data jsonb, stamp int8);
//   alter table lists enable row level security;
//   create policy lists_all on lists for all using (true) with check (true);
(function(){
  "use strict";
  var CONFIG = { url:"", anonKey:"", listId:"" };

  var opts=null, timer=null, lastPush=0, started=false;
  function enabled(){ return !!(CONFIG.url && CONFIG.anonKey && CONFIG.listId); }
  function status(s){ if(opts&&opts.onStatus) opts.onStatus(s); }
  function headers(extra){
    var h={ "apikey":CONFIG.anonKey, "Authorization":"Bearer "+CONFIG.anonKey, "Content-Type":"application/json" };
    if(extra){ for(var k in extra) h[k]=extra[k]; } return h;
  }
  function pull(){
    if(!enabled()) return;
    fetch(CONFIG.url+"/rest/v1/lists?id=eq."+encodeURIComponent(CONFIG.listId)+"&select=data,stamp",{headers:headers()})
      .then(function(r){ return r.ok?r.json():[]; })
      .then(function(rows){
        status("synced");
        if(rows&&rows[0]&&opts&&opts.onRemote){ opts.onRemote({items:rows[0].data, stamp:Number(rows[0].stamp)||0}); }
      })
      .catch(function(){ status("offline"); });
  }
  function push(items, stamp){
    if(!enabled()) return; if(stamp<=lastPush) return; lastPush=stamp;
    fetch(CONFIG.url+"/rest/v1/lists",{ method:"POST",
      headers:headers({"Prefer":"resolution=merge-duplicates,return=minimal"}),
      body:JSON.stringify({ id:CONFIG.listId, data:items, stamp:stamp }) })
      .then(function(){ status("synced"); })
      .catch(function(){ status("offline"); });
  }
  window.ListSync = {
    init:function(o){ opts=o; if(!enabled()||started) return; started=true; pull(); timer=setInterval(pull, 4000);
      window.addEventListener("online", pull); document.addEventListener("visibilitychange", function(){ if(!document.hidden) pull(); }); },
    push:push
  };
})();
