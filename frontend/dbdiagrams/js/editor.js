/* editor.js v2 — corregido */
'use strict';
const P = new URLSearchParams(location.search);
const PID = P.get('pid');
if (!PID) location.href = '/dbdiagrams/seleccion';
const API = `/api/dbdiagrams/proyectos/${PID}`;

let E = { nodos:[], enlaces:[], config:{zoom:1,panX:0,panY:0,snapGrid:true,gridSize:20} };
let sel = null; // {tipo,id}
let modo = 'select';
let cxFrom = null; // id nodo origen conexión
let dirty = false;
let saveTimer = null;

const container = document.getElementById('canvas-container');
const world     = document.getElementById('canvas-world');
const svgEl     = document.getElementById('canvas-svg');
const nodesEl   = document.getElementById('canvas-nodes');

/* ── Helpers ── */
const uid  = () => 'n'+Math.random().toString(36).slice(2,9);
const esc  = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const snap = v => { if (!document.getElementById('snap-grid').checked) return Math.round(v); const g=E.config.gridSize||20; return Math.round(v/g)*g; };

function toast(msg, t='info'){
  const c=document.getElementById('toast-container'), el=document.createElement('div');
  el.className=`toast toast-${t}`; el.textContent=msg; c.appendChild(el);
  setTimeout(()=>el.classList.add('show'),10);
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),300);},2800);
}
function mark(){ dirty=true; clearTimeout(saveTimer); saveTimer=setTimeout(save,2000); }

/* ── Transform ── */
function applyT(){
  const {zoom:z,panX:px,panY:py}=E.config;
  world.style.transform=`translate(${px}px,${py}px) scale(${z})`;
  world.style.transformOrigin='0 0';
  document.getElementById('zoom-label').textContent=Math.round(z*100)+'%';
}
function toCanvas(cx,cy){
  const r=container.getBoundingClientRect();
  return {x:(cx-r.left-E.config.panX)/E.config.zoom, y:(cy-r.top-E.config.panY)/E.config.zoom};
}

/* ── Cargar / Guardar ── */
async function load(){
  try{
    const p=await(await fetch(API)).json();
    E.nodos=p.nodos||[]; E.enlaces=p.enlaces||[];
    if(p.config)Object.assign(E.config,p.config);
    document.getElementById('diagram-name').value=p.titulo||'Sin título';
    applyT(); renderAll();
  }catch{ toast('Error al cargar','error'); }
}
async function save(){
  try{
    await fetch(API,{method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nodos:E.nodos,enlaces:E.enlaces,config:E.config})});
    dirty=false; toast('Guardado ✓','success');
  }catch{ toast('Error al guardar','error'); }
}

/* ── Render ── */
function renderAll(){ renderNodes(); renderEdges(); }

/* ── NODOS ── */
function renderNodes(){
  nodesEl.innerHTML='';
  E.nodos.forEach(n=>nodesEl.appendChild(buildNode(n)));
}

function buildNode(n){
  const el=document.createElement('div');
  el.className=`diagram-node node-${n.tipo}${sel?.tipo==='nodo'&&sel.id===n.id?' selected':''}`;
  el.dataset.id=n.id;
  const s=n.estilo||{};
  const w=n.w||140, h=n.h||60;
  el.style.cssText=`left:${n.x}px;top:${n.y}px;width:${w}px;height:${h}px;`;

  // Shape SVG
  const shapeDiv=document.createElement('div');
  shapeDiv.className='node-shape-svg';
  shapeDiv.innerHTML=getShapeSVG(n.tipo, w, h, s.bg||'#1e293b', s.bc||'#6366f1', s.bw||2);
  el.appendChild(shapeDiv);

  // inner (texto)
  const inner=document.createElement('div');
  inner.className='node-inner';

  const txt=document.createElement('div');
  txt.className='node-text';
  txt.contentEditable='false';
  txt.style.cssText=`color:${s.tc||'#fff'};font-size:${s.fs||14}px;font-weight:${s.fw||'normal'};font-style:${s.fi||'normal'};`;
  txt.innerHTML=n.html||esc(n.txt||'');
  inner.appendChild(txt);
  el.appendChild(inner);

  // Puertos (múltiples por lado para DB)
  const ports = [
    'top', 'top-1', 'top-2',
    'bottom', 'bottom-1', 'bottom-2',
    'left', 'left-1', 'left-2', 'left-3', 'left-4',
    'right', 'right-1', 'right-2', 'right-3', 'right-4'
  ];
  ports.forEach(pos=>{
    const pt=document.createElement('div');
    pt.className=`conn-port`;
    pt.dataset.pos = pos;
    
    // Posicionamiento en línea
    if(pos==='top') { pt.style.top = '0%'; pt.style.left = '50%'; }
    if(pos==='bottom') { pt.style.top = '100%'; pt.style.left = '50%'; }
    if(pos==='left') { pt.style.left = '0%'; pt.style.top = '50%'; }
    if(pos==='right') { pt.style.left = '100%'; pt.style.top = '50%'; }
    
    if(pos.startsWith('top-')) {
       let i = parseInt(pos.split('-')[1]);
       pt.style.top = '0%'; pt.style.left = (i === 1 ? '25%' : '75%');
    }
    if(pos.startsWith('bottom-')) {
       let i = parseInt(pos.split('-')[1]);
       pt.style.top = '100%'; pt.style.left = (i === 1 ? '25%' : '75%');
    }
    if(pos.startsWith('left-')) {
       let i = parseInt(pos.split('-')[1]);
       pt.style.left = '0%'; pt.style.top = (i * 20) + '%';
    }
    if(pos.startsWith('right-')) {
       let i = parseInt(pos.split('-')[1]);
       pt.style.left = '100%'; pt.style.top = (i * 20) + '%';
    }
    
    pt.addEventListener('mousedown',ev=>{ev.stopPropagation();startConn(n.id,pos,ev);});
    el.appendChild(pt);
  });

  // Resize handles (solo si seleccionado)
  if(sel?.id===n.id&&sel?.tipo==='nodo'){
    ['se','sw','ne','nw'].forEach(p=>{
      const h=document.createElement('div');
      h.className=`resize-handle ${p}`;
      h.addEventListener('mousedown',ev=>{ev.stopPropagation();startResize(n.id,p,ev);});
      el.appendChild(h);
    });
  }

  el.addEventListener('mousedown',ev=>{
    ev.stopPropagation();
    if(ev.target.classList.contains('conn-port')||ev.target.classList.contains('resize-handle'))return;
    if(modo==='connect'){clickConnect(n.id);return;}
    selectItem('nodo',n.id);
    if(ev.detail===2){startEdit(n.id);return;}
    ev.preventDefault();
    startDrag(n.id,ev);
  });
  return el;
}

