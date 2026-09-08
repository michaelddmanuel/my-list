// My List — auto-sync via Google Firebase Realtime Database (REST, no app login).
// The database URL is NOT stored in this public file. You turn sync on by opening
// the app once per device with ?sync=<your-database-URL> (I hand you that link + a QR).
// It's saved in this browser's local storage; the shared list lives at /lists/main.
(function(){
  "use strict";
  var LID = "board";
  var CFG_KEY = "list_sync_cfg";
  var justSet = false;
  function getCfg(){ try{ return JSON.parse(localStorage.getItem(CFG_KEY) || "null"); } catch(e){ return null; } }
  function setCfg(c){ try{ localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch(e){} }

  // one-time setup: open with ?sync=<databaseURL> -> saved to this device, then the address bar is cleaned
  try{
    var qs = new URLSearchParams(location.search);
    var s = qs.get("sync");
    if(s){
      setCfg({ dbUrl: s.replace(/\/+$/,"") });
      justSet = true;
      qs.delete("sync");
      var rest = qs.toString();
      history.replaceState(null, "", location.pathname + (rest ? "?"+rest : "") + location.hash);
    }
  }catch(e){}

  var cfg = getCfg();
  var opts=null, timer=null, lastPush=0, started=false;
  function enabled(){ return !!(cfg && cfg.dbUrl); }
  function status(s){ if(opts && opts.onStatus) opts.onStatus(s); }
  function url(){ return cfg.dbUrl + "/lists/" + LID + ".json"; }

  function pull(){
    if(!enabled()) return;
    fetch(url()).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(o){ status("synced"); if(o && opts && opts.onRemote){ opts.onRemote({ data:(o.data||null), stamp:(Number(o.stamp)||0) }); } })
      .catch(function(){ status("offline"); });
  }
  function push(data, stamp){
    if(!enabled()) return; if(stamp <= lastPush) return; lastPush = stamp;
    fetch(url(), { method:"PUT", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ data:data, stamp:stamp }) })
      .then(function(){ status("synced"); })
      .catch(function(){ status("offline"); });
  }
  window.ListSync = {
    init:function(o){ opts=o; if(!enabled()){ status(""); return; } if(started) return; started=true; status("sync on");
      pull(); timer=setInterval(pull, 4000); window.addEventListener("online", pull);
      document.addEventListener("visibilitychange", function(){ if(!document.hidden) pull(); }); },
    push:push,
    configured:function(){ return enabled(); },
    justConfigured:function(){ return justSet; }
  };
})();
