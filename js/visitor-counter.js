// Visitor Counter — client-only active sessions tracker
// Usage: import { initVisitorCounter, setVisitorRole, renderLiveCounter } from './visitor-counter.js';

const STORAGE_KEY = 'tibbiya_active_sessions';
const SESSION_KEY = 'tibbiya_session_id';
const HEARTBEAT_MS = 5000; // heartbeat interval
const STALE_MS = 30000; // consider session stale after 30s

function read() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e){ return {}; }
}
function write(obj) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); return true; } catch(e){ return false; }
}

function getSessionId(){
  let sid = sessionStorage.getItem(SESSION_KEY);
  if(!sid){ sid = 's_' + Math.random().toString(36).slice(2,12); sessionStorage.setItem(SESSION_KEY, sid); }
  return sid;
}

let heartbeatTimer = null;
let currentRole = 'guest';

export function initVisitorCounter(role = 'guest'){
  currentRole = role;
  const sid = getSessionId();
  // register once immediately
  const now = Date.now();
  const sessions = read();
  sessions[sid] = { lastSeen: now, role: currentRole };
  write(sessions);
  // start heartbeat
  if(heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    const s = read();
    s[sid] = { lastSeen: Date.now(), role: currentRole };
    // cleanup stale
    const cutoff = Date.now() - STALE_MS;
    for(const k of Object.keys(s)){
      if(!s[k] || !s[k].lastSeen || s[k].lastSeen < cutoff) delete s[k];
    }
    write(s);
  }, HEARTBEAT_MS);

  // on unload, remove this session
  window.addEventListener('beforeunload', () => {
    try{
      const s = read(); delete s[sid]; write(s);
    }catch(e){}
  });
}

export function setVisitorRole(role){
  currentRole = role || 'guest';
  const sid = getSessionId();
  const s = read(); s[sid] = { lastSeen: Date.now(), role: currentRole }; write(s);
}

export function getActiveCounts(){
  const s = read();
  const cutoff = Date.now() - STALE_MS;
  const result = { students:0, teachers:0, admins:0, total:0 };
  for(const k of Object.keys(s)){
    const item = s[k]; if(!item || !item.lastSeen) continue;
    if(item.lastSeen < cutoff) continue;
    result.total++;
    const r = (item.role||'student').toLowerCase();
    if(r==='student') result.students++; else if(r==='teacher') result.teachers++; else if(r==='admin') result.admins++;
  }
  return result;
}

export function renderLiveCounter(elOrId){
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if(!el) return;
  function tick(){
    const c = getActiveCounts();
    el.textContent = `${c.students.toLocaleString('ar')} طالب مسجّل بالمنصة`;
  }
  tick();
  setInterval(tick, 3000);
}

// auto-init as guest so counts show even before login
initVisitorCounter('guest');
export default { initVisitorCounter, setVisitorRole, getActiveCounts, renderLiveCounter };