/* ── Drag ── */
function startDrag(id,e){
  e.stopPropagation();
  const n=E.nodos.find(x=>x.id===id); if(!n)return;
  const wp = toCanvas(e.clientX, e.clientY);
  const offsetX = wp.x - n.x;
  const offsetY = wp.y - n.y;
  
  function mv(ev){
    const cp = toCanvas(ev.clientX, ev.clientY);
    n.x = snap(cp.x - offsetX);
    n.y = snap(cp.y - offsetY);
    const el = nodesEl.querySelector(`[data-id="${id}"]`);
    if(el){el.style.left=n.x+'px';el.style.top=n.y+'px';}
    renderEdges();
  }
  function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);mark();}
  document.addEventListener('mousemove',mv);
  document.addEventListener('mouseup',up);
}

/* ── Resize ── */
function startResize(id,pos,e){
  const n=E.nodos.find(x=>x.id===id); if(!n)return;
  const z=E.config.zoom, sx=e.clientX, sy=e.clientY, sw=n.w||140, sh=n.h||60, snx=n.x, sny=n.y;
  function mv(ev){
    const dx=(ev.clientX-sx)/z, dy=(ev.clientY-sy)/z;
    if(pos.includes('e'))n.w=Math.max(60,snap(sw+dx));
    if(pos.includes('s'))n.h=Math.max(40,snap(sh+dy));
    if(pos.includes('w')){n.w=Math.max(60,snap(sw-dx));n.x=snap(snx+dx);}
    if(pos.includes('n')){n.h=Math.max(40,snap(sh-dy));n.y=snap(sny+dy);}
    const el=nodesEl.querySelector(`[data-id="${id}"]`);
    if(el){el.style.width=n.w+'px';el.style.height=n.h+'px';el.style.left=n.x+'px';el.style.top=n.y+'px';}
    renderEdges();
  }
  function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);mark();}
  document.addEventListener('mousemove',mv);
  document.addEventListener('mouseup',up);
}

/* ── Edición texto ── */
function startEdit(id){
  const el=nodesEl.querySelector(`[data-id="${id}"] .node-text`); if(!el)return;
  el.contentEditable='true'; el.focus();
  posFormatBar(el);
  el.addEventListener('blur',()=>{
    el.contentEditable='false'; hideFormatBar();
    const n=E.nodos.find(x=>x.id===id);
    if(n){n.txt=el.innerText;n.html=el.innerHTML;mark();}
  },{once:true});
}

function getShapeSVG(tipo, w, h, bg, bc, bw) {
  const b = bw/2; // para que el stroke no se corte
  if(tipo==='rombo') return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="${w/2},${b} ${w-b},${h/2} ${w/2},${h-b} ${b},${h/2}" fill="${bg}" stroke="${bc}" stroke-width="${bw}"/></svg>`;
  if(tipo==='ovalo') return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><ellipse cx="${w/2}" cy="${h/2}" rx="${w/2-b}" ry="${h/2-b}" fill="${bg}" stroke="${bc}" stroke-width="${bw}"/></svg>`;
  if(tipo==='paralelogramo') return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="${w*0.15},${b} ${w-b},${b} ${w*0.85},${h-b} ${b},${h-b}" fill="${bg}" stroke="${bc}" stroke-width="${bw}"/></svg>`;
  if(tipo==='cilindro') return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="M ${b} ${h*0.15} A ${w/2-b} ${h*0.15} 0 0 1 ${w-b} ${h*0.15} L ${w-b} ${h-h*0.15} A ${w/2-b} ${h*0.15} 0 0 1 ${b} ${h-h*0.15} Z" fill="${bg}" stroke="${bc}" stroke-width="${bw}"/><ellipse cx="${w/2}" cy="${h*0.15}" rx="${w/2-b}" ry="${h*0.15}" fill="${bg}" stroke="${bc}" stroke-width="${bw}"/></svg>`;
  if(tipo==='documento') return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="M ${b} ${b} L ${w-b} ${b} L ${w-b} ${h-h*0.15} Q ${w*0.75} ${h} ${w/2} ${h-h*0.15} T ${b} ${h-h*0.15} Z" fill="${bg}" stroke="${bc}" stroke-width="${bw}"/></svg>`;
  return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><rect x="${b}" y="${b}" width="${w-bw}" height="${h-bw}" rx="8" fill="${bg}" stroke="${bc}" stroke-width="${bw}"/></svg>`;
}

