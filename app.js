const $ = (s) => document.querySelector(s);
const out = $('#out');
const esc = (s) => (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + t.dataset.tab));
  out.innerHTML = '';
});
$('#txt').oninput = e => $('#chars').textContent = e.target.value.length;

function veredicto(puntos){
  if (puntos >= 85) return ['verde','Puedes publicarlo','Está limpio. Revisa solo el contexto del día.'];
  if (puntos >= 60) return ['ambar','Corrige antes de subir','Hay puntos que te restan y se arreglan en un minuto.'];
  return ['rojo','No lo publiques así','Esto te puede costar una campaña o un disgusto legal.'];
}

function pintar(puntos, hallazgos, extra=''){
  const [cls, titulo] = veredicto(puntos);
  const graves = hallazgos.filter(h => h.sev >= 2).length;
  let h = `<div class="verdict ${cls}">
    <div class="score"><b>${puntos}</b><span>/100</span></div>
    <div><p class="vl">${titulo}</p><p class="vs">${graves ? graves + ' punto' + (graves>1?'s':'') + ' a corregir' : 'Sin riesgos relevantes'}</p></div>
  </div>`;
  for (const x of hallazgos){
    const sevTxt = x.sev===3?'Grave':x.sev===2?'Revisar':x.sev===1?'Menor':'Dato';
    h += `<div class="find s${x.sev}">
      <div class="fh"><span class="tag">${esc(x.catNombre||x.cat||'Foto')}</span><span class="sev">${sevTxt}</span></div>
      <p class="fm">${esc(x.msg)}</p>
      <p class="ff"><b>Cómo lo arreglo:</b> ${esc(x.fix)}</p>
    </div>`;
  }
  h += extra;
  out.innerHTML = h;
}

$('#go-texto').onclick = () => {
  const t = $('#txt').value.trim();
  if (!t){ out.innerHTML = '<p class="hint">Escribe o pega el texto que vas a publicar.</p>'; return; }
  const r = RT.analizar(t, {red: $('#red').value});
  const p = r.propuesta;
  let extra = '';
  if (p && p.cambios.length){
    extra = `<div class="prop">
      <div class="ph"><span>Versión propuesta</span><button id="cp">Copiar</button></div>
      <pre>${esc(p.texto)}</pre>
      <ul class="chg">${p.cambios.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>
    </div>`;
  }
  pintar(r.puntos, r.hallazgos, extra);
  const cp = $('#cp');
  if (cp) cp.onclick = () => { navigator.clipboard.writeText(p.texto); cp.textContent = 'Copiado'; };
};

const CHK = {
  menores: [3,'Sale un menor de edad.','Necesitas permiso escrito del padre, madre o tutor, y si hay dinero o marca de por medio, contrato de cesión de imagen. Sin eso no se publica.'],
  permiso: [3,'Sale alguien que no ha dado permiso.','Derecho de imagen (LO 1/1982): cualquier persona identificable puede reclamar. Pide permiso por escrito o recorta.'],
  marca: [2,'Marca o logo visible.','Si la publicación es comercial, una marca ajena puede leerlo como uso no autorizado. Etiqueta al acuerdo o difumina el logo.'],
  documento: [3,'Documentos, pantallas o matrículas.','Puedes estar mostrando datos de terceros. Tapa la información antes de subir.'],
  casa: [3,'Se identifica tu casa o tu coche.','Riesgo de seguridad y de doxxing. Cambia el encuadre o publica otra toma.']
};

let FOTO = null;
const drop = $('#drop'), fileIn = $('#file');
drop.onclick = () => fileIn.click();
['dragover','dragenter'].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.add('hot'); }));
['dragleave','drop'].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.remove('hot'); }));
drop.addEventListener('drop', ev => { const f = ev.dataTransfer.files[0]; if (f) poner(f); });
fileIn.onchange = e => { if (e.target.files[0]) poner(e.target.files[0]); };

function poner(f){
  if (!f.type.startsWith('image/')) return;
  FOTO = f;
  const img = $('#prev'); img.src = URL.createObjectURL(f); img.classList.add('on');
  $('.d1').textContent = f.name;
}

$('#go-foto').onclick = async () => {
  if (!FOTO){ out.innerHTML = '<p class="hint">Elige primero una foto.</p>'; return; }
  const btn = $('#go-foto'); btn.disabled = true; btn.textContent = 'Analizando…';
  try {
    const r = await RF.analizar(FOTO);
    const hallazgos = [...r.hallazgos];
    document.querySelectorAll('.check input:checked').forEach(c => {
      const [sev,msg,fix] = CHK[c.value];
      hallazgos.push({sev, msg, fix, cat:'Contexto', catNombre:'Contexto'});
    });
    hallazgos.sort((a,b)=>b.sev-a.sev);
    const W={3:18,2:10,1:4,0:0};
    const puntos = Math.max(5, 100 - hallazgos.reduce((s,h)=>s + (W[h.sev]||0), 0));
    const m = r.medidas;
    const extra = `<p class="hint">${m.W}×${m.H} px · nitidez ${m.nitidez} · brillo ${m.brillo} · proporción ${m.ratio}:1</p>`;
    pintar(puntos, hallazgos, extra);
    out.scrollIntoView({behavior:'smooth', block:'start'});
  } catch(e){
    out.innerHTML = '<p class="hint">No he podido leer esa imagen. Prueba con JPG o PNG.</p>';
  }
  btn.disabled = false; btn.textContent = 'Analizar foto';
};
