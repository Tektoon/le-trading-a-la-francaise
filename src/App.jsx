import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const timeAgo = (ts) => {
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60) return "À l'instant";
  if (d < 3600) return `${Math.floor(d/60)}min`;
  if (d < 86400) return `${Math.floor(d/3600)}h`;
  return `${Math.floor(d/86400)}j`;
};

const ACCENT   = "#2563eb";
const TRICOLOR = ["#002395","#FFFFFF","#ED2939"];
const AVATAR_COLORS = ["#2563eb","#16a34a","#dc2626","#9333ea","#ea580c","#0891b2"];

const avatarColor = (name) => AVATAR_COLORS[(name||"?").charCodeAt(0) % AVATAR_COLORS.length];

/* ─────────────────────────────────────────────
   TINY SHARED COMPONENTS
───────────────────────────────────────────── */
function Avatar({ username, size=38, color }) {
  const c = color || avatarColor(username);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`${c}22`,
      border:`2px solid ${c}55`, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.4, fontWeight:700, color:c, flexShrink:0, fontFamily:"Inter,sans-serif" }}>
      {(username||"?")[0].toUpperCase()}
    </div>
  );
}

function FlagStripe() {
  return (
    <div style={{ display:"flex", height:3, borderRadius:99, overflow:"hidden", width:36 }}>
      {TRICOLOR.map((c,i) => <div key={i} style={{ flex:1, background:c }}/>)}
    </div>
  );
}

function Tag({ label, color="#2563eb" }) {
  return (
    <span style={{ padding:"2px 9px", borderRadius:99, fontSize:11, fontWeight:600,
      background:`${color}18`, color, border:`1px solid ${color}35`, fontFamily:"Inter,sans-serif" }}>
      {label}
    </span>
  );
}