/* ── FLECHAS SVG — FIX PRINCIPAL: setAttribute ── */
function renderEdges(){
  // Eliminar todos los grupos previos
  svgEl.querySelectorAll('[data-edge]').forEach(g=>g.remove());

  E.enlaces.forEach(edge=>{
    const o=E.nodos.find(x=>x.id===edge.o), d=E.nodos.find(x=>x.id===edge.d);
    if(!o||!d)return;
    const p1=port(o,edge.po||'bottom'), p2=port(d,edge.pd||'top');
    const path=calcPath(p1,p2,edge.tipo||'curva', edge.po||'bottom', edge.pd||'top', edge);
    const color=edge.sc||'#6366f1', sw=edge.sw||2;

    const g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('data-edge',edge.id);

    // Marker dinámico para el color
    const markerId = `mkr-${edge.id}`;
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg','marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerUnits', 'userSpaceOnUse');
    marker.setAttribute('markerWidth', '12');
    marker.setAttribute('markerHeight', '12');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '6');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    poly.setAttribute('points', '0 2, 10 6, 0 10');
    poly.setAttribute('fill', color);
    marker.appendChild(poly);
    defs.appendChild(marker);
    g.appendChild(defs);

    // Línea invisible gruesa para facilitar el clic
    const hit=document.createElementNS('http://www.w3.org/2000/svg','path');
    hit.setAttribute('d',path); hit.setAttribute('stroke','transparent');
    hit.setAttribute('stroke-width','16'); hit.setAttribute('fill','none');
    hit.style.cursor='pointer'; hit.style.pointerEvents='stroke';
    hit.addEventListener('mousedown',(ev)=>{
        ev.stopPropagation(); 
        selectItem('flecha',edge.id);
        
        const z = E.config.zoom;
        const startX = ev.clientX/z;
        const startY = ev.clientY/z;
        const startCx = edge.cx !== undefined ? edge.cx : (p1.x + p2.x)/2;
        const startCy = edge.cy !== undefined ? edge.cy : (p1.y + p2.y)/2;
        
        let moved = false;
        function drag(e) {
            moved = true;
            let nx = snap(startCx + (e.clientX/z - startX));
            let ny = snap(startCy + (e.clientY/z - startY));
            
            // Auto-alineado inteligente (ignora la grilla si está muy cerca de los centros o bordes)
            const mx = (p1.x + p2.x)/2, my = (p1.y + p2.y)/2;
            const th = 15; // threshold
            if(Math.abs(nx - mx) < th) nx = mx;
            if(Math.abs(ny - my) < th) ny = my;
            if(Math.abs(nx - p1.x) < th) nx = p1.x;
            if(Math.abs(nx - p2.x) < th) nx = p2.x;
            if(Math.abs(ny - p1.y) < th) ny = p1.y;
            if(Math.abs(ny - p2.y) < th) ny = p2.y;
            
            edge.cx = nx;
            edge.cy = ny;
            renderEdges();
        }
        function up() {
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', up);
            if(moved) mark();
        }
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', up);
    });
    
    hit.addEventListener('dblclick', (ev) => {
        ev.stopPropagation();
        delete edge.cx;
        delete edge.cy;
        renderEdges();
        mark();
    });
    g.appendChild(hit);

    // Línea visible
    const line=document.createElementNS('http://www.w3.org/2000/svg','path');
    line.setAttribute('d',path); line.setAttribute('stroke',color);
    line.setAttribute('stroke-width',String(sw)); line.setAttribute('fill','none');
    line.setAttribute('marker-end',`url(#${markerId})`);
    if(sel?.tipo==='flecha'&&sel.id===edge.id){
      line.setAttribute('stroke-width',String(sw+2));
      line.style.filter=`drop-shadow(0 0 6px ${color})`;
    }
    g.appendChild(line);

    // Etiqueta
    if(edge.lbl){
      const mx=(p1.x+p2.x)/2 + (edge.lx||0), my=(p1.y+p2.y)/2 + (edge.ly||0);
      
      const lblG = document.createElementNS('http://www.w3.org/2000/svg','g');
      lblG.style.cursor = 'grab';
      lblG.style.pointerEvents = 'all';
      
      lblG.addEventListener('mousedown', ev => {
        ev.stopPropagation();
        selectItem('flecha', edge.id);
        const z = E.config.zoom;
        const startX = ev.clientX/z;
        const startY = ev.clientY/z;
        const startLx = edge.lx || 0;
        const startLy = edge.ly || 0;
        
        function drag(e) {
          edge.lx = snap(startLx + (e.clientX/z - startX));
          edge.ly = snap(startLy + (e.clientY/z - startY));
          renderEdges();
        }
        function up() {
          document.removeEventListener('mousemove', drag);
          document.removeEventListener('mouseup', up);
          mark();
        }
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', up);
      });

      const r=document.createElementNS('http://www.w3.org/2000/svg','rect');
      r.setAttribute('x',String(mx-26)); r.setAttribute('y',String(my-11));
      r.setAttribute('width','52'); r.setAttribute('height','22');
      r.setAttribute('rx','4'); r.setAttribute('fill', edge.bg || 'rgba(255,255,255,0.9)');
      r.setAttribute('stroke',color); r.setAttribute('stroke-width','1');
      lblG.appendChild(r);
      const t=document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x',String(mx)); t.setAttribute('y',String(my+4));
      t.setAttribute('text-anchor','middle'); t.setAttribute('fill', edge.tc || color);
      t.setAttribute('font-size','11'); t.setAttribute('font-family','sans-serif');
      t.setAttribute('font-weight','700'); t.textContent=edge.lbl;
      t.style.userSelect='none';
      lblG.appendChild(t);
      g.appendChild(lblG);
    }
    svgEl.appendChild(g);
  });
}

function port(n,pos){
  const cx=n.x+(n.w||140)/2, cy=n.y+(n.h||60)/2;
  
  let side = pos;
  let offset = 0;
  if (pos.includes('-')) {
    const parts = pos.split('-');
    side = parts[0];
    const idx = parseInt(parts[1]);
    if (!isNaN(idx)) {
      offset = idx; // Usamos idx directamente para top/bottom y lo multiplicamos para left/right
    }
  }

  let finalY = cy;
  if (side === 'left' || side === 'right') {
      if (offset > 0) {
          finalY = n.y + 40 + (offset * 20); 
          finalY = Math.min(finalY, n.y + (n.h||60) - 10);
      }
      if(side === 'left') return {x:n.x, y:finalY};
      if(side === 'right') return {x:n.x+(n.w||140), y:finalY};
  }

  let finalX = cx;
  if (side === 'top' || side === 'bottom') {
      if (offset === 1) finalX = n.x + ((n.w||140) * 0.25);
      if (offset === 2) finalX = n.x + ((n.w||140) * 0.75);
      if(side === 'top') return {x:finalX, y:n.y};
      if(side === 'bottom') return {x:finalX, y:n.y+(n.h||60)};
  }
  
  return {x:cx,y:cy};
}

function calcPath(p1,p2,tipo, po, pd, customCp){
  if (customCp && customCp.cx !== undefined && customCp.cy !== undefined) {
      if(tipo === 'ortogonal') {
          return `M${p1.x} ${p1.y} L${customCp.cx} ${p1.y} L${customCp.cx} ${customCp.cy} L${p2.x} ${customCp.cy} L${p2.x} ${p2.y}`;
      } else if(tipo === 'recta') {
          return `M${p1.x} ${p1.y} L${customCp.cx} ${customCp.cy} L${p2.x} ${p2.y}`;
      }
      return `M${p1.x} ${p1.y} Q${customCp.cx} ${customCp.cy} ${p2.x} ${p2.y}`;
  }

  if(tipo==='recta')return `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`;
  if(tipo==='ortogonal'){
    const startHoriz = po === 'left' || po === 'right';
    const endHoriz = pd === 'left' || pd === 'right';
    if(startHoriz && endHoriz) {
        const mx = (p1.x+p2.x)/2;
        return `M${p1.x} ${p1.y} L${mx} ${p1.y} L${mx} ${p2.y} L${p2.x} ${p2.y}`;
    } else if (!startHoriz && !endHoriz) {
        const my = (p1.y+p2.y)/2;
        return `M${p1.x} ${p1.y} L${p1.x} ${my} L${p2.x} ${my} L${p2.x} ${p2.y}`;
    } else if (startHoriz && !endHoriz) {
        return `M${p1.x} ${p1.y} L${p2.x} ${p1.y} L${p2.x} ${p2.y}`;
    } else {
        return `M${p1.x} ${p1.y} L${p1.x} ${p2.y} L${p2.x} ${p2.y}`;
    }
  }
  const dy=Math.max(Math.abs(p2.y-p1.y)*.5,50);
  return `M${p1.x} ${p1.y} C${p1.x} ${p1.y+dy},${p2.x} ${p2.y-dy},${p2.x} ${p2.y}`;
}

