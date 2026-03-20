'use client';
import './globals.css';
import { useState, useRef, useCallback, useEffect } from 'react';

// ─── constants ────────────────────────────────────────────────────────────────
const C = {
  cam_indoor:          '#e8a020',
  cam_outdoor_covered: '#e05a20',
  cam_outdoor_open:    '#e05a20',
  cam_special:         '#9040e0',
  alarm_vol:           '#2090e0',
  alarm_curtain:       '#10a870',
  alarm_antimask:      '#e02040',
};

const DEV_INFO = {
  cam_indoor:          { label: 'מצלמה פנימית',         spec: 'כיפה פלסטיק · 2–4MP (8MP ללובי/מלון)' },
  cam_outdoor_covered: { label: 'מצלמה חיצונית — קירוי', spec: 'כיפה ברזל / צינור פלסטיק · 4–5MP' },
  cam_outdoor_open:    { label: 'מצלמה חיצונית — פתוח',  spec: 'צינור ברזל · 5MP+ · IP66+' },
  cam_special:         { label: 'מצלמה מיוחדת',          spec: 'LPR / זיהוי פנים — יש להתייעץ' },
  alarm_vol:           { label: 'גלאי נפח',              spec: 'PIR · עד 5מ׳ · חדר גדול = 2 גלאים' },
  alarm_curtain:       { label: 'גלאי וילון',             spec: 'ויטרינה / חלון ארוך · 6–12מ׳' },
  alarm_antimask:      { label: 'אנטי-מאסק',             spec: 'חובה ×1 ליד רכזת האזעקה' },
};

const INIT_CAM = [
  { id:'c1', dev:'cam_indoor',          on:true,  name:'מצלמות פנים — כניסות',         desc:'כיפה פלסטיק בכל כניסה פנימית — מסדרון, לובי, חדר מדרגות.' },
  { id:'c2', dev:'cam_indoor',          on:true,  name:'מצלמות פנים — פינות עיוורות',   desc:'מצלמה בכל פינה ללא קו ראייה ישיר. זווית 100°–120°.' },
  { id:'c3', dev:'cam_outdoor_covered', on:true,  name:'מצלמות חוץ — תחת קירוי',       desc:'כיפה ברזל או צינור פלסטיק · 4–5MP · קיר/תקרה מקורים.' },
  { id:'c4', dev:'cam_outdoor_open',    on:true,  name:'מצלמות חוץ — ללא קירוי',       desc:'חשופות לגשם/שמש — חובה צינור ברזל IP66+ · 5MP ומעלה.' },
  { id:'c5', dev:'cam_special',         on:false, name:'קוראת לוחיות רכב (LPR)',        desc:'לשערים ופרגולות. מצלמה ייעודית — יש להתייעץ לפני הזמנה.' },
  { id:'c6', dev:'cam_special',         on:false, name:'זיהוי פנים בכניסה',             desc:'דורשת עיבוד תמונה מיוחד ורישוי — יש להתייעץ לפני הזמנה.' },
];

const INIT_ALM = [
  { id:'a1', dev:'alarm_vol',      on:true,  name:"גלאי נפח — חדרים",                    desc:"חדר עד 5מ׳ — גלאי אחד. חדר גדול — שניים. גובה 2–2.3מ' בפינה." },
  { id:'a2', dev:'alarm_curtain',  on:true,  name:'גלאי וילון — ויטרינות וחלונות',       desc:'לחלון/ויטרינה ארוכה · מכסה 6–12מ׳ לפי הדגם.' },
  { id:'a3', dev:'alarm_antimask', on:true,  name:'גלאי אנטי-מאסק — חובה',               desc:'לפחות אחד · ממוקם ליד הרכזת · מגן מפני חסימת גלאים.' },
  { id:'a4', dev:'alarm_vol',      on:false, name:'גלאי תקרתי (לבקשת לקוח)',             desc:'צבע תקרה / מוסתר / אלחוטי. יש לציין בהזמנה.' },
  { id:'a5', dev:'alarm_curtain',  on:false, name:'גלאי אלחוטי (לבקשת לקוח)',            desc:'דורש מודול אלחוטי נוסף למרכזיה. יש לציין בהזמנה.' },
];