function Spinner() {
  return <div style={{ color:"#555", textAlign:"center", padding:40, fontSize:13 }}>Chargement…</div>;
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px", color:"#3a3a3a" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:14 }}>{text}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AUTH SCREEN
───────────────────────────────────────────── */
function AuthScreen() {
  const [mode,setMode]     = useState("login");
  const [email,setEmail]   = useState("");
  const [pass,setPass]     = useState("");
  const [pseudo,setPseudo] = useState("");
  const [loading,setLoad]  = useState(false);
  const [msg,setMsg]       = useState(null);

  const handle = async () => {
    setLoad(true); setMsg(null);
    try {
      if (mode==="signup") {
        if (!pseudo.trim()) throw new Error("Choisis un pseudo");
        const { data, error } = await supabase.auth.signUp({ email, password:pass, options:{ data:{ username:pseudo.trim() } } });
        if (error) throw error;
        if (data.user) await supabase.from("profiles").upsert({ id:data.user.id, username:pseudo.trim(), bio:"", avatar_color:AVATAR_COLORS[Math.floor(Math.random()*6)] });
        setMsg({ ok:true, text:"Compte créé ! Vérifie ton email puis connecte-toi." });
      } else if (mode==="reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMsg({ ok:true, text:"Email envoyé !" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password:pass });
        if (error) throw error;
      }
    } catch(e) { setMsg({ ok:false, text:e.message }); }
    setLoad(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060810", display:"flex", alignItems:"center",
      justifyContent:"center", fontFamily:"Inter,sans-serif", padding:16 }}>
      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(ellipse at 30% 20%, rgba(37,99,235,0.07) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(237,41,57,0.05) 0%, transparent 60%)", pointerEvents:"none" }}/>
      <div style={{ width:"100%", maxWidth:420, position:"relative" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#002395,#ED2939)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>🇫🇷</div>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:20, fontWeight:900, color:"#f0f0f0", letterSpacing:"-0.5px", lineHeight:1.1 }}>Le Trading</div>
              <div style={{ fontSize:20, fontWeight:900, color:"#f0f0f0", letterSpacing:"-0.5px", lineHeight:1.1 }}>à la Française</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:"#3a3a3a", letterSpacing:"0.15em", textTransform:"uppercase" }}>La communauté des traders français</div>
        </div>

        <div style={A.card}>
          <div style={{ fontWeight:700, fontSize:16, color:"#f0f0f0", marginBottom:24, textAlign:"center" }}>
            {mode==="login"?"Connexion":mode==="signup"?"Créer un compte":"Mot de passe oublié"}
          </div>
          {mode==="signup"&&<><label style={A.lbl}>Pseudo</label><input value={pseudo} onChange={e=>setPseudo(e.target.value)} style={{ ...A.inp,marginBottom:12 }} placeholder="ex: TradeurParis"/></>}
          <label style={A.lbl}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{ ...A.inp,marginBottom:12 }} placeholder="toi@email.com" onKeyDown={e=>e.key==="Enter"&&handle()}/>
          {mode!=="reset"&&<><label style={A.lbl}>Mot de passe</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} style={{ ...A.inp,marginBottom:16 }} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()}/></>}
          {msg&&<div style={{ padding:"10px 12px",borderRadius:8,marginBottom:14,fontSize:12,background:msg.ok?"rgba(37,99,235,0.1)":"rgba(237,41,57,0.1)",color:msg.ok?"#60a5fa":"#f87171",border:`1px solid ${msg.ok?"rgba(37,99,235,0.3)":"rgba(237,41,57,0.3)"}` }}>{msg.text}</div>}
          <button onClick={handle} disabled={loading} style={{ ...A.btnPrimary,width:"100%",justifyContent:"center",opacity:loading?0.6:1 }}>
            {loading?"…":mode==="login"?"Se connecter":mode==="signup"?"Créer mon compte":"Envoyer"}
          </button>
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:18,textAlign:"center" }}>
            {mode!=="signup"&&<button onClick={()=>{setMode("signup");setMsg(null);}} style={A.linkBtn}>Pas de compte ? Rejoindre la communauté</button>}
            {mode!=="login"&&<button onClick={()=>{setMode("login");setMsg(null);}} style={A.linkBtn}>Déjà un compte ? Se connecter</button>}
            {mode==="login"&&<button onClick={()=>{setMode("reset");setMsg(null);}} style={{ ...A.linkBtn,color:"#333" }}>Mot de passe oublié</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FEED — ANALYSES
───────────────────────────────────────────── */
function AnalyseCard({ post, currentUserId, onLike, onDelete }) {
  const [showFull, setShowFull] = useState(false);
  const isOwn = post.user_id === currentUserId;
  const dirColor = post.direction==="LONG"?"#16a34a":post.direction==="SHORT"?"#dc2626":"#555";

  return (
    <div style={A.card}>
      {/* header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <Avatar username={post.profiles?.username} color={post.profiles?.avatar_color}/>
          <div>
            <div style={{ fontWeight:700, color:"#e8e8e8", fontSize:14 }}>{post.profiles?.username||"Anonyme"}</div>
            <div style={{ fontSize:11, color:"#444", marginTop:2 }}>{timeAgo(post.created_at)}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {post.instrument&&<Tag label={post.instrument} color="#2563eb"/>}
          {post.timeframe&&<Tag label={post.timeframe} color="#6366f1"/>}
          {post.direction&&<Tag label={post.direction} color={dirColor}/>}
        </div>
      </div>

      {/* title */}
      <div style={{ fontWeight:700, fontSize:16, color:"#f0f0f0", marginBottom:8, lineHeight:1.4 }}>{post.title}</div>

      {/* body */}
      <div style={{ fontSize:13, color:"#888", lineHeight:1.7, marginBottom:12,
        maxHeight: showFull?"none":"80px", overflow:"hidden", position:"relative" }}>
        {post.body}
        {!showFull&&post.body?.length>200&&(
          <div style={{ position:"absolute",bottom:0,left:0,right:0,height:40,
            background:"linear-gradient(transparent,#0e1118)" }}/>
        )}
      </div>
      {post.body?.length>200&&(
        <button onClick={()=>setShowFull(f=>!f)} style={{ ...A.linkBtn,marginBottom:12,fontSize:12 }}>
          {showFull?"Réduire ▲":"Lire la suite ▼"}
        </button>
      )}

      {/* image */}
      {post.image_url&&(
        <div style={{ borderRadius:10, overflow:"hidden", marginBottom:12, border:"1px solid rgba(255,255,255,0.06)" }}>
          <img src={post.image_url} alt="analyse" style={{ width:"100%", display:"block", maxHeight:340, objectFit:"cover" }}/>
        </div>
      )}

      {/* pine script */}
      {post.pine_script&&(
        <div style={{ background:"#060810", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:14, marginBottom:12, fontFamily:"'JetBrains Mono','Courier New',monospace", fontSize:12, color:"#a3e635", overflowX:"auto", maxHeight:160, overflow:"auto" }}>
          <div style={{ fontSize:10, color:"#444", marginBottom:8, fontFamily:"Inter,sans-serif" }}>PINE SCRIPT</div>
          <pre style={{ margin:0, whiteSpace:"pre-wrap" }}>{post.pine_script}</pre>
        </div>
      )}

      {/* footer */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:4 }}>
        <div style={{ display:"flex", gap:16 }}>
          <button onClick={()=>onLike(post.id, post.user_liked)}
            style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center",
              gap:5, color:post.user_liked?"#f87171":"#555", fontSize:13, fontFamily:"inherit", padding:0 }}>
            <span style={{ fontSize:17 }}>{post.user_liked?"♥":"♡"}</span>
            <span>{post.like_count||0}</span>
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:5, color:"#555", fontSize:13 }}>
            <span>💬</span><span>{post.comment_count||0}</span>
          </div>
        </div>
        {isOwn&&(
          <button onClick={()=>onDelete(post.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:12,fontFamily:"inherit",padding:0 }}>
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

function FeedView({ session, profile }) {
  const [posts,setPosts]         = useState([]);
  const [loading,setLoading]     = useState(true);
  const [showForm,setShowForm]   = useState(false);
  const [filter,setFilter]       = useState({ instrument:"", direction:"" });
  const [form,setForm]           = useState({ title:"", body:"", instrument:"", timeframe:"", direction:"", image_url:"", pine_script:"" });
  const [posting,setPosting]     = useState(false);
  const [tab,setTab]             = useState("all"); // all | mine

  const INSTRUMENTS = ["","EUR/USD","GBP/USD","BTC/USD","ETH/USD","SPX500","NAS100","GOLD","DAX","CAC40","OIL"];
  const TIMEFRAMES  = ["","1M","5M","15M","1H","4H","1D","1W"];
  const DIRECTIONS  = ["","LONG","SHORT","NEUTRE"];

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("analyses")
      .select("*, profiles(username,avatar_color), likes(user_id)")
      .order("created_at",{ ascending:false });
    if (filter.instrument) q = q.eq("instrument", filter.instrument);
    if (filter.direction)  q = q.eq("direction",  filter.direction);
    if (tab==="mine") q = q.eq("user_id", session.user.id);
    const { data } = await q;
    if (data) {
      const enriched = data.map(p=>({
        ...p,
        like_count:   p.likes?.length||0,
        user_liked:   p.likes?.some(l=>l.user_id===session.user.id)||false,
        comment_count:0,
      }));
      setPosts(enriched);
    }
    setLoading(false);
  },[filter,tab,session]);

  useEffect(()=>{ load(); },[load]);

  const submitPost = async () => {
    if (!form.title.trim()||!form.body.trim()) return;
    setPosting(true);
    await supabase.from("analyses").insert({
      user_id:session.user.id, title:form.title.trim(), body:form.body.trim(),
      instrument:form.instrument||null, timeframe:form.timeframe||null,
      direction:form.direction||null, image_url:form.image_url||null,
      pine_script:form.pine_script||null,
    });
    setForm({ title:"",body:"",instrument:"",timeframe:"",direction:"",image_url:"",pine_script:"" });
    setShowForm(false); setPosting(false); load();
  };

  const toggleLike = async (postId, liked) => {
    if (liked) {
      await supabase.from("likes").delete().eq("post_id",postId).eq("user_id",session.user.id);
    } else {
      await supabase.from("likes").insert({ post_id:postId, user_id:session.user.id });
    }
    load();
  };

  const deletePost = async (id) => {
    await supabase.from("analyses").delete().eq("id",id);
    load();
  };

  return (
    <div>
      {/* top bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, gap:10, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:8 }}>
          {["all","mine"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ ...A.pill, ...(tab===t?A.pillActive:{}) }}>
              {t==="all"?"Toutes les analyses":"Mes analyses"}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowForm(true)} style={A.btnPrimary}>
          <span style={{ fontSize:18,lineHeight:1 }}>+</span> Publier une analyse
        </button>
      </div>

      {/* filters */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {[{ k:"instrument",opts:INSTRUMENTS,label:"Instrument" },{ k:"direction",opts:DIRECTIONS,label:"Direction" }].map(f=>(
          <select key={f.k} value={filter[f.k]} onChange={e=>setFilter({...filter,[f.k]:e.target.value})} style={A.select}>
            <option value="">{f.label}</option>
            {f.opts.filter(Boolean).map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {(filter.instrument||filter.direction)&&(
          <button onClick={()=>setFilter({ instrument:"",direction:"" })} style={{ ...A.pill,color:"#f87171",borderColor:"rgba(248,113,113,0.3)" }}>✕ Reset</button>
        )}
      </div>

      {/* posts */}
      {loading ? <Spinner/> : posts.length===0
        ? <EmptyState icon="📊" text="Aucune analyse pour l'instant. Sois le premier !"/>
        : <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            {posts.map(p=><AnalyseCard key={p.id} post={p} currentUserId={session.user.id} onLike={toggleLike} onDelete={deletePost}/>)}
          </div>
      }

      {/* post form modal */}
      {showForm&&(
        <div style={A.overlay} onClick={()=>setShowForm(false)}>
          <div style={{ ...A.modal,maxWidth:600 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontWeight:800,fontSize:18,color:"#f0f0f0" }}>Nouvelle analyse</div>
              <button onClick={()=>setShowForm(false)} style={{ background:"none",border:"none",color:"#555",fontSize:22,cursor:"pointer" }}>✕</button>
            </div>

            <label style={A.lbl}>Titre *</label>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{ ...A.inp,marginBottom:12 }} placeholder="ex: BTC/USD — Setup haussier sur H4"/>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12 }}>
              {[{ k:"instrument",opts:INSTRUMENTS,l:"Instrument" },{ k:"timeframe",opts:TIMEFRAMES,l:"Timeframe" },{ k:"direction",opts:DIRECTIONS,l:"Biais" }].map(f=>(
                <div key={f.k}>
                  <label style={A.lbl}>{f.l}</label>
                  <select value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} style={A.inp}>
                    {f.opts.map(o=><option key={o} value={o}>{o||`— ${f.l} —`}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <label style={A.lbl}>Analyse *</label>
            <textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})}
              style={{ ...A.inp,height:120,resize:"vertical",marginBottom:12 }} placeholder="Décris ton analyse, tes niveaux clés, ta stratégie…"/>

            <label style={A.lbl}>URL d'image (optionnel)</label>
            <input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}
              style={{ ...A.inp,marginBottom:12 }} placeholder="https://i.imgur.com/... ou lien TradingView"/>

            <label style={A.lbl}>Code Pine Script (optionnel)</label>
            <textarea value={form.pine_script} onChange={e=>setForm({...form,pine_script:e.target.value})}
              style={{ ...A.inp,height:80,resize:"vertical",marginBottom:16,fontFamily:"'JetBrains Mono','Courier New',monospace",fontSize:12 }} placeholder="//@version=5&#10;indicator(...)"/>

            <button onClick={submitPost} disabled={posting||!form.title.trim()||!form.body.trim()}
              style={{ ...A.btnPrimary,width:"100%",justifyContent:"center",opacity:(posting||!form.title.trim()||!form.body.trim())?0.5:1 }}>
              {posting?"Publication…":"Publier l'analyse"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHAT
───────────────────────────────────────────── */
function ChatView({ session, profile }) {
  const [messages,setMessages] = useState([]);
  const [text,setText]         = useState("");
  const [loading,setLoading]   = useState(true);
  const ROOMS_LIST = [{ id:"general",label:"🇫🇷 Général" },{ id:"analyses",label:"📊 Analyses" },{ id:"scalping",label:"⚡ Scalping" },{ id:"crypto",label:"₿ Crypto" }];
  const [room,setRoom]         = useState("general");
  const bottomRef              = useRef(null);
  const roomRef                = useRef("general");

  useEffect(()=>{ roomRef.current = room; },[room]);

  const loadMessages = useCallback(async (currentRoom) => {
    const r = currentRoom || roomRef.current;
    setLoading(true);
    // Charger les messages
    const { data: msgs } = await supabase.from("messages")
      .select("*")
      .eq("room", r)
      .order("created_at",{ ascending:true })
      .limit(80);
    if (!msgs) { setLoading(false); return; }
    // Charger les profils séparément
    const userIds = [...new Set(msgs.map(m=>m.user_id))];
    const { data: profs } = await supabase.from("profiles")
      .select("id,username,avatar_color")
      .in("id", userIds);
    const profMap = {};
    (profs||[]).forEach(p=>{ profMap[p.id]=p; });
    const enriched = msgs.map(m=>({ ...m, profiles: profMap[m.user_id]||null }));
    setMessages(enriched);
    setLoading(false);
    setTimeout(()=>bottomRef.current?.scrollIntoView({ behavior:"smooth" }),100);
  },[]);

  // Charger à l'arrivée et à chaque changement de salon
  useEffect(()=>{ loadMessages(room); },[room]);

  // Recharger quand l'app revient au premier plan (mobile)
  useEffect(()=>{
    const onVisible = () => { if (document.visibilityState === "visible") loadMessages(roomRef.current); };
    document.addEventListener("visibilitychange", onVisible);
    return ()=>document.removeEventListener("visibilitychange", onVisible);
  },[]);

  useEffect(()=>{
    const ch = supabase.channel(`chat-${room}-${Date.now()}`)
      .on("postgres_changes",{ event:"INSERT",schema:"public",table:"messages" }, payload=>{
        if (payload.new.room !== roomRef.current) return;
        supabase.from("profiles").select("username,avatar_color").eq("id",payload.new.user_id).single()
          .then(({ data:prof })=>{
            if (payload.new.room === roomRef.current) setMessages(m=>[...m,{ ...payload.new,profiles:prof }]);
            setTimeout(()=>bottomRef.current?.scrollIntoView({ behavior:"smooth" }),50);
          });
      }).subscribe();
    return ()=>supabase.removeChannel(ch);
  },[room]);

  const send = async () => {
    const t = text.trim(); if (!t) return;
    setText("");
    await supabase.from("messages").insert({ user_id:session.user.id, room, content:t });
  };

  const isMe = (msg) => msg.user_id === session.user.id;

  return (
    <div style={{ display:"flex", gap:0, height:"calc(100vh - 80px)" }}>
      {/* room list */}
      <div style={{ width:160, flexShrink:0, paddingRight:12, borderRight:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize:10,color:"#444",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12,paddingLeft:4 }}>Salons</div>
        {ROOMS_LIST.map(r=>(
          <button key={r.id} onClick={()=>setRoom(r.id)} style={{ ...A.navBtn,width:"100%",marginBottom:2,
            ...(room===r.id?{ background:"rgba(37,99,235,0.12)",color:"#60a5fa" }:{}) }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* messages */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", paddingLeft:16 }}>
        <div style={{ flex:1, overflowY:"auto", paddingBottom:8 }}>
          {loading ? <Spinner/> : messages.length===0
            ? <EmptyState icon="💬" text="Aucun message. Lance la conversation !"/>
            : messages.map((msg,i)=>{
                const me = isMe(msg);
                const showAvatar = !me && (i===0 || messages[i-1]?.user_id !== msg.user_id);
                return (
                  <div key={msg.id} style={{ display:"flex", justifyContent:me?"flex-end":"flex-start",
                    marginBottom:3, alignItems:"flex-end", gap:8 }}>
                    {!me&&(
                      <div style={{ width:30, flexShrink:0 }}>
                        {showAvatar&&<Avatar username={msg.profiles?.username} color={msg.profiles?.avatar_color} size={30}/>}
                      </div>
                    )}
                    <div style={{ maxWidth:"72%" }}>
                      {!me&&showAvatar&&<div style={{ fontSize:11,color:"#555",marginBottom:3,paddingLeft:2 }}>{msg.profiles?.username||"Anonyme"}</div>}
                      <div style={{ padding:"9px 13px", borderRadius: me?"14px 14px 4px 14px":"14px 14px 14px 4px",
                        background: me?"#1d4ed8":"#151820",
                        color: me?"#fff":"#d0d0d0", fontSize:13, lineHeight:1.5,
                        border: me?"none":"1px solid rgba(255,255,255,0.06)" }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize:10,color:"#333",marginTop:3,textAlign:me?"right":"left",paddingLeft:2 }}>{timeAgo(msg.created_at)}</div>
                    </div>
                  </div>
                );
              })
          }
          <div ref={bottomRef}/>
        </div>

        {/* input */}
        <div style={{ display:"flex", gap:10, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <input value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            style={{ ...A.inp,flex:1,marginBottom:0 }} placeholder={`Message dans ${ROOMS_LIST.find(r=>r.id===room)?.label}…`}/>
          <button onClick={send} disabled={!text.trim()}
            style={{ ...A.btnPrimary,padding:"10px 18px",opacity:text.trim()?1:0.4 }}>Envoyer</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INDICATEURS
───────────────────────────────────────────── */
function IndicatorCard({ ind, currentUserId, onDelete }) {
  const [open,setOpen] = useState(false);
  const isOwn = ind.user_id === currentUserId;
  const typeColors = { "Pine Script":"#a3e635","Fichier":"#fb923c","Description":"#60a5fa" };
  const c = typeColors[ind.type]||"#888";

  return (
    <div style={A.card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <Avatar username={ind.profiles?.username} color={ind.profiles?.avatar_color}/>
          <div>
            <div style={{ fontWeight:700,fontSize:14,color:"#f0f0f0" }}>{ind.name}</div>
            <div style={{ fontSize:11,color:"#444",marginTop:2 }}>{ind.profiles?.username} · {timeAgo(ind.created_at)}</div>
          </div>
        </div>
        <Tag label={ind.type||"Indicateur"} color={c}/>
      </div>

      <div style={{ fontSize:13,color:"#888",lineHeight:1.6,marginBottom:12 }}>{ind.description}</div>

      {ind.image_url&&(
        <div style={{ borderRadius:10,overflow:"hidden",marginBottom:12,border:"1px solid rgba(255,255,255,0.06)" }}>
          <img src={ind.image_url} alt="indicateur" style={{ width:"100%",display:"block",maxHeight:280,objectFit:"cover" }}/>
        </div>
      )}

      {ind.pine_script&&(
        <div>
          <button onClick={()=>setOpen(o=>!o)} style={{ ...A.linkBtn,marginBottom:8,fontSize:12 }}>
            {open?"▲ Masquer le code":"▼ Voir le code Pine Script"}
          </button>
          {open&&(
            <div style={{ background:"#060810",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:14,fontFamily:"'JetBrains Mono','Courier New',monospace",fontSize:12,color:"#a3e635",overflowX:"auto",maxHeight:240,overflow:"auto" }}>
              <pre style={{ margin:0,whiteSpace:"pre-wrap" }}>{ind.pine_script}</pre>
            </div>
          )}
        </div>
      )}

      {ind.file_url&&(
        <a href={ind.file_url} target="_blank" rel="noreferrer"
          style={{ display:"inline-flex",alignItems:"center",gap:6,marginTop:8,padding:"8px 14px",borderRadius:8,background:"rgba(251,146,60,0.1)",color:"#fb923c",border:"1px solid rgba(251,146,60,0.3)",fontSize:13,textDecoration:"none",fontWeight:600 }}>
          📥 Télécharger le fichier
        </a>
      )}

      {isOwn&&(
        <div style={{ marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={()=>onDelete(ind.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:12,fontFamily:"inherit",padding:0 }}>Supprimer</button>
        </div>
      )}
    </div>
  );
}

function IndicateursView({ session }) {
  const [inds,setInds]       = useState([]);
  const [loading,setLoading] = useState(true);
  const [showForm,setShow]   = useState(false);
  const [form,setForm]       = useState({ name:"",description:"",type:"Pine Script",pine_script:"",image_url:"",file_url:"" });
  const [posting,setPost]    = useState(false);
  const TYPES = ["Pine Script","Fichier","Description"];

  const load = useCallback(async()=>{
    setLoading(true);
    const { data } = await supabase.from("indicators").select("*, profiles(username,avatar_color)").order("created_at",{ ascending:false });
    if (data) setInds(data);
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const submit = async () => {
    if (!form.name.trim()||!form.description.trim()) return;
    setPost(true);
    await supabase.from("indicators").insert({ user_id:session.user.id, name:form.name.trim(), description:form.description.trim(), type:form.type, pine_script:form.pine_script||null, image_url:form.image_url||null, file_url:form.file_url||null });
    setForm({ name:"",description:"",type:"Pine Script",pine_script:"",image_url:"",file_url:"" });
    setShow(false); setPost(false); load();
  };

  const del = async (id) => { await supabase.from("indicators").delete().eq("id",id); load(); };

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div style={{ fontSize:13,color:"#555" }}>{inds.length} indicateur{inds.length!==1?"s":""} partagé{inds.length!==1?"s":""}</div>
        <button onClick={()=>setShow(true)} style={A.btnPrimary}><span style={{ fontSize:18,lineHeight:1 }}>+</span> Partager un indicateur</button>
      </div>

      {loading?<Spinner/>:inds.length===0
        ?<EmptyState icon="📐" text="Aucun indicateur partagé. Partage le tien !"/>
        :<div style={{ display:"flex",flexDirection:"column",gap:16 }}>{inds.map(ind=><IndicatorCard key={ind.id} ind={ind} currentUserId={session.user.id} onDelete={del}/>)}</div>
      }

      {showForm&&(
        <div style={A.overlay} onClick={()=>setShow(false)}>
          <div style={{ ...A.modal,maxWidth:580 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontWeight:800,fontSize:18,color:"#f0f0f0" }}>Partager un indicateur</div>
              <button onClick={()=>setShow(false)} style={{ background:"none",border:"none",color:"#555",fontSize:22,cursor:"pointer" }}>✕</button>
            </div>

            <label style={A.lbl}>Nom de l'indicateur *</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{ ...A.inp,marginBottom:12 }} placeholder="ex: EMA Ribbon Dynamique"/>

            <label style={A.lbl}>Type</label>
            <div style={{ display:"flex",gap:8,marginBottom:12 }}>
              {TYPES.map(t=>(
                <button key={t} onClick={()=>setForm({...form,type:t})}
                  style={{ flex:1,padding:"9px 0",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,
                    border:`1px solid ${form.type===t?"transparent":"rgba(255,255,255,0.08)"}`,
                    background:form.type===t?"rgba(37,99,235,0.2)":"rgba(255,255,255,0.03)",
                    color:form.type===t?"#60a5fa":"#555" }}>{t}</button>
              ))}
            </div>

            <label style={A.lbl}>Description *</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
              style={{ ...A.inp,height:100,resize:"vertical",marginBottom:12 }} placeholder="Comment fonctionne cet indicateur ? Comment l'utiliser ?"/>

            {form.type==="Pine Script"&&<>
              <label style={A.lbl}>Code Pine Script</label>
              <textarea value={form.pine_script} onChange={e=>setForm({...form,pine_script:e.target.value})}
                style={{ ...A.inp,height:120,resize:"vertical",marginBottom:12,fontFamily:"'JetBrains Mono','Courier New',monospace",fontSize:12 }} placeholder="//@version=5&#10;indicator('Mon Indicateur', overlay=true)"/>
            </>}

            <label style={A.lbl}>URL image (optionnel)</label>
            <input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} style={{ ...A.inp,marginBottom:12 }} placeholder="https://i.imgur.com/..."/>

            {form.type==="Fichier"&&<>
              <label style={A.lbl}>URL du fichier à télécharger</label>
              <input value={form.file_url} onChange={e=>setForm({...form,file_url:e.target.value})} style={{ ...A.inp,marginBottom:12 }} placeholder="https://drive.google.com/..."/>
            </>}

            <button onClick={submit} disabled={posting||!form.name.trim()||!form.description.trim()}
              style={{ ...A.btnPrimary,width:"100%",justifyContent:"center",opacity:(posting||!form.name.trim()||!form.description.trim())?0.5:1 }}>
              {posting?"Publication…":"Partager l'indicateur"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROFIL
───────────────────────────────────────────── */
function ProfilView({ session, profile, onProfileUpdate }) {
  const [editing,setEdit]   = useState(false);
  const [bio,setBio]        = useState(profile?.bio||"");
  const [pseudo,setPseudo]  = useState(profile?.username||"");
  const [saving,setSaving]  = useState(false);
  const [myPosts,setMyPosts]= useState([]);
  const [stats,setStats]    = useState({ analyses:0,indicators:0,likes:0 });

  useEffect(()=>{
    supabase.from("analyses").select("id,title,created_at,likes(id)").eq("user_id",session.user.id).order("created_at",{ ascending:false }).limit(5)
      .then(({ data })=>{ if(data){ setMyPosts(data); setStats(s=>({ ...s,analyses:data.length,likes:data.reduce((acc,p)=>acc+(p.likes?.length||0),0) })); }});
    supabase.from("indicators").select("id",{ count:"exact" }).eq("user_id",session.user.id)
      .then(({ count })=>setStats(s=>({ ...s,indicators:count||0 })));
  },[session]);

  const save = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ username:pseudo.trim(),bio }).eq("id",session.user.id);
    setSaving(false); setEdit(false); onProfileUpdate({ ...profile,username:pseudo.trim(),bio });
  };

  const c = profile?.avatar_color||avatarColor(profile?.username);

  return (
    <div>
      {/* profile card */}
      <div style={{ ...A.card,marginBottom:20 }}>
        <div style={{ display:"flex",gap:16,alignItems:"flex-start",marginBottom:20 }}>
          <div style={{ width:72,height:72,borderRadius:"50%",background:`${c}22`,border:`3px solid ${c}55`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:700,color:c,flexShrink:0 }}>
            {(profile?.username||"?")[0].toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            {editing?(
              <input value={pseudo} onChange={e=>setPseudo(e.target.value)} style={{ ...A.inp,marginBottom:8,fontSize:18,fontWeight:700 }}/>
            ):(
              <div style={{ fontSize:20,fontWeight:800,color:"#f0f0f0",marginBottom:4 }}>{profile?.username}</div>
            )}
            <div style={{ fontSize:12,color:"#444" }}>{session.user.email}</div>
          </div>
          <button onClick={editing?save:()=>setEdit(true)} style={{ ...A.btnPrimary,padding:"8px 14px",fontSize:12,opacity:saving?0.6:1 }}>
            {editing?(saving?"Sauvegarde…":"Sauvegarder"):"Modifier"}
          </button>
        </div>

        {editing?(
          <><label style={A.lbl}>Bio</label>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} style={{ ...A.inp,height:80,resize:"vertical" }} placeholder="Parle-toi en quelques mots…"/></>
        ):(
          <div style={{ fontSize:13,color:"#777",lineHeight:1.6 }}>{profile?.bio||"Aucune bio renseignée."}</div>
        )}
      </div>

      {/* stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
        {[["Analyses",stats.analyses,"📊"],["Indicateurs",stats.indicators,"📐"],["Likes reçus",stats.likes,"♥"]].map(([l,v,ic])=>(
          <div key={l} style={{ ...A.card,textAlign:"center",padding:16 }}>
            <div style={{ fontSize:24,marginBottom:6 }}>{ic}</div>
            <div style={{ fontSize:24,fontWeight:900,color:"#f0f0f0" }}>{v}</div>
            <div style={{ fontSize:11,color:"#444",marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* recent posts */}
      <div style={A.card}>
        <div style={{ fontSize:10,color:"#444",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14 }}>Mes dernières analyses</div>
        {myPosts.length===0
          ?<div style={{ color:"#444",fontSize:13 }}>Aucune analyse publiée.</div>
          :myPosts.map(p=>(
            <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize:13,color:"#ccc",fontWeight:500 }}>{p.title}</div>
              <div style={{ display:"flex",alignItems:"center",gap:5,color:"#555",fontSize:12,flexShrink:0 }}>
                <span>♥</span><span>{p.likes?.length||0}</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COURS
───────────────────────────────────────────── */
const CATEGORIES = ["Débutant","Intermédiaire","Avancé","Price Action","ICT / SMC","Crypto","Forex","Indices","Psychologie"];

function YoutubeEmbed({ url }) {
  const getId = (u) => {
    try {
      const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
      const m2 = u.match(/vimeo\.com\/(\d+)/);
      if (m2) return { vimeo: m2[1] };
    } catch {}
    return null;
  };
  const id = getId(url);
  if (!id) return null;
  if (id.vimeo) return (
    <iframe src={`https://player.vimeo.com/video/${id.vimeo}`} style={{ width:"100%",height:340,border:"none",borderRadius:10 }} allowFullScreen/>
  );
  return (
    <iframe src={`https://www.youtube.com/embed/${id}`} style={{ width:"100%",height:340,border:"none",borderRadius:10 }} allowFullScreen/>
  );
}

function CourseCard({ cours, onOpen }) {
  const levelColors = { "Débutant":"#16a34a","Intermédiaire":"#f59e0b","Avancé":"#dc2626" };
  const lc = levelColors[cours.level] || "#2563eb";
  return (
    <div onClick={()=>onOpen(cours)} style={{ ...A.card, cursor:"pointer", transition:"border-color 0.15s",
      borderColor:"rgba(255,255,255,0.06)" }}
      onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(37,99,235,0.4)"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.06)"}>
      {/* thumbnail */}
      {cours.thumbnail_url ? (
        <div style={{ borderRadius:10,overflow:"hidden",marginBottom:14,height:160,background:"#060810" }}>
          <img src={cours.thumbnail_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
        </div>
      ) : (
        <div style={{ borderRadius:10,marginBottom:14,height:160,background:"linear-gradient(135deg,#0a1628,#0d1f3c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48 }}>
          🎓
        </div>
      )}
      <div style={{ display:"flex",gap:6,marginBottom:10,flexWrap:"wrap" }}>
        {cours.level&&<Tag label={cours.level} color={lc}/>}
        {cours.category&&<Tag label={cours.category} color="#6366f1"/>}
        {cours.video_url&&<Tag label="📹 Vidéo" color="#0891b2"/>}
      </div>
      <div style={{ fontWeight:700,fontSize:15,color:"#f0f0f0",marginBottom:8,lineHeight:1.4 }}>{cours.title}</div>
      <div style={{ fontSize:13,color:"#777",lineHeight:1.6,marginBottom:14,
        display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
        {cours.description}
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
        paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <Avatar username={cours.profiles?.username} color={cours.profiles?.avatar_color} size={26}/>
          <div>
            <div style={{ fontSize:12,color:"#bbb",fontWeight:600 }}>{cours.profiles?.username}</div>
            {cours.profiles?.is_formateur&&<div style={{ fontSize:10,color:"#f59e0b" }}>⭐ Formateur</div>}
          </div>
        </div>
        <div style={{ fontSize:11,color:"#444" }}>{timeAgo(cours.created_at)}</div>
      </div>
    </div>
  );
}

function CourseDetail({ cours, onClose }) {
  return (
    <div style={A.overlay} onClick={onClose}>
      <div style={{ ...A.modal,maxWidth:680,width:"100%" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
          <div style={{ flex:1,paddingRight:16 }}>
            <div style={{ display:"flex",gap:6,marginBottom:10,flexWrap:"wrap" }}>
              {cours.level&&<Tag label={cours.level} color={{"Débutant":"#16a34a","Intermédiaire":"#f59e0b","Avancé":"#dc2626"}[cours.level]||"#2563eb"}/>}
              {cours.category&&<Tag label={cours.category} color="#6366f1"/>}
            </div>
            <div style={{ fontWeight:800,fontSize:20,color:"#f0f0f0",lineHeight:1.3 }}>{cours.title}</div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#555",fontSize:24,cursor:"pointer",flexShrink:0 }}>✕</button>
        </div>

        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18,paddingBottom:18,borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <Avatar username={cours.profiles?.username} color={cours.profiles?.avatar_color} size={36}/>
          <div>
            <div style={{ fontWeight:700,color:"#e8e8e8",fontSize:13 }}>{cours.profiles?.username}</div>
            {cours.profiles?.is_formateur&&<div style={{ fontSize:11,color:"#f59e0b" }}>⭐ Formateur certifié</div>}
          </div>
          <div style={{ marginLeft:"auto",fontSize:11,color:"#444" }}>{timeAgo(cours.created_at)}</div>
        </div>

        {/* video */}
        {cours.video_url&&(
          <div style={{ marginBottom:18 }}>
            <YoutubeEmbed url={cours.video_url}/>
          </div>
        )}

        {/* image */}
        {cours.image_url&&!cours.video_url&&(
          <div style={{ borderRadius:10,overflow:"hidden",marginBottom:18 }}>
            <img src={cours.image_url} alt="" style={{ width:"100%",maxHeight:360,objectFit:"cover",display:"block" }}/>
          </div>
        )}

        {/* body */}
        <div style={{ fontSize:14,color:"#aaa",lineHeight:1.8,whiteSpace:"pre-wrap" }}>{cours.body}</div>
      </div>
    </div>
  );
}

function CoursView({ session, profile }) {
  const [cours,setCours]         = useState([]);
  const [loading,setLoading]     = useState(true);
  const [showForm,setShowForm]   = useState(false);
  const [selected,setSelected]   = useState(null);
  const [filterCat,setFilterCat] = useState("");
  const [filterLvl,setFilterLvl] = useState("");
  const [search,setSearch]       = useState("");
  const [posting,setPosting]     = useState(false);
  const [form,setForm]           = useState({
    title:"", description:"", body:"", category:"", level:"Débutant",
    video_url:"", image_url:"", thumbnail_url:""
  });

  const isFormateur = profile?.is_formateur || false;

  const load = useCallback(async()=>{
    setLoading(true);
    const { data } = await supabase.from("cours")
      .select("*, profiles(username,avatar_color,is_formateur)")
      .order("created_at",{ ascending:false });
    if (data) setCours(data);
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const filtered = cours.filter(c=>{
    if (filterCat && c.category !== filterCat) return false;
    if (filterLvl && c.level !== filterLvl) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const submit = async() => {
    if (!form.title.trim()||!form.body.trim()) return;
    setPosting(true);
    await supabase.from("cours").insert({
      user_id: session.user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      body: form.body.trim(),
      category: form.category||null,
      level: form.level||null,
      video_url: form.video_url||null,
      image_url: form.image_url||null,
      thumbnail_url: form.thumbnail_url||null,
    });
    setForm({ title:"",description:"",body:"",category:"",level:"Débutant",video_url:"",image_url:"",thumbnail_url:"" });
    setShowForm(false); setPosting(false); load();
  };

  return (
    <div>
      {/* toolbar */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,gap:10,flexWrap:"wrap" }}>
        <div style={{ fontSize:13,color:"#555" }}>{filtered.length} cours disponible{filtered.length!==1?"s":""}</div>
        {isFormateur&&(
          <button onClick={()=>setShowForm(true)} style={A.btnPrimary}>
            <span style={{ fontSize:18,lineHeight:1 }}>+</span> Publier un cours
          </button>
        )}
      </div>

      {/* search + filters */}
      <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          style={{ ...A.inp,flex:1,minWidth:180,marginBottom:0 }} placeholder="🔍  Rechercher un cours…"/>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={A.select}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterLvl} onChange={e=>setFilterLvl(e.target.value)} style={A.select}>
          <option value="">Tous niveaux</option>
          {["Débutant","Intermédiaire","Avancé"].map(l=><option key={l} value={l}>{l}</option>)}
        </select>
        {(filterCat||filterLvl||search)&&(
          <button onClick={()=>{setFilterCat("");setFilterLvl("");setSearch("");}} style={{ ...A.pill,color:"#f87171",borderColor:"rgba(248,113,113,0.3)" }}>✕ Reset</button>
        )}
      </div>

      {/* badge formateur info pour les non-formateurs */}
      {!isFormateur&&(
        <div style={{ ...A.card,marginBottom:20,background:"rgba(245,158,11,0.06)",borderColor:"rgba(245,158,11,0.2)" }}>
          <div style={{ display:"flex",gap:12,alignItems:"center" }}>
            <span style={{ fontSize:24 }}>⭐</span>
            <div>
              <div style={{ fontSize:13,color:"#f59e0b",fontWeight:700,marginBottom:3 }}>Tu veux publier des cours ?</div>
              <div style={{ fontSize:12,color:"#666" }}>Seuls les membres avec le badge <strong style={{ color:"#f59e0b" }}>Formateur</strong> peuvent créer des cours. Contacte un administrateur pour l'obtenir.</div>
            </div>
          </div>
        </div>
      )}

      {/* grid */}
      {loading ? <div style={{ color:"#555",textAlign:"center",padding:40 }}>Chargement…</div>
        : filtered.length===0
          ? <div style={{ textAlign:"center",padding:"60px 20px",color:"#3a3a3a" }}>
              <div style={{ fontSize:40,marginBottom:12 }}>🎓</div>
              <div style={{ fontSize:14 }}>{cours.length===0?"Aucun cours pour l'instant.":"Aucun cours pour ces filtres."}</div>
            </div>
          : <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16 }}>
              {filtered.map(c=><CourseCard key={c.id} cours={c} onOpen={setSelected}/>)}
            </div>
      }

      {/* detail modal */}
      {selected&&<CourseDetail cours={selected} onClose={()=>setSelected(null)}/>}

      {/* create form modal */}
      {showForm&&(
        <div style={A.overlay} onClick={()=>setShowForm(false)}>
          <div style={{ ...A.modal,maxWidth:620 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontWeight:800,fontSize:18,color:"#f0f0f0" }}>Nouveau cours</div>
              <button onClick={()=>setShowForm(false)} style={{ background:"none",border:"none",color:"#555",fontSize:22,cursor:"pointer" }}>✕</button>
            </div>

            <label style={A.lbl}>Titre *</label>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{ ...A.inp,marginBottom:12 }} placeholder="ex: Introduction au Price Action"/>

            <label style={A.lbl}>Description courte</label>
            <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{ ...A.inp,marginBottom:12 }} placeholder="Résumé en une phrase…"/>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
              <div>
                <label style={A.lbl}>Catégorie</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={A.inp}>
                  <option value="">— Choisir —</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={A.lbl}>Niveau</label>
                <select value={form.level} onChange={e=>setForm({...form,level:e.target.value})} style={A.inp}>
                  {["Débutant","Intermédiaire","Avancé"].map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <label style={A.lbl}>Contenu du cours *</label>
            <textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})}
              style={{ ...A.inp,height:160,resize:"vertical",marginBottom:12 }}
              placeholder="Écris ton cours ici… (tu peux utiliser des sauts de ligne pour structurer)"/>

            <label style={A.lbl}>Lien vidéo YouTube / Vimeo (optionnel)</label>
            <input value={form.video_url} onChange={e=>setForm({...form,video_url:e.target.value})}
              style={{ ...A.inp,marginBottom:12 }} placeholder="https://www.youtube.com/watch?v=…"/>

            <label style={A.lbl}>URL image de couverture (optionnel)</label>
            <input value={form.thumbnail_url} onChange={e=>setForm({...form,thumbnail_url:e.target.value})}
              style={{ ...A.inp,marginBottom:16 }} placeholder="https://i.imgur.com/…"/>

            <button onClick={submit} disabled={posting||!form.title.trim()||!form.body.trim()}
              style={{ ...A.btnPrimary,width:"100%",justifyContent:"center",opacity:(posting||!form.title.trim()||!form.body.trim())?0.5:1 }}>
              {posting?"Publication…":"Publier le cours"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [session,setSession]   = useState(undefined);
  const [profile,setProfile]   = useState(null);
  const [view,setView]         = useState("analyses");
  const [menuOpen,setMenu]     = useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({ data })=>setSession(data.session));
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if (!session) return;
    supabase.from("profiles").select("*").eq("id",session.user.id).single()
      .then(({ data })=>{ if(data) setProfile(data); });
  },[session]);

  const logout = ()=>supabase.auth.signOut();
  const go = (v)=>{ setView(v); setMenu(false); };

  const NAV = [
    { id:"analyses",    icon:"📊", label:"Analyses"    },
    { id:"chat",        icon:"💬", label:"Chat"         },
    { id:"indicateurs", icon:"📐", label:"Indicateurs" },
    { id:"cours",       icon:"🎓", label:"Cours"        },
    { id:"profil",      icon:"👤", label:"Mon Profil"  },
  ];

  if (session===undefined) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#060810",fontFamily:"Inter,sans-serif",color:"#555",fontSize:14 }}>
      Chargement…
    </div>
  );
  if (!session) return <AuthScreen/>;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#060810", fontFamily:"Inter,sans-serif", color:"#c0c0c0" }}>

      {/* ── mobile topbar ── */}
      <div style={{ display:"none", position:"fixed",top:0,left:0,right:0,zIndex:60,
        background:"#0a0d14",borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"12px 16px",alignItems:"center",justifyContent:"space-between",
        ...(typeof window!=="undefined"&&window.innerWidth<=768?{ display:"flex" }:{}) }}
        className="mobile-topbar">
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#002395,#ED2939)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>🇫🇷</div>
          <span style={{ fontWeight:800,fontSize:13,color:"#f0f0f0" }}>LTAF</span>
        </div>
        <button onClick={()=>setMenu(o=>!o)} style={{ background:"none",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#bbb",padding:"6px 10px",cursor:"pointer",fontSize:16,fontFamily:"inherit" }}>☰</button>
      </div>

      {menuOpen&&(
        <div style={{ position:"fixed",top:58,left:0,right:0,zIndex:59,background:"#0a0d14",borderBottom:"1px solid rgba(255,255,255,0.08)",padding:"8px 12px",display:"flex",flexDirection:"column",gap:4 }}
          className="mobile-menu">
          {NAV.map(n=><button key={n.id} onClick={()=>go(n.id)} style={{ ...A.navBtn,width:"100%",...(view===n.id?A.navActive:{}) }}>{n.icon} {n.label}</button>)}
          <button onClick={logout} style={{ ...A.navBtn,color:"#f87171",marginTop:4 }}>→ Déconnexion</button>
        </div>
      )}

      {/* ── sidebar ── */}
      <aside style={{ width:240,background:"#0a0d14",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0 }} className="desktop-sidebar">
        {/* logo */}
        <div style={{ padding:"24px 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#002395,#ED2939)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>🇫🇷</div>
            <div>
              <div style={{ fontWeight:900,fontSize:13,color:"#f0f0f0",lineHeight:1.2 }}>Le Trading</div>
              <div style={{ fontWeight:900,fontSize:13,color:"#f0f0f0",lineHeight:1.2 }}>à la Française</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:3 }}>
            {["#002395","#FFFFFF","#ED2939"].map((c,i)=><div key={i} style={{ flex:1,height:3,borderRadius:99,background:c,border:c==="#FFFFFF"?"1px solid rgba(255,255,255,0.15)":"none" }}/>)}
          </div>
        </div>

        {/* nav */}
        <nav style={{ padding:"12px 10px",flex:1 }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)}
              style={{ ...A.navBtn,width:"100%",marginBottom:2,...(view===n.id?A.navActive:{}) }}>
              <span style={{ fontSize:16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        {/* user */}
        <div style={{ padding:"16px",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
            <Avatar username={profile?.username} color={profile?.avatar_color} size={36}/>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:600,fontSize:13,color:"#e8e8e8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{profile?.username||"…"}</div>
              <div style={{ fontSize:11,color:"#444",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{session.user.email}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width:"100%",padding:"8px 0",borderRadius:8,background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── main content ── */}
      <main style={{ flex:1,padding:"28px 24px",overflowY:"auto",maxWidth:800 }} className="main-content">
        <div style={{ marginBottom:24 }}>
          <div style={{ fontWeight:900,fontSize:22,color:"#f0f0f0",letterSpacing:"-0.5px" }}>
            {NAV.find(n=>n.id===view)?.icon} {NAV.find(n=>n.id===view)?.label}
          </div>
          <div style={{ fontSize:12,color:"#444",marginTop:4 }}>
            {new Date().toLocaleDateString("fr-FR",{ weekday:"long",day:"numeric",month:"long",year:"numeric" })}
          </div>
        </div>

        {view==="analyses"    && <FeedView      session={session} profile={profile}/>}
        {view==="chat"        && <ChatView       session={session} profile={profile} key="chat"/>}
        {view==="indicateurs" && <IndicateursView session={session}/>}
        {view==="cours"        && <CoursView      session={session} profile={profile}/>}
        {view==="profil"      && <ProfilView     session={session} profile={profile} onProfileUpdate={setProfile}/>}
      </main>

      {/* ── right sidebar (desktop) ── */}
      <aside style={{ width:260,padding:"28px 16px",flexShrink:0 }} className="right-sidebar">
        <div style={A.card}>
          <div style={{ fontSize:10,color:"#444",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14 }}>Communauté</div>
          <div style={{ fontSize:13,color:"#666",lineHeight:1.7 }}>
            Bienvenue sur <strong style={{ color:"#e8e8e8" }}>Le Trading à la Française</strong> 🇫🇷<br/>
            Partage tes analyses, discute en temps réel et découvre les indicateurs de la communauté.
          </div>
          <div style={{ marginTop:14,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:3 }}>
            {["#002395","#FFFFFF","#ED2939"].map((c,i)=><div key={i} style={{ flex:1,height:4,borderRadius:99,background:c,border:c==="#FFFFFF"?"1px solid rgba(255,255,255,0.15)":"none" }}/>)}
          </div>
        </div>

        <div style={{ ...A.card,marginTop:14 }}>
          <div style={{ fontSize:10,color:"#444",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14 }}>Règles de la communauté</div>
          {["Respecte les autres membres","Partage des analyses construites","Pas de spam ni pub","Aide les débutants","Bonne ambiance avant tout"].map((r,i)=>(
            <div key={i} style={{ display:"flex",gap:8,marginBottom:8,fontSize:12,color:"#666",alignItems:"flex-start" }}>
              <span style={{ color:"#2563eb",flexShrink:0 }}>›</span>{r}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const A = {
  card: { background:"#0e1219",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:20,marginBottom:0 },
  inp: { width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"10px 12px",color:"#e8e8e8",fontSize:13,fontFamily:"Inter,sans-serif",boxSizing:"border-box",outline:"none" },
  lbl: { fontSize:10,color:"#555",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"Inter,sans-serif" },
  btnPrimary: { display:"flex",alignItems:"center",gap:6,background:"#1d4ed8",color:"#fff",border:"none",borderRadius:9,padding:"10px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Inter,sans-serif",flexShrink:0,whiteSpace:"nowrap" },
  linkBtn: { background:"none",border:"none",color:"#3b82f6",fontSize:13,cursor:"pointer",fontFamily:"Inter,sans-serif",padding:0 },
  navBtn: { display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:13,fontFamily:"Inter,sans-serif",fontWeight:500,textAlign:"left" },
  navActive: { background:"rgba(37,99,235,0.12)",color:"#60a5fa" },
  pill: { padding:"7px 14px",borderRadius:99,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#777",fontSize:12,cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:500 },
  pillActive: { background:"rgba(37,99,235,0.15)",borderColor:"rgba(37,99,235,0.4)",color:"#60a5fa" },
  select: { background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"8px 12px",color:"#bbb",fontSize:12,fontFamily:"Inter,sans-serif",cursor:"pointer",outline:"none" },
  overlay: { position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16 },
  modal: { background:"#0e1219",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:28,width:"100%",maxHeight:"92vh",overflowY:"auto" },
};

/* inject global css */
const css = document.createElement("style");
css.textContent = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #060810; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  select option { background: #0e1219; }
  input, select, textarea { color-scheme: dark; }
  @media (max-width: 900px) {
    .right-sidebar { display: none !important; }
  }
  @media (max-width: 640px) {
    .desktop-sidebar { display: none !important; }
    .mobile-topbar { display: flex !important; }
    .main-content { padding: 80px 14px 24px !important; max-width: 100% !important; }
  }
`;
document.head.appendChild(css);