/* ── Conexiones ── */
function startConn(id,pos,e){
  cxFrom={id,pos}; modo='connect';
  document.getElementById('mode-connect').classList.add('active');
  document.getElementById('mode-select').classList.remove('active');

  const prev=document.createElementNS('http://www.w3.org/2000/svg','path');
  prev.setAttribute('class','edge-preview'); svgEl.appendChild(prev);

  function mv(ev){
    const n=E.nodos.find(x=>x.id===id); if(!n)return;
    const p=port(n,pos), cp=toCanvas(ev.clientX,ev.clientY);
    prev.setAttribute('d',`M${p.x} ${p.y} L${cp.x} ${cp.y}`);
  }
  function up(ev){
    prev.remove();
    document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up);
    const tEl=document.elementFromPoint(ev.clientX,ev.clientY);
    const tNode=tEl?.closest('.diagram-node');
    const destPos = tEl?.classList.contains('conn-port') ? tEl.dataset.pos : 'left';
    if(tNode&&tNode.dataset.id!==id) makeEdge(id,pos,tNode.dataset.id,destPos);
    cxFrom=null; modo='select';
    document.getElementById('mode-connect').classList.remove('active');
    document.getElementById('mode-select').classList.add('active');
    renderNodes();
  }
  document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
}

function clickConnect(id){
  if(!cxFrom){cxFrom={id,pos:'right'};renderNodes();return;}
  if(cxFrom.id===id){cxFrom=null;renderNodes();return;}
  makeEdge(cxFrom.id,cxFrom.pos,id,'left');
  cxFrom=null; modo='select';
  document.getElementById('mode-connect').classList.remove('active');
  document.getElementById('mode-select').classList.add('active');
  renderNodes();
}

function makeEdge(oId,oPos,dId,dPos){
  E.enlaces.push({id:'e'+uid().slice(1),o:oId,d:dId,po:oPos,pd:dPos,tipo:'curva',lbl:'',sc:'#6366f1',sw:2});
  renderEdges(); mark(); toast('Conexión creada','success');
}

/* ── Selección ── */
function selectItem(tipo,id){
  sel={tipo,id}; renderAll(); showProps();
}
function deselect(){
  sel=null; renderAll();
  document.getElementById('props-empty').style.display='';
  document.getElementById('props-nodo').style.display='none';
  document.getElementById('props-flecha').style.display='none';
}

/* ── Panel Props ── */
function showProps(){
  document.getElementById('props-empty').style.display='none';
  if(sel?.tipo==='nodo'){
    const n=E.nodos.find(x=>x.id===sel.id); if(!n)return;
    const s=n.estilo||{};
    document.getElementById('props-nodo').style.display='';
    document.getElementById('props-flecha').style.display='none';
    document.getElementById('prop-bg-color').value=s.bg||'#1e293b';
    document.getElementById('prop-border-color').value=s.bc||'#6366f1';
    document.getElementById('prop-border-width').value=s.bw||2;
    document.getElementById('prop-text-color').value=s.tc||'#ffffff';
    document.getElementById('prop-font-size').value=s.fs||14;
    document.getElementById('prop-width').value=n.w||140;
    document.getElementById('prop-height').value=n.h||60;
    document.getElementById('prop-bold').classList.toggle('active',s.fw==='bold');
    document.getElementById('prop-italic').classList.toggle('active',s.fi==='italic');
  }else if(sel?.tipo==='flecha'){
    const edge=E.enlaces.find(x=>x.id===sel.id); if(!edge)return;
    document.getElementById('props-nodo').style.display='none';
    document.getElementById('props-flecha').style.display='';
    document.getElementById('prop-linea-tipo').value=edge.tipo||'curva';
    document.getElementById('prop-stroke-color').value=edge.sc||'#6366f1';
    document.getElementById('prop-stroke-width').value=edge.sw||2;
    document.getElementById('prop-edge-label').value=edge.lbl||'';
    document.getElementById('prop-edge-text-color').value=edge.tc||edge.sc||'#6366f1';
    document.getElementById('prop-edge-bg-color').value=edge.bg||'#ffffff';
  }
}

function getNodoSel(){ return sel?.tipo==='nodo'?E.nodos.find(x=>x.id===sel.id):null; }

function applyNodeStyle(){
  const n=getNodoSel(); if(!n)return;
  n.estilo=n.estilo||{};
  n.estilo.bg=document.getElementById('prop-bg-color').value;
  n.estilo.bc=document.getElementById('prop-border-color').value;
  n.estilo.bw=+document.getElementById('prop-border-width').value;
  n.estilo.tc=document.getElementById('prop-text-color').value;
  n.estilo.fs=+document.getElementById('prop-font-size').value;
  n.w=+document.getElementById('prop-width').value;
  n.h=+document.getElementById('prop-height').value;
  renderAll(); mark();
}
function applyEdgeStyle(){
  if(sel?.tipo!=='flecha')return;
  const edge=E.enlaces.find(x=>x.id===sel.id); if(!edge)return;
  edge.tipo=document.getElementById('prop-linea-tipo').value;
  edge.sc=document.getElementById('prop-stroke-color').value;
  edge.sw=+document.getElementById('prop-stroke-width').value;
  edge.lbl=document.getElementById('prop-edge-label').value;
  edge.tc=document.getElementById('prop-edge-text-color').value;
  edge.bg=document.getElementById('prop-edge-bg-color').value;
  renderEdges(); mark();
}