const CLIENT_OPTS = [
  { v:'residential', l:'פרטי / בית' },
  { v:'office',      l:'משרד / עסק' },
  { v:'hotel',       l:'מלון' },
  { v:'building',    l:'מבואת בניין' },
  { v:'industrial',  l:'תעשייה / מחסן' },
];

// ─── small components ─────────────────────────────────────────────────────────
function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 32, height: 18, borderRadius: 9, border: 'none', padding: 0,
      background: on ? 'var(--amber)' : 'var(--bd2)',
      position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .2s'
    }}>
      <span style={{
        position: 'absolute', width: 12, height: 12, background: '#fff', borderRadius: '50%',
        top: 3, transition: 'left .2s', left: on ? 17 : 3
      }}/>
    </button>
  );
}

function RuleCard({ rule, onToggle }) {
  const color = C[rule.dev] || '#888';
  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 'var(--r)',
      padding: '9px 11px', marginBottom: 5, opacity: rule.on ? 1 : .42, transition: 'opacity .2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }}/>
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{rule.name}</span>
        <Toggle on={rule.on} onClick={() => onToggle(rule.id)} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.45 }}>{rule.desc}</div>
    </div>
  );
}

function Chip({ color, label }) {
  const hex = color.replace('var(--','').replace(')','');
  const bg = `rgba(${hexToRgb(color)},.12)`;
  return (
    <span style={{
      fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600,
      fontFamily: "'Fira Code',monospace",
      background: bg, color, border: `1px solid ${color}44`
    }}>{label}</span>
  );
}

function hexToRgb(hex) {
  // map var names to rgb
  const map = {
    'var(--amber)':'232,160,32','var(--orange)':'224,90,32','var(--purple)':'144,64,224',
    'var(--blue)':'32,144,224','var(--teal)':'16,168,112','var(--red)':'224,32,64'
  };
  return map[hex] || '128,128,128';
}