function setupProps(){
  ['prop-bg-color','prop-border-color','prop-text-color'].forEach(id=>
    document.getElementById(id).addEventListener('input',applyNodeStyle));
  ['prop-border-width','prop-font-size','prop-width','prop-height'].forEach(id=>
    document.getElementById(id).addEventListener('change',applyNodeStyle));
  document.getElementById('prop-bold').addEventListener('click',()=>{
    const n=getNodoSel();if(!n)return;
    n.estilo=n.estilo||{};n.estilo.fw=n.estilo.fw==='bold'?'normal':'bold';
    renderAll();showProps();mark();
  });
  document.getElementById('prop-italic').addEventListener('click',()=>{
    const n=getNodoSel();if(!n)return;
    n.estilo=n.estilo||{};n.estilo.fi=n.estilo.fi==='italic'?'normal':'italic';
    renderAll();showProps();mark();
  });
  document.querySelectorAll('.color-preset').forEach(el=>el.addEventListener('click',()=>{
    const n=getNodoSel();if(!n)return;n.estilo=n.estilo||{};
    if(el.dataset.target==='bg')n.estilo.bg=el.dataset.color;
    if(el.dataset.target==='text')n.estilo.tc=el.dataset.color;
    renderAll();showProps();mark();
  }));
  document.getElementById('btn-duplicar').addEventListener('click',()=>{
    const n=getNodoSel();if(!n)return;
    const c=JSON.parse(JSON.stringify(n));c.id=uid();c.x+=30;c.y+=30;
    E.nodos.push(c);renderAll();mark();
  });
  document.getElementById('btn-eliminar-nodo').addEventListener('click',()=>{
    if(!sel?.id)return;
    E.nodos=E.nodos.filter(x=>x.id!==sel.id);
    E.enlaces=E.enlaces.filter(x=>x.o!==sel.id&&x.d!==sel.id);
    deselect();mark();
  });
  ['prop-linea-tipo','prop-stroke-color','prop-stroke-width','prop-edge-label', 'prop-edge-text-color', 'prop-edge-bg-color'].forEach(id=>{
    document.getElementById(id).addEventListener('input',applyEdgeStyle);
    document.getElementById(id).addEventListener('change',applyEdgeStyle);
  });
  document.getElementById('btn-eliminar-flecha').addEventListener('click',()=>{
    if(!sel?.id)return;
    E.enlaces=E.enlaces.filter(x=>x.id!==sel.id);
    deselect();renderEdges();mark();
  });
}

/* ── Drag desde Toolbox ── */
const DEFAULTS = {
  tabla:      {txt:'Nueva Tabla',bg:'#1e1b4b',bc:'#8b5cf6',w:220,h:100},
  vista:      {txt:'Vista SQL',bg:'#1e293b',bc:'#3b82f6',w:200,h:80},
  rectangulo: {txt:'Nota',bg:'#374151',bc:'#9ca3af',w:160,h:70},
};
function setupDrop(){
  document.querySelectorAll('.tool-item[draggable]').forEach(item=>{
    item.addEventListener('dragstart',ev=>ev.dataTransfer.setData('tipo',item.dataset.tipo));
  });
  container.addEventListener('dragover',ev=>ev.preventDefault());
  container.addEventListener('drop',ev=>{
    ev.preventDefault();
    const tipo=ev.dataTransfer.getData('tipo'); if(!tipo)return;
    const pos=toCanvas(ev.clientX,ev.clientY);
    const d=DEFAULTS[tipo]||DEFAULTS.rectangulo;
    const n={id:uid(),tipo,txt:d.txt,html:'',x:snap(pos.x-d.w/2),y:snap(pos.y-d.h/2),w:d.w,h:d.h,
      estilo:{bg:d.bg,bc:d.bc,bw:2,tc:'#ffffff',fs:14,fw:'normal',fi:'normal'}};
    E.nodos.push(n); renderAll(); selectItem('nodo',n.id); mark();
  });
}

/* ── Pan & Zoom ── */
function setupCanvas(){
  container.addEventListener('wheel',ev=>{
    ev.preventDefault();
    const dz=ev.deltaY>0?-0.08:0.08;
    const nz=Math.min(4,Math.max(0.1,E.config.zoom+dz));
    const r=container.getBoundingClientRect();
    const cx=ev.clientX-r.left, cy=ev.clientY-r.top;
    E.config.panX=cx-(cx-E.config.panX)*(nz/E.config.zoom);
    E.config.panY=cy-(cy-E.config.panY)*(nz/E.config.zoom);
    E.config.zoom=nz; applyT(); mark();
  },{passive:false});

  container.addEventListener('mousedown',ev=>{
    if(ev.target.closest('.diagram-node') || ev.target.closest('.toolbox') || ev.target.closest('.props-panel') || ev.target.closest('.topbar')) return;
    if(ev.target !== container && ev.target.id !== 'canvas-world' && !ev.target.closest('.canvas-svg')) return;
    ev.stopPropagation();
    deselect();
    const sx=ev.clientX-E.config.panX, sy=ev.clientY-E.config.panY;
    container.classList.add('panning');
    function mv(e){E.config.panX=e.clientX-sx;E.config.panY=e.clientY-sy;applyT();}
    function up(){container.classList.remove('panning');document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);mark();}
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
  });

  document.getElementById('btn-zoom-in').addEventListener('click',()=>{E.config.zoom=Math.min(4,E.config.zoom+.15);applyT();mark();});
  document.getElementById('btn-zoom-out').addEventListener('click',()=>{E.config.zoom=Math.max(.1,E.config.zoom-.15);applyT();mark();});
  document.getElementById('btn-zoom-fit').addEventListener('click',()=>{
    if(!E.nodos.length){E.config.zoom=1;E.config.panX=0;E.config.panY=0;applyT();return;}
    const pad=60,r=container.getBoundingClientRect();
    const minX=Math.min(...E.nodos.map(n=>n.x)), minY=Math.min(...E.nodos.map(n=>n.y));
    const maxX=Math.max(...E.nodos.map(n=>n.x+(n.w||140))), maxY=Math.max(...E.nodos.map(n=>n.y+(n.h||60)));
    const z=Math.min((r.width-pad*2)/(maxX-minX||1),(r.height-pad*2)/(maxY-minY||1),2);
    E.config.zoom=z; E.config.panX=pad-minX*z; E.config.panY=pad-minY*z;
    applyT(); mark();
  });
}

/* ── Format Bar ── */
const fbar=document.getElementById('format-bar');
function posFormatBar(el){
  const r=el.getBoundingClientRect();
  fbar.style.top=(r.top-50)+'px'; fbar.style.left=r.left+'px';
  fbar.classList.add('visible');
}
function hideFormatBar(){ fbar.classList.remove('visible'); }
function setupFormatBar(){
  document.getElementById('fb-bold').addEventListener('mousedown',ev=>{ev.preventDefault();document.execCommand('bold');});
  document.getElementById('fb-italic').addEventListener('mousedown',ev=>{ev.preventDefault();document.execCommand('italic');});
  document.getElementById('fb-underline').addEventListener('mousedown',ev=>{ev.preventDefault();document.execCommand('underline');});
  document.getElementById('fb-align-left').addEventListener('mousedown',ev=>{ev.preventDefault();document.execCommand('justifyLeft');});
  document.getElementById('fb-align-center').addEventListener('mousedown',ev=>{ev.preventDefault();document.execCommand('justifyCenter');});
  document.getElementById('fb-align-right').addEventListener('mousedown',ev=>{ev.preventDefault();document.execCommand('justifyRight');});
  document.getElementById('fb-size').addEventListener('change',ev=>{
    const sz=ev.target.value;
    document.execCommand('fontSize',false,'7');
    document.querySelectorAll('font[size="7"]').forEach(f=>{f.removeAttribute('size');f.style.fontSize=sz+'px';});
  });
  document.querySelectorAll('.fmt-color').forEach(el=>el.addEventListener('mousedown',ev=>{
    ev.preventDefault(); document.execCommand('foreColor',false,el.dataset.color);
  }));
}

/* ── Exportar PNG (sin fondo, flechas inline) ── */
function setupExport(){
  document.getElementById('btn-exportar').addEventListener('click',()=>document.getElementById('modal-export').classList.add('visible'));
  ['export-close','export-cancel'].forEach(id=>document.getElementById(id).addEventListener('click',()=>document.getElementById('modal-export').classList.remove('visible')));
  document.getElementById('export-confirm').addEventListener('click',exportPNG);
}

function arrowTip(x2,y2,x1,y1,sz=8){
  // triángulo en la punta de la flecha
  const ang=Math.atan2(y2-y1,x2-x1);
  const a1=ang+2.5, a2=ang-2.5;
  const p1x=x2+sz*Math.cos(a1), p1y=y2+sz*Math.sin(a1);
  const p2x=x2+sz*Math.cos(a2), p2y=y2+sz*Math.sin(a2);
  return `<polygon points="${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}" fill="%COLOR%"/>`;
}

function exportPNG(){
  if(!E.nodos.length){toast('Sin nodos','error');return;}
  const scale=+document.getElementById('export-res').value||2;
  const bgMode=document.getElementById('export-bg').value;
  const pad=50;
  const minX=Math.min(...E.nodos.map(n=>n.x))-pad;
  const minY=Math.min(...E.nodos.map(n=>n.y))-pad;
  const maxX=Math.max(...E.nodos.map(n=>n.x+(n.w||140)))+pad;
  const maxY=Math.max(...E.nodos.map(n=>n.y+(n.h||60)))+pad;
  const W=maxX-minX, H=maxY-minY;

  let bg='';
  if(bgMode==='tema') bg=`<rect width="${W}" height="${H}" fill="${getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim()||'#0f0f17'}"/>`;
  else if(bgMode==='blanco') bg=`<rect width="${W}" height="${H}" fill="#ffffff"/>`;

  const edgeSVG=E.enlaces.map(edge=>{
    const o=E.nodos.find(x=>x.id===edge.o), d=E.nodos.find(x=>x.id===edge.d); if(!o||!d)return'';
    const p1=port(o,edge.po||'bottom'), p2=port(d,edge.pd||'top');
    const pp1={x:p1.x-minX,y:p1.y-minY}, pp2={x:p2.x-minX,y:p2.y-minY};
    const customCp = (edge.cx !== undefined) ? { cx: edge.cx - minX, cy: edge.cy - minY } : null;
    const pth=calcPath(pp1,pp2,edge.tipo||'curva', edge.po||'bottom', edge.pd||'top', customCp);
    const c=edge.sc||'#6366f1', sw=edge.sw||2;
    
    let lastX = pp1.x, lastY = pp1.y;
    if (customCp) {
        if (edge.tipo === 'ortogonal') { lastX = pp2.x; lastY = customCp.cy; }
        else if (edge.tipo === 'recta') { lastX = customCp.cx; lastY = customCp.cy; }
        else { lastX = customCp.cx; lastY = customCp.cy; }
    } else {
        if (edge.tipo === 'ortogonal') {
           const startHoriz = (edge.po === 'left' || edge.po === 'right');
           const endHoriz = (edge.pd === 'left' || edge.pd === 'right');
           if (startHoriz && endHoriz) { lastX = (pp1.x+pp2.x)/2; lastY = pp2.y; }
           else if (!startHoriz && !endHoriz) { lastX = pp2.x; lastY = (pp1.y+pp2.y)/2; }
           else if (startHoriz && !endHoriz) { lastX = pp2.x; lastY = pp1.y; }
           else { lastX = pp1.x; lastY = pp2.y; }
        } else if (edge.tipo === 'curva') {
           const dy=Math.max(Math.abs(pp2.y-pp1.y)*.5,50);
           lastX = pp2.x; lastY = pp2.y - dy;
        }
    }
    
    const tip=arrowTip(pp2.x,pp2.y,lastX,lastY).replace('%COLOR%',c);
    let lbl='';
    if(edge.lbl){
      const mx=(pp1.x+pp2.x)/2 + (edge.lx||0), my=(pp1.y+pp2.y)/2 + (edge.ly||0);
      lbl=`<rect x="${mx-26}" y="${my-11}" width="52" height="22" rx="4" fill="${edge.bg||'rgba(255,255,255,0.9)'}" stroke="${c}" stroke-width="1"/>
      <text x="${mx}" y="${my+4}" text-anchor="middle" fill="${edge.tc||c}" font-size="11" font-family="sans-serif" font-weight="bold">${edge.lbl}</text>`;
    }
    return `<path d="${pth}" stroke="${c}" stroke-width="${sw}" fill="none"/>${tip}${lbl}`;
  }).join('');

  const nodeSVG=E.nodos.map(n=>{
    const nx=n.x-minX,ny=n.y-minY,nw=n.w||140;
    let nh=n.h||60;
    const s=n.estilo||{};
    const bg2=s.bg||'#1e293b',bc=s.bc||'#6366f1',bw=s.bw||2;
    const tc=s.tc||'#fff',fs=s.fs||14,fw=s.fw||'normal',fi=s.fi||'normal';
    
    let htmlContent = '';
    let isTable = false;
    
    if (n.html && n.html.includes('border-bottom')) {
        isTable = true;
        const div = document.createElement('div');
        div.innerHTML = n.html;
        const mainDiv = div.children[0];
        if (mainDiv) {
            const headerText = mainDiv.children[0]?.innerText || n.txt || '';
            const fieldsWrapper = mainDiv.children[1];
            
            let fieldsSVG = '';
            
            if (fieldsWrapper) {
                const fieldCount = fieldsWrapper.children.length;
                // Ajuste automático para cajas antiguas: recalcular altura mínima
                nh = Math.max(nh, 60 + fieldCount * 21);
                
                let currentY = ny + 40 + 20; // 40 header + 20 primer baseline
                Array.from(fieldsWrapper.children).forEach(row => {
                    const b = row.querySelector('b');
                    const span = row.querySelector('span');
                    if (b || span) {
                        const fName = b ? b.innerText : row.innerText.trim();
                        const fType = span ? span.innerText : '';
                        fieldsSVG += `<text x="${nx + 15}" y="${currentY}" font-family="monospace" font-size="13">
                           <tspan fill="#c4b5fd" font-weight="bold">${esc(fName)}</tspan>
                           <tspan fill="#9ca3af" font-size="11"> ${esc(fType)}</tspan>
                        </text>`;
                        currentY += 21;
                    } else {
                        fieldsSVG += `<text x="${nx + 15}" y="${currentY}" fill="#c4b5fd" font-family="monospace" font-size="13" font-weight="bold">${esc(row.innerText)}</text>`;
                        currentY += 21;
                    }
                });
            }
            
            htmlContent = `
            <svg x="${nx}" y="${ny}" width="${nw}" height="${nh}" viewBox="${nx} ${ny} ${nw} ${nh}" overflow="hidden">
                <path d="M ${nx} ${ny+8} Q ${nx} ${ny} ${nx+8} ${ny} L ${nx+nw-8} ${ny} Q ${nx+nw} ${ny} ${nx+nw} ${ny+8} L ${nx+nw} ${ny+40} L ${nx} ${ny+40} Z" fill="rgba(0,0,0,0.3)"/>
                <line x1="${nx}" y1="${ny+40}" x2="${nx+nw}" y2="${ny+40}" stroke="rgba(139, 92, 246, 0.5)" stroke-width="1"/>
                <text x="${nx+nw/2}" y="${ny+25}" text-anchor="middle" fill="${tc}" font-size="14" font-family="monospace" font-weight="bold">${esc(headerText)}</text>
                ${fieldsSVG}
            </svg>`;
        }
    } else {
        htmlContent = `
        <svg x="${nx}" y="${ny}" width="${nw}" height="${nh}" viewBox="${nx} ${ny} ${nw} ${nh}" overflow="hidden">
            <text x="${nx+nw/2}" y="${ny+nh/2+fs*0.35}" text-anchor="middle" fill="${tc}" font-size="${fs}" font-family="sans-serif" font-weight="${fw}" font-style="${fi}">${esc(n.txt||'')}</text>
        </svg>`;
    }
    
    let shape = getShapeSVG(n.tipo, nw, nh, bg2, bc, bw);
    shape = `<svg x="${nx}" y="${ny}" width="${nw}" height="${nh}">${shape}</svg>`;
    
    return `${shape}${htmlContent}`;
  }).join('');

  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bg}${edgeSVG}${nodeSVG}</svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  const img=new Image();
  img.onload=()=>{
    const cv=document.createElement('canvas');
    cv.width=W*scale; cv.height=H*scale;
    const ctx=cv.getContext('2d');
    ctx.scale(scale,scale); ctx.drawImage(img,0,0);
    URL.revokeObjectURL(url);
    const a=document.createElement('a'); a.download=`diagrama_${PID}.png`;
    a.href=cv.toDataURL('image/png'); a.click();
    document.getElementById('modal-export').classList.remove('visible');
    toast('PNG exportado ✓','success');
  };
  img.src=url;
}