// ─── SVG overlay ──────────────────────────────────────────────────────────────
function Overlay({ devices, W, H, onClickDevice }) {
  if (!devices.length || !W || !H) return null;
  const R = { cam_indoor:30,cam_outdoor_covered:30,cam_outdoor_open:30,cam_special:22,alarm_vol:52,alarm_curtain:58,alarm_antimask:15 };

  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {devices.map((d, i) => {
        const x = d.x * W / 100, y = d.y * H / 100;
        const c = C[d.type] || '#888', r = R[d.type] || 28;
        const isCam = d.type.startsWith('cam_');
        return (
          <g key={i} style={{ cursor:'pointer', pointerEvents:'all' }}
            onClick={() => onClickDevice(i)}>

            {isCam && d.angle !== undefined && (() => {
              const a = d.angle * Math.PI/180, sp = 50 * Math.PI/180;
              const x1=x+r*2*Math.cos(a-sp), y1=y+r*2*Math.sin(a-sp);
              const x2=x+r*2*Math.cos(a+sp), y2=y+r*2*Math.sin(a+sp);
              return <path d={`M${x},${y} L${x1},${y1} A${r*2},${r*2} 0 0,1 ${x2},${y2} Z`}
                fill={c} fillOpacity=".13" stroke={c} strokeWidth="1" strokeOpacity=".4"/>;
            })()}

            {d.type==='alarm_vol' &&
              <circle cx={x} cy={y} r={r} fill={c} fillOpacity=".1"
                stroke={c} strokeWidth="1" strokeDasharray="4,3" strokeOpacity=".5"/>}
            {d.type==='alarm_curtain' &&
              <ellipse cx={x} cy={y} rx={r} ry={r*.3} fill={c} fillOpacity=".1"
                stroke={c} strokeWidth="1" strokeDasharray="5,3" strokeOpacity=".5"/>}
            {d.type==='alarm_antimask' &&
              <circle cx={x} cy={y} r={r} fill={c} fillOpacity=".15"
                stroke={c} strokeWidth="1.5" strokeOpacity=".7"/>}

            <g filter="url(#glow)">
              <circle cx={x} cy={y} r="15" fill={c} fillOpacity=".22"/>
              <circle cx={x} cy={y} r="7"  fill={c}/>
              <text x={x} y={y+3.5} textAnchor="middle"
                fontFamily="'Fira Code',monospace" fontSize="8.5" fontWeight="700" fill="#000">{i+1}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ─── main app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [imgSrc,    setImgSrc]    = useState(null);
  const [imgB64,    setImgB64]    = useState(null);
  const [imgDims,   setImgDims]   = useState({ w:0, h:0 });
  const [fileName,  setFileName]  = useState('');
  const [client,    setClient]    = useState('residential');
  const [camRules,  setCamRules]  = useState(INIT_CAM);
  const [almRules,  setAlmRules]  = useState(INIT_ALM);
  const [custom,    setCustom]    = useState([]);
  const [devices,   setDevices]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState('ממתין לסרטוט');
  const [hlIdx,     setHlIdx]     = useState(null);
  const [coverage,  setCoverage]  = useState(0);
  const [drag,      setDrag]      = useState(false);
  const [modal,     setModal]     = useState(false);
  const [newRule,   setNewRule]   = useState({ name:'', dev:'cam_indoor', desc:'' });
  const [error,     setError]     = useState(null);

  const imgRef  = useRef(null);
  const fileRef = useRef(null);

  // ── file handling ──────────────────────────────────────────────
  const loadImage = useCallback((dataUrl, fname, ico='🖼') => {
    setImgSrc(dataUrl);
    setImgB64(dataUrl.split(',')[1]);
    setFileName(fname);
    setDevices([]); setHlIdx(null); setCoverage(0); setError(null);
    setStatus('סרטוט נטען — לחץ לניתוח');
  }, []);

  const ingestImg = useCallback((file) => {
    const fr = new FileReader();
    fr.onload = e => loadImage(e.target.result, file.name);
    fr.readAsDataURL(file);
  }, [loadImage]);

  const ingestPDF = useCallback(async (file) => {
    setStatus('ממיר PDF...');
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
    GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    const ab  = await file.arrayBuffer();
    const pdf = await getDocument({ data: ab }).promise;
    const pg  = await pdf.getPage(1);
    const vp  = pg.getViewport({ scale: 2.2 });
    const cv  = document.createElement('canvas');
    cv.width=vp.width; cv.height=vp.height;
    await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    loadImage(cv.toDataURL('image/jpeg', .93), file.name, '📄');
  }, [loadImage]);

  const processFile = useCallback((file) => {
    if (!file) return;
    if (file.type==='application/pdf') ingestPDF(file);
    else ingestImg(file);
  }, [ingestImg, ingestPDF]);

  // ── rules ──────────────────────────────────────────────────────
  const toggleCam = id => setCamRules(rs => rs.map(r => r.id===id ? {...r, on:!r.on} : r));
  const toggleAlm = id => setAlmRules(rs => rs.map(r => r.id===id ? {...r, on:!r.on} : r));
  const toggleCus = id => setCustom(rs => rs.map(r => r.id===id ? {...r, on:!r.on} : r));

  const saveRule = () => {
    if (!newRule.name.trim()) return;
    setCustom(r => [...r, { id:'x'+Date.now(), ...newRule, on:true }]);
    setNewRule({ name:'', dev:'cam_indoor', desc:'' });
    setModal(false);
  };

  // ── analysis ───────────────────────────────────────────────────
  const allRules = [...camRules, ...almRules, ...custom];

  const runAnalysis = async () => {
    if (!imgB64) return;
    setLoading(true); setError(null); setStatus('Claude מנתח את הסרטוט...');

    const ctLabel = { residential:'פרטי/בית',office:'משרד/עסק',hotel:'מלון',building:'מבואת בניין',industrial:'תעשייה' };
    const needs8mp = ['hotel','building'].includes(client);
    const active   = allRules.filter(r=>r.on);
    const rulesText = active.map(r=>`• [${r.dev}] ${r.name}: ${r.desc}`).join('\n');

    const prompt = `You are a senior Israeli security systems engineer with 20+ years of experience.
Analyze this floor plan and produce an optimal security device placement plan.

Client type: ${ctLabel[client]}${needs8mp?'\n⚠️ 8MP cameras required for facial identification.':''}

CAMERA SPECIFICATIONS:
- cam_indoor: Dome camera, plastic housing. 2–4MP standard. Use 8MP for hotel lobbies and building entrances where face recognition matters. Ceiling/wall mount indoors.
- cam_outdoor_covered: Iron dome or plastic tube under covered area (porch, pergola, overhang). 4–5MP. More sheltered so lighter housing OK.
- cam_outdoor_open: Metal tube camera, fully exposed to elements. Must be IP66 rated minimum. 5MP+. Mount high on exterior walls.
- cam_special: Specialized cameras only — LPR (license plate reader) for gates/driveways, or facial recognition at main entrance. NOT standard cameras. Require specialist consultation. Always add spec_note warning.

ALARM SENSOR SPECIFICATIONS:
- alarm_vol: PIR volumetric detector. Covers 5m radius sphere. Large room (>5m) = 2 detectors in opposite corners. Mount in corner at 2.0–2.3m height. Do NOT place near heat sources (AC, radiators).
- alarm_curtain: Curtain/barrier detector for long glass fronts, sliding doors, large windows. Creates a vertical detection plane 6–12m wide depending on model. Place at end of window, pointing along the glass.
- alarm_antimask: Anti-tamper/anti-mask detector — mandatory minimum ONE unit. Must be positioned to guard the alarm control panel location (typically near main entrance or utility room). Protects against someone covering/blocking sensors.

Hebrew floor plan labels to recognize:
מבואה=entrance lobby | ארוח=living room | מטבח=kitchen | ממ"ד=safe/reinforced room | חדר שינה/חד' שינה=bedroom | רחצה=bathroom | תכביסה=laundry | מסדרון=corridor | ארוח חוץ=outdoor dining | פרגולה=pergola | חצר=yard | גינה=garden | מחסן=storage

Active rules to follow:
${rulesText}

IMPORTANT PLACEMENT GUIDELINES:
- Always cover every external door and accessible window
- Ensure no blind corridors (hallways with no camera visibility)
- For cam_special: NEVER place unless the rule is explicitly enabled and the location clearly calls for it
- Position alarm_antimask near what appears to be the alarm panel location (near main entrance or utility area)
- For large open-plan areas, consider both cameras AND volume detectors
- Outdoor cameras: distinguish carefully between covered (pergola, porch) and uncovered areas

Respond with ONLY a valid JSON array. Absolutely no markdown, no explanation text:
[
  {
    "type": "cam_indoor|cam_outdoor_covered|cam_outdoor_open|cam_special|alarm_vol|alarm_curtain|alarm_antimask",
    "name": "short Hebrew device label e.g. מצלמה — כניסה ראשית",
    "x": number 0-100 (percentage from RIGHT edge of image),
    "y": number 0-100 (percentage from TOP of image),
    "angle": number 0-360 (direction camera faces in degrees, 0=right 90=down 180=left 270=up — only for camera types),
    "score": number 1-10,
    "reason": "Hebrew 1-2 sentences explaining why this exact location",
    "spec_note": "optional Hebrew warning string, required for cam_special",
    "rules": ["matching rule names"]
  }
]

Place 12–20 devices. Be thorough. Return ONLY the JSON array.`;

    try {
      const res  = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgB64, prompt })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const match = data.text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('המודל לא החזיר JSON תקין');
      const devs = JSON.parse(match[0]);
      if (!Array.isArray(devs) || !devs.length) throw new Error('תגובה ריקה');

      setDevices(devs);
      const cov = Math.min(96, 52 + devs.length*2.5 + active.length*1.3);
      setCoverage(Math.round(cov));
      setStatus(`${devs.length} מכשירים ממוקמו — ניתוח הושלם`);
    } catch(e) {
      setError(e.message);
      setStatus('שגיאה בניתוח');
    } finally {
      setLoading(false);
    }
  };

  const onImgLoad = () => {
    if (imgRef.current) setImgDims({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight });
  };

  const clickDevice = (i) => {
    setHlIdx(i);
    document.getElementById(`rc-${i}`)?.scrollIntoView({ behavior:'smooth', block:'nearest' });
  };

  const countType = (t) => devices.filter(d=>d.type===t).length;

  // ── render ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .app { display:grid; grid-template-rows:50px 1fr; grid-template-columns:300px 1fr 280px; height:100vh; }
        .lp  { display:flex; flex-direction:column; overflow:hidden; background:var(--s1); border-left:1px solid var(--bd); }
        .rp  { display:flex; flex-direction:column; overflow:hidden; background:var(--s1); border-right:1px solid var(--bd); }
        .ph  { padding:12px 14px 9px; border-bottom:1px solid var(--bd); flex-shrink:0; }
        .plb { font-family:'Fira Code',monospace; font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:var(--dim); margin-bottom:2px; }
        .pt  { font-size:13px; font-weight:600; }
        .ps  { flex:1; overflow-y:auto; padding:10px; }
        .sep { font-family:'Fira Code',monospace; font-size:9px; letter-spacing:.1em; color:var(--dim2); text-transform:uppercase;
               display:flex; align-items:center; gap:6px; padding:8px 0 4px; }
        .sep::after { content:''; flex:1; height:1px; background:var(--bd); }
        .uzone { border:1.5px dashed var(--bd2); border-radius:var(--r2); padding:20px 12px; text-align:center;
                 cursor:pointer; background:var(--s2); margin-bottom:10px; transition:all .2s; }
        .uzone:hover,.uzone.drag { border-color:var(--amber); background:rgba(232,160,32,.04); }
        .fpill { display:none; align-items:center; gap:7px; background:var(--s2); border:1px solid var(--bd);
                 border-radius:var(--r); padding:7px 9px; margin-bottom:9px; font-size:11px; }
        .fpill.show { display:flex; }
        .anbtn { width:100%; padding:12px; background:var(--amber); color:#000; font-family:'Heebo',sans-serif;
                 font-weight:700; font-size:13px; border:none; border-radius:var(--r); cursor:pointer;
                 display:flex; align-items:center; justify-content:center; gap:7px; transition:all .15s; }
        .anbtn:hover:not(:disabled) { background:#f5b540; transform:translateY(-1px); }
        .anbtn:disabled { background:var(--s3); color:var(--dim); cursor:not-allowed; transform:none; }
        .canvas-area { position:relative; overflow:hidden; background:var(--bg);
                       display:flex; align-items:center; justify-content:center; }
        .cgrid { position:absolute; inset:0; pointer-events:none;
                 background-image:linear-gradient(var(--s2) 1px,transparent 1px),linear-gradient(90deg,var(--s2) 1px,transparent 1px);
                 background-size:28px 28px; opacity:.5; }
        .cwrap { position:relative; max-width:100%; max-height:100%; }
        .rescard { background:var(--s2); border:1px solid var(--bd); border-radius:var(--r); padding:9px 11px;
                   margin-bottom:5px; cursor:pointer; transition:all .15s; animation:slideIn .3s ease both; }
        .rescard:hover { border-color:var(--bd2); }
        .rescard.hl { border-color:var(--amber) !important; background:rgba(232,160,32,.06); }
        .legrow { display:flex; align-items:center; gap:7px; margin-bottom:5px; }
        .covbar { height:4px; background:var(--bd2); border-radius:2px; overflow:hidden; }
        .covfill { height:100%; border-radius:2px; background:linear-gradient(90deg,var(--amber),var(--teal));
                   transition:width 1.3s cubic-bezier(.22,1,.36,1); }
        .warn-note { background:rgba(224,32,64,.07); border:1px solid rgba(224,32,64,.22); border-radius:var(--r);
                     padding:8px 10px; font-size:10px; color:#ff6080; line-height:1.5; margin-bottom:6px; }
        .addbtn { width:100%; padding:8px; border:1px dashed var(--bd2); border-radius:var(--r); background:transparent;
                  color:var(--dim); font-family:'Heebo',sans-serif; font-size:11px; cursor:pointer; transition:all .15s; }
        .addbtn:hover { border-color:var(--amber); color:var(--amber); }
        .mbg { position:fixed; inset:0; background:rgba(0,0,0,.75); backdrop-filter:blur(6px);
               display:flex; align-items:center; justify-content:center; z-index:200; animation:fadeIn .2s; }
        .mbox { background:var(--s1); border:1px solid var(--bd2); border-radius:12px; padding:22px; width:360px; max-width:92vw; }
        .mf { margin-bottom:9px; }
        .mf label { display:block; font-size:11px; color:var(--dim); margin-bottom:3px; }
        .mf input,.mf select,.mf textarea { width:100%; background:var(--s2); border:1px solid var(--bd2); border-radius:var(--r);
          color:var(--text); font-family:'Heebo',sans-serif; font-size:13px; padding:7px 10px; outline:none; transition:border-color .15s; }
        .mf input:focus,.mf select:focus,.mf textarea:focus { border-color:var(--amber); }
        .mf textarea { min-height:68px; resize:vertical; }
      `}</style>

      <div className="app">

        {/* HEADER */}
        <header style={{
          gridColumn:'1/-1', background:'var(--s1)', borderBottom:'1px solid var(--bd)',
          display:'flex', alignItems:'center', padding:'0 18px', gap:16
        }}>
          <div style={{ fontFamily:'Heebo,sans-serif', fontWeight:700, fontSize:16, letterSpacing:'.05em', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, background:'var(--amber)', borderRadius:6, display:'grid', placeItems:'center', fontSize:16 }}>🔒</div>
            <span>SECURE<span style={{ color:'var(--amber)' }}>PLAN</span></span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'var(--dim)' }}>
            <span>סוג לקוח:</span>
            <select value={client} onChange={e=>setClient(e.target.value)} style={{
              background:'var(--s2)', border:'1px solid var(--bd2)', borderRadius:'var(--r)',
              color:'var(--text)', fontFamily:'Heebo,sans-serif', fontSize:12, padding:'4px 8px', outline:'none'
            }}>
              {CLIENT_OPTS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>

          <div style={{ marginRight:'auto', fontFamily:"'Fira Code',monospace", fontSize:11, color:'var(--dim)', display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--amber)', animation:'pulse 2.4s ease-in-out infinite' }}/>
            <span>{status}</span>
          </div>

          <div style={{
            fontFamily:"'Fira Code',monospace", fontSize:10, padding:'3px 10px', borderRadius:20,
            border:`1px solid ${devices.length?'var(--teal)':'var(--bd2)'}`,
            color: devices.length ? 'var(--teal)' : 'var(--dim)'
          }}>
            {devices.length ? `${devices.length} מכשירים ✓` : 'v3 Pro'}
          </div>
        </header>

        {/* LEFT PANEL */}
        <div className="lp">
          <div className="ph"><div className="plb">// קלט</div><div className="pt">סרטוט + חוקי התקנה</div></div>
          <div className="ps">

            <div
              className={`uzone${drag?' drag':''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDrag(true)}}
              onDragLeave={()=>setDrag(false)}
              onDrop={e=>{e.preventDefault();setDrag(false);processFile(e.dataTransfer.files[0])}}
            >
              <div style={{ fontSize:28, marginBottom:6 }}>📐</div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>גרור סרטוט לכאן</div>
              <div style={{ fontSize:11, color:'var(--dim)' }}>PNG · JPG · PDF</div>
              <input ref={fileRef} type="file" style={{ display:'none' }} accept="image/*,application/pdf"
                onChange={e=>processFile(e.target.files[0])} />
            </div>

            <div className={`fpill${imgSrc?' show':''}`}>
              <span style={{ fontSize:14 }}>🖼</span>
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 }}>{fileName}</span>
              <span style={{ color:'var(--teal)', fontFamily:"'Fira Code',monospace", fontSize:10 }}>✓ נטען</span>
            </div>

            <div className="sep"><span>📷 מצלמות</span></div>
            {camRules.map(r=><RuleCard key={r.id} rule={r} onToggle={toggleCam}/>)}

            <div className="sep"><span>🔔 גלאי אזעקה</span></div>
            {almRules.map(r=><RuleCard key={r.id} rule={r} onToggle={toggleAlm}/>)}
            {custom.map(r=><RuleCard key={r.id} rule={r} onToggle={toggleCus}/>)}

            <div className="warn-note" style={{ marginTop:8 }}>
              ⚠ <strong>בקשות מיוחדות</strong> (LPR / זיהוי פנים) — יש להתייעץ עם טכנאי לפני הזמנה. מצלמות אלו מיוחדות ואינן סטנדרטיות.
            </div>

            <button className="addbtn" onClick={()=>setModal(true)}>＋ הוסף חוק מותאם אישית</button>
          </div>

          <div style={{ padding:12, borderTop:'1px solid var(--bd)' }}>
            <button className="anbtn" disabled={!imgB64||loading} onClick={runAnalysis}>
              {loading
                ? <><span style={{ display:'inline-block', animation:'spin .7s linear infinite' }}>⟳</span> מנתח...</>
                : 'ניתוח מיקומים אופטימלי'}
            </button>
          </div>
        </div>

        {/* CANVAS */}
        <div className="canvas-area">
          <div className="cgrid"/>

          {!imgSrc && (
            <div style={{ textAlign:'center', position:'relative', zIndex:1 }}>
              <div style={{ fontSize:72, opacity:.08, marginBottom:14, filter:'grayscale(1)' }}>🏠</div>
              <div style={{ fontSize:13, color:'var(--dim)', lineHeight:1.8 }}>
                <strong style={{ display:'block', color:'var(--dim2)', marginBottom:4 }}>אין סרטוט</strong>
                העלה תוכנית בית<br/>והמערכת תמקם מצלמות וגלאים
              </div>
            </div>
          )}

          {imgSrc && (
            <div className="cwrap">
              <img
                ref={imgRef} src={imgSrc} onLoad={onImgLoad} alt="floor plan"
                style={{ display:'block', maxWidth:'100%', maxHeight:'calc(100vh - 50px)', objectFit:'contain', borderRadius:4 }}
              />
              <Overlay devices={devices} W={imgDims.w} H={imgDims.h} onClickDevice={clickDevice}/>
            </div>
          )}

          {error && (
            <div style={{
              position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)',
              background:'var(--s1)', border:'1px solid rgba(224,32,64,.4)', borderRadius:'var(--r)',
              padding:'10px 16px', fontSize:12, color:'#ff6080', maxWidth:400, textAlign:'center'
            }}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="rp">
          <div className="ph"><div className="plb">// פלט</div><div className="pt">מכשירים מומלצים</div></div>

          {devices.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, padding:'8px 10px', borderBottom:'1px solid var(--bd)', flexShrink:0 }}>
              {countType('cam_indoor')>0          && <Chip color="var(--amber)"  label={`📷 ${countType('cam_indoor')} פנים`}/>}
              {(countType('cam_outdoor_covered')+countType('cam_outdoor_open'))>0 && <Chip color="var(--orange)" label={`📷 ${countType('cam_outdoor_covered')+countType('cam_outdoor_open')} חוץ`}/>}
              {countType('cam_special')>0         && <Chip color="var(--purple)" label={`🔮 ${countType('cam_special')} מיוחד`}/>}
              {countType('alarm_vol')>0           && <Chip color="var(--blue)"   label={`🔵 ${countType('alarm_vol')} נפח`}/>}
              {countType('alarm_curtain')>0       && <Chip color="var(--teal)"   label={`🟢 ${countType('alarm_curtain')} וילון`}/>}
              {countType('alarm_antimask')>0      && <Chip color="var(--red)"    label={`🔴 ${countType('alarm_antimask')} מאסק`}/>}
            </div>
          )}

          <div className="ps">
            {devices.length === 0 ? (
              <div style={{ padding:'28px 12px', textAlign:'center', color:'var(--dim)', fontSize:12, lineHeight:1.8 }}>
                <div style={{ fontSize:26, marginBottom:10, opacity:.15 }}>📋</div>
                תוצאות הניתוח יופיעו כאן<br/>לאחר העלאת סרטוט
              </div>
            ) : devices.map((d,i) => {
              const info = DEV_INFO[d.type] || {};
              const col  = C[d.type] || '#888';
              return (
                <div key={i} id={`rc-${i}`} className={`rescard${hlIdx===i?' hl':''}`}
                  style={{ borderRight:`3px solid ${col}`, animationDelay:`${i*.04}s` }}
                  onClick={()=>clickDevice(i)}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                    <span style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:'#000', background:col, borderRadius:4, padding:'1px 5px', fontWeight:700 }}>#{i+1}</span>
                    <span style={{ fontSize:12, fontWeight:600, flex:1 }}>{d.name}</span>
                    <span style={{ fontFamily:"'Fira Code',monospace", fontSize:11, color:col }}>{d.score}/10</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--dim)', lineHeight:1.45 }}>{d.reason}</div>
                  {info.spec && <div style={{ marginTop:5, padding:'4px 7px', background:'var(--s3)', borderRadius:4, fontSize:10, fontFamily:"'Fira Code',monospace", color:'var(--dim)' }}>{info.spec}</div>}
                  {d.spec_note && <div style={{ marginTop:4, padding:'4px 7px', background:'rgba(224,32,64,.08)', borderRadius:4, fontSize:10, fontFamily:"'Fira Code',monospace", color:'#ff6080' }}>⚠ {d.spec_note}</div>}
                </div>
              );
            })}
          </div>

          {coverage > 0 && (
            <div style={{ padding:12, borderTop:'1px solid var(--bd)', flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--dim)', marginBottom:5 }}>
                <span>כיסוי אבטחה משוער</span>
                <span style={{ fontFamily:"'Fira Code',monospace", color:'var(--teal)' }}>{coverage}%</span>
              </div>
              <div className="covbar"><div className="covfill" style={{ width:`${coverage}%` }}/></div>
            </div>
          )}

          <div style={{ padding:'10px 12px', borderTop:'1px solid var(--bd)', flexShrink:0 }}>
            {Object.entries(DEV_INFO).map(([k,v]) => (
              <div key={k} className="legrow">
                <div style={{ width:8, height:8, borderRadius:'50%', background:C[k], flexShrink:0 }}/>
                <span style={{ fontSize:10, color:'var(--dim)', flex:1 }}>{v.label}</span>
                <span style={{ fontSize:9, fontFamily:"'Fira Code',monospace", color:'var(--dim2)' }}>{v.spec.split('·')[0].trim()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="mbg" onClick={()=>setModal(false)}>
          <div className="mbox" onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>➕ חוק התקנה מותאם</div>
            <div className="mf">
              <label>שם החוק</label>
              <input value={newRule.name} onChange={e=>setNewRule(r=>({...r,name:e.target.value}))} placeholder="לדוגמה: כיסוי חדר שרתים"/>
            </div>
            <div className="mf">
              <label>סוג מכשיר</label>
              <select value={newRule.dev} onChange={e=>setNewRule(r=>({...r,dev:e.target.value}))}>
                {Object.entries(DEV_INFO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="mf">
              <label>תיאור / הוראת התקנה</label>
              <textarea value={newRule.desc} onChange={e=>setNewRule(r=>({...r,desc:e.target.value}))} placeholder="תאר מתי ואיפה להתקין..."/>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={()=>setModal(false)} style={{ flex:1, padding:10, border:'1px solid var(--bd2)', borderRadius:'var(--r)', background:'var(--s3)', color:'var(--dim)', fontFamily:'Heebo,sans-serif', fontWeight:600, fontSize:13, cursor:'pointer' }}>ביטול</button>
              <button onClick={saveRule} style={{ flex:1, padding:10, border:'none', borderRadius:'var(--r)', background:'var(--amber)', color:'#000', fontFamily:'Heebo,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>שמור</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}`}</style>
    </>
  );
}