/* ── Modos ── */
function setupModes(){
  document.getElementById('mode-select').addEventListener('click',()=>{
    modo='select';cxFrom=null;
    document.getElementById('mode-select').classList.add('active');
    document.getElementById('mode-connect').classList.remove('active');
    renderNodes();
  });
  document.getElementById('mode-connect').addEventListener('click',()=>{
    modo='connect';
    document.getElementById('mode-connect').classList.add('active');
    document.getElementById('mode-select').classList.remove('active');
    renderNodes(); toast('Haz clic en un nodo para conectar','info');
  });
}

/* ── Teclado ── */
function setupKeys(){
  document.addEventListener('keydown',ev=>{
    if((ev.ctrlKey||ev.metaKey)&&ev.key==='s'){ev.preventDefault();save();return;}
    const ae=document.activeElement;
    if(ae&&(ae.isContentEditable||ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'))return;
    if(ev.key==='Delete'||ev.key==='Backspace'){
      if(!sel)return;
      if(sel.tipo==='nodo'){E.nodos=E.nodos.filter(x=>x.id!==sel.id);E.enlaces=E.enlaces.filter(x=>x.o!==sel.id&&x.d!==sel.id);}
      else E.enlaces=E.enlaces.filter(x=>x.id!==sel.id);
      deselect();mark();return;
    }
    if(ev.key==='Escape'){deselect();modo='select';cxFrom=null;renderNodes();}
    if((ev.ctrlKey||ev.metaKey)&&ev.key==='d'){
      ev.preventDefault();const n=getNodoSel();if(!n)return;
      const c=JSON.parse(JSON.stringify(n));c.id=uid();c.x+=30;c.y+=30;
      E.nodos.push(c);renderAll();selectItem('nodo',c.id);mark();
    }
  });
}

/* ── Nombre ── */
function setupName(){
  document.getElementById('diagram-name').addEventListener('change',async ev=>{
    try{await fetch(API,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({titulo:ev.target.value})});toast('Nombre guardado','success');}
    catch{toast('Error','error');}
  });
}

/* ── Generador BD ── */
function setupDBImport(){
  const btn = document.getElementById('btn-generar-db');
  if(!btn) return;
  btn.addEventListener('click',()=>document.getElementById('modal-db').classList.add('visible'));
  ['db-close','db-cancel'].forEach(id=>document.getElementById(id).addEventListener('click',()=>document.getElementById('modal-db').classList.remove('visible')));
  document.getElementById('db-confirm').addEventListener('click',()=>{
    const text = document.getElementById('db-input').value;
    if(!text.trim()){ toast('El texto está vacío','error'); return; }
    
    const tables = [];
    const edges = [];
    
    // Parse CREATE TABLE
    const createRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?['"`]?(\w+)['"`]?\s*\(([\s\S]*?)\);?/gi;
    let match;
    while((match = createRegex.exec(text)) !== null){
      const name = match[1];
      const body = match[2];
      const fields = [];
      const lines = body.split(/,(?![^\(]*\))/);
      lines.forEach(l => {
        l = l.trim();
        if(!l) return;
        if(l.toUpperCase().startsWith('PRIMARY KEY') || l.toUpperCase().startsWith('CONSTRAINT') || l.toUpperCase().startsWith('FOREIGN KEY')){
           const fk = /FOREIGN\s+KEY\s*\([^\)]+\)\s*REFERENCES\s+['"`]?(\w+)['"`]?/i.exec(l);
           if(fk) edges.push({from: name, to: fk[1]});
           return;
        }
        const parts = l.split(/\s+/);
        const fname = parts[0].replace(/['"`]/g, '');
        const ftype = parts.slice(1).join(' ').replace(/['"`]/g, '');
        fields.push(`<div><b style="color:#c4b5fd;">${fname}</b> <span style="font-size:0.8em;color:#9ca3af;">${ftype}</span></div>`);
        
        const ref = /REFERENCES\s+['"`]?(\w+)['"`]?/i.exec(l);
        if(ref) edges.push({from: name, to: ref[1]});
        else if(fname.toLowerCase().endsWith('_id')) edges.push({from: name, toGuess: fname.substring(0,fname.length-3)});
      });
      tables.push({name, fields});
    }
    
    // Parse DBML (Table name { ... } and Ref: ...)
    if(tables.length === 0){
      const dbmlTableRegex = /Table\s+['"`]?(\w+)['"`]?\s*\{([^}]*)\}/gi;
      let match;
      while((match = dbmlTableRegex.exec(text)) !== null){
        const name = match[1];
        const body = match[2];
        const fields = [];
        const lines = body.split('\n');
        lines.forEach(l => {
          l = l.trim();
          if(!l) return;
          const parts = l.split(/\s+/);
          const fname = parts[0].replace(/['"`]/g, '');
          const ftype = parts.slice(1).join(' ').replace(/['"`\[\]]/g, ''); // strip brackets from things like [pk]
          fields.push(`<div><b style="color:#c4b5fd;">${fname}</b> <span style="font-size:0.8em;color:#9ca3af;">${ftype}</span></div>`);
          if(fname.toLowerCase().endsWith('_id')) edges.push({from: name, toGuess: fname.substring(0,fname.length-3)});
        });
        tables.push({name, fields});
      }
      
      const refRegex = /Ref:\s*(\w+)\.\w+\s*(?:>|<|-)\s*(\w+)\.\w+/gi;
      while((match = refRegex.exec(text)) !== null){
        edges.push({from: match[1], to: match[2]});
      }
    }
    
    // Fallback parser (simple list)
    if(tables.length === 0){
       const lines = text.split('\n');
       let cur = null;
       lines.forEach(l => {
         l = l.trim();
         if(!l) return;
         if(l.startsWith('-')){
           if(cur) {
             let f = l.substring(1).trim();
             if(f.includes('->')){
               const p = f.split('->');
               f = p[0].trim();
               edges.push({from: cur.name, to: p[1].trim()});
             } else if(f.toLowerCase().endsWith('_id')){
               edges.push({from: cur.name, toGuess: f.substring(0, f.length-3)});
             }
             cur.fields.push(`<div><b style="color:#c4b5fd;">${f}</b></div>`);
           }
         } else {
           cur = {name: l, fields:[]};
           tables.push(cur);
         }
       });
    }
    
    if(tables.length === 0){ toast('No se encontraron tablas válidas', 'error'); return; }
    
    // Create Nodes
    let curX = 100 - E.config.panX;
    let curY = 100 - E.config.panY;
    let rowMaxH = 0;
    const nodeMap = {}; 
    
    tables.forEach(t => {
      const id = uid();
      nodeMap[t.name.toLowerCase()] = id;
      
      const html = `<div style="text-align:left; width:100%; height:100%; display:flex; flex-direction:column; font-family:monospace; font-size:13px;">
        <div style="background:rgba(0,0,0,0.3); padding:10px; font-weight:bold; text-align:center; border-bottom:1px solid rgba(139, 92, 246, 0.5);">${t.name}</div>
        <div style="padding:10px; flex:1; overflow-y:auto; line-height:1.6;">${t.fields.join('')}</div>
      </div>`;
      
      const w = 220;
      const h = Math.max(100, 60 + t.fields.length * 21);
      rowMaxH = Math.max(rowMaxH, h);
      
      const n = {
        id, tipo:'rectangulo', txt:t.name, html, x:snap(curX), y:snap(curY), w, h,
        estilo: {bg:'#1e1b4b', bc:'#8b5cf6', bw:2, tc:'#ffffff', fs:14}
      };
      E.nodos.push(n);
      
      curX += w + 60;
      if(curX > 900 - E.config.panX){ curX = 100 - E.config.panX; curY += rowMaxH + 60; rowMaxH = 0; }
    });
    
    // Create Edges
    const outCounts = {};
    const inCounts = {};
    
    edges.forEach(e => {
      const fromId = nodeMap[e.from.toLowerCase()];
      let toId = nodeMap[e.to?.toLowerCase()];
      if(!toId && e.toGuess) {
         toId = nodeMap[e.toGuess.toLowerCase()] || nodeMap[e.toGuess.toLowerCase()+'s'] || nodeMap[e.toGuess.toLowerCase()+'es'];
      }
      if(fromId && toId && fromId !== toId){
        if(!E.enlaces.some(x => x.o === fromId && x.d === toId)){
          outCounts[fromId] = (outCounts[fromId] || 0) + 1;
          inCounts[toId] = (inCounts[toId] || 0) + 1;
          
          let po = 'right-' + outCounts[fromId];
          let pd = 'left-' + inCounts[toId];
          
          E.enlaces.push({
            id: 'e'+uid().slice(1), o: fromId, d: toId, po: po, pd: pd,
            tipo: 'ortogonal', lbl: '', sc: '#8b5cf6', sw: 2
          });
        }
      }
    });
    
    document.getElementById('modal-db').classList.remove('visible');
    renderAll();
    mark();
    toast('BD Importada ✓', 'success');
  });
}

function setupHelp() {
  const btn = document.getElementById('btn-ayuda');
  const modal = document.getElementById('modal-ayuda');
  const btnClose = document.getElementById('modal-ayuda-close');
  const btnCerrar = document.getElementById('btn-ayuda-cerrar');
  if(btn && modal) {
    btn.addEventListener('click', () => modal.classList.add('visible'));
    const closeFn = () => modal.classList.remove('visible');
    if(btnClose) btnClose.addEventListener('click', closeFn);
    if(btnCerrar) btnCerrar.addEventListener('click', closeFn);
  }
}

/* ── INIT ── */
async function init(){
  await load();
  setupDrop(); setupCanvas(); setupFormatBar(); setupExport();
  setupModes(); setupProps(); setupKeys(); setupName(); setupDBImport(); setupHelp();
  document.getElementById('btn-guardar').addEventListener('click',save);
  document.getElementById('snap-grid').addEventListener('change',()=>mark());

  const btnExportRikka = document.getElementById('btn-export-rikka');
  if(btnExportRikka) {
      btnExportRikka.addEventListener('click', async () => {
          try {
              toast('Preparando exportación...', 'info');
              const res = await fetch(`/api/dbdiagrams/proyectos/${PID}/exportar`);
              if (!res.ok) throw new Error();
              const data = await res.json();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${E.config.titulo || 'DiagramaBD'}.rikka`;
              a.click();
              URL.revokeObjectURL(url);
              toast('Proyecto exportado exitosamente.', 'success');
          } catch (err) {
              toast('Error al exportar.', 'error');
          }
      });
  }
}
init();

