const RT = (() => {
  const R = [];
  const add = (o) => R.push(o);
  const CAT = { legal:'Legal', marca:'Marca', reputacion:'Reputación', idioma:'Idioma', formato:'Formato', plataforma:'Plataforma', privacidad:'Privacidad' };

  // --- LEGAL / PUBLICIDAD ---
  add({id:'sorteo', cat:'legal', sev:3, re:/\b(sorteo|sorteamos|rifa|sorteito)\b/i, not:/bases|consulta las condiciones|condiciones del sorteo/i,
    msg:'Anuncias un sorteo sin bases ni condiciones.',
    fix:'Añade bases: quién puede participar, fechas, cómo se elige al ganador y que no está vinculado a Instagram.'});
  add({id:'claim', cat:'legal', sev:3, re:/\b(el mejor|la mejor|n[uú]mero 1|garantizado|milagro|100% efectivo|cura|curar)\b/i,
    msg:'Claim absoluto o promesa que no puedes demostrar.',
    fix:'Cámbialo por algo verificable: «el más escuchado de mi carrera», «+2 M de reproducciones»…'});
  add({id:'juego', cat:'legal', sev:3, re:/\b(apuestas?|casino|1xbet|bet365|ruleta|tragaperras|apuesta deportiva)\b/i,
    msg:'Publicidad de juego: en España solo puede hacerla un operador con licencia y nunca a menores.',
    fix:'Retíralo o tramítalo como publicidad autorizada con aviso +18.'});
  add({id:'publi', cat:'legal', sev:3, re:/\b(en colaboraci[oó]n con|gracias a|regalo de|me han enviado)\b/i, not:/#?publi|#ad|publicidad|patrocinado|colaboraci[oó]n pagada/i,
    msg:'Posible publicidad encubierta.',
    fix:'Marca el contenido como publicidad: «#publi» o «Publicidad» al principio del texto.'});
  add({id:'precio', cat:'legal', sev:2, re:/\d+\s?(€|euros)|precio/i, not:/iva|impuestos|gastos|desde/i,
    msg:'Precio sin condiciones.',
    fix:'Indica si el IVA está incluido, gastos de gestión y si hay límite de unidades.'});
  add({id:'urgencia', cat:'legal', sev:2, re:/\b([uú]ltimas entradas|[uú]ltimos d[ií]as|solo hoy|quedan pocas)\b/i,
    msg:'Urgencia comercial que debe ser cierta: si se repite a diario pierde credibilidad y puede ser publicidad engañosa.',
    fix:'Pon el dato real: «quedan 40 entradas» o la fecha límite exacta.'});

  // --- SUSTANCIAS / VIOLENCIA / ODIO ---
  add({id:'drogas', cat:'marca', sev:3, re:/\b(porro|porros|hach[ií]s|mar[ií]huana|coca[ií]na|farlopa|pastis|pastillas|droga|drogas|coloc[oó]n)\b/i,
    msg:'Referencia a drogas. Las plataformas limitan su alcance y las marcas lo evitan.',
    fix:'Quita la referencia o cámbiala por una metáfora sin sustancia explícita.'});
  add({id:'alcohol', cat:'marca', sev:2, re:/\b(borrach[oa]|pedo|resaca|cerveza|whisky|ron|gin|cubata|chupito)\b/i,
    msg:'Alcohol en el texto: contenido restringido para menores y para según qué marcas.',
    fix:'Si la marca no es de alcohol, evítalo. Si lo es, añade +18.'});
  add({id:'violencia', cat:'marca', sev:3, re:/\b(matar|mato|pistola|navaja|sangre|apunal|dispar|paliza)\b/i,
    msg:'Violencia explícita: riesgo de retirada y de perder acuerdos de marca.',
    fix:'Reformula sin violencia literal.'});
  add({id:'odio', cat:'marca', sev:3, re:/\b(maric[oó]n|sudaca|moro de mierda|retrasad[oa]|no homo|no soy racista)\b/i,
    msg:'Expresión discriminatoria. Es motivo de retirada inmediata y de cancelación de campañas.',
    fix:'Elimínalo. No hay reformulación posible.'});
  add({id:'beef', cat:'reputacion', sev:3, re:/\b(beef|indirecta|pulla|clown|tiradera|se cree|payaso)\b/i,
    msg:'Entras en conflicto público. Genera alcance a corto plazo y desgasta la marca a medio.',
    fix:'Si es estrategia, avisa al sello antes. Si no, déjalo en borradores 24 h.'});
  add({id:'politica', cat:'reputacion', sev:2, re:/\b(pol[ií]tica|vox|psoe|pp|podemos|s[aá]nchez|ayuso|independen)\b/i,
    msg:'Posicionamiento político: divide a la audiencia y complica patrocinios.',
    fix:'Si no es el eje de tu proyecto, mantenlo fuera del perfil profesional.'});

  // --- TONO / REPUTACIÓN ---
  add({id:'queja', cat:'reputacion', sev:3, re:/\b(no me pagan|me deben|estafa|impresentable|sinverg[uü]enza|mierda de (sello|discogr[aá]fica|promotor))\b/i,
    msg:'Queja pública contra un sello, promotor o marca.',
    fix:'Resuélvelo por privado. En público te resta credibilidad ante futuros socios.'});
  add({id:'salud', cat:'reputacion', sev:2, re:/\b(depresi[oó]n|ansiedad|suicid|autolesi|trastorno|medicaci[oó]n)\b/i,
    msg:'Salud mental: tema sensible. Bien tratado suma; mal tratado puede romper a quien lo lee.',
    fix:'Habla en primera persona y ofrece un recurso (024 en España). Evita detalles explícitos.'});
  add({id:'vulgar', cat:'marca', sev:1, re:/\b(puta|joder|mierda|coño|hostia|gilipollas|cabr[oó]n)\b/i,
    msg:'Vulgaridad. Encaja en según qué artistas; en perfil profesional cierra puertas de marca.',
    fix:'Déjalo solo si es parte de tu voz y no hay campaña activa.'});

  // --- IDIOMA ---
  const faltas = [
    [/\ba sido\b/gi,'ha sido'],[/\bhan habido\b/gi,'ha habido'],[/\bhabían muchas?\b/gi,'había muchas'],
    [/\bdijistes\b/gi,'dijiste'],[/\bvinistes\b/gi,'viniste'],[/\bhizo\b(?=\s+falta)/gi,'hizo'],
    [/\bhaber si\b/gi,'a ver si'],[/\ba ver\b(?=\s+(que|como|si))/gi,'a ver'],
    [/\bporque\b(?=\s*[?])/gi,'por qué'],[/\bmas\b(?!\s+sin)/gi,'más'],
    [/\btambien\b/gi,'también'],[/\baqui\b/gi,'aquí'],[/\basi\b/gi,'así'],[/\bnumero\b/gi,'número'],
    [/\bmusica\b/gi,'música'],[/\bproximo\b/gi,'próximo'],[/\bsesion\b/gi,'sesión'],[/\balbum\b/gi,'álbum'],
    [/\bexito\b/gi,'éxito'],[/\bdia\b/gi,'día'],[/\bgira\b(?=\s+misma)/gi,'gira'],
    [/\bescribeme\b/gi,'escríbeme'],[/\bmandame\b/gi,'mándame'],[/\bdimelo\b/gi,'dímelo'],
    [/\bdejame\b/gi,'déjame'],[/\bcallate\b/gi,'cállate'],[/\bmiralo\b/gi,'míralo'],[/\bescuchalo\b/gi,'escúchalo'],
    [/\bsubelo\b/gi,'súbelo'],[/\bbajalo\b/gi,'bájalo'],[/\bcuentame\b/gi,'cuéntame'],[/\bexplicame\b/gi,'explícame'],
    [/\bsino\b(?=\s+(que|es))/gi,'si no'],[/\bhecho\b(?=\s+(de menos))/gi,'echo'],
  ];
  add({id:'ortografia', cat:'idioma', sev:2, re:/.+/, check:(t)=>{
      const hits=[];
      for(const [re,ok] of faltas){ const m=t.match(re); if(m && m[0].toLowerCase()!==ok.toLowerCase()) hits.push([m[0],ok]); }
      return hits.slice(0,4);
    },
    msg:'Faltas o tildes que restan credibilidad.',
    fix:'Corrige antes de publicar: un texto sin tildes parece descuidado.'});

  // --- PRIVACIDAD ---
  add({id:'tel', cat:'privacidad', sev:3, re:/\b(\+34\s?)?[6789]\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/,
    msg:'Has escrito un teléfono. Queda indexado y se usa para spam y estafas.',
    fix:'Quita el número y remite a DM o al enlace de contacto.'});
  add({id:'dir', cat:'privacidad', sev:3, re:/\b(calle|c\/|avda|avenida|plaza|urbanizaci[oó]n)\s+[A-ZÁÉÍÓÚ][\wáéíóúñ ]{2,},?\s*\d{1,3}/i,
    msg:'Dirección con número: expones dónde vives o dónde estás.',
    fix:'Publica solo la ciudad o el nombre del local.'});
  add({id:'matricula', cat:'privacidad', sev:2, re:/\b\d{4}\s?[A-Z]{3}\b/,
    msg:'Posible matrícula de vehículo. Es dato personal.',
    fix:'Tápala o recorta la foto.'});

  // --- FORMATO ---
  add({id:'caps', cat:'formato', sev:2, check:(t)=>{const L=[...t].filter(c=>/[a-záéíóúñ]/i.test(c));const up=[...t].filter(c=>/[A-ZÁÉÍÓÚÑ]/.test(c));return (L.length>25 && up.length/L.length>1.1)?[1]:[]},
    msg:'Todo en mayúsculas: la plataforma lo penaliza y se lee como grito.',
    fix:'Déjalo en minúsculas y destaca solo una palabra.'});
  add({id:'hashtags', cat:'formato', sev:2, re:/(#[\wáéíóúñ]+[\s,]*){12,}/i,
    msg:'Demasiados hashtags. Instagram penaliza el relleno desde 2024.',
    fix:'Deja entre 3 y 5, mezclando uno de nicho y uno de ciudad.'});
  add({id:'emojis', cat:'formato', sev:1, re:/([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}].*){7,}/u,
    msg:'Exceso de emojis: resta seriedad al mensaje.',
    fix:'Máximo dos, y solo si aportan información.'});
  add({id:'sincta', cat:'formato', sev:1, re:/\b(escucha|ya disponible|estreno|sale)\b/i, not:/link|bio|enlace|comenta|guarda|comparte|pre-save|presave/i,
    msg:'Anuncias algo pero no dices qué hacer.',
    fix:'Cierra con una acción: «Escúchalo en el link de la bio», «Guárdalo para el finde».'});
  add({id:'cliche', cat:'formato', sev:1, re:/\b(estoy muy contento de anunciar|feliz de compartir|no os vais a creer|esto es solo el principio)\b/i,
    msg:'Fórmula gastada: no aporta nada y se salta al leer.',
    fix:'Empieza por el dato o por la fecha. El gancho va en la primera línea.'});

  const LIM = { instagram:2200, tiktok:2200, x:280, facebook:63206, youtube:5000 };
  function limpiar(t){ return (t||'').replace(/\s+\n/g,'\n').trim(); }

  function analizar(texto, opts={}){
    const t = limpiar(texto), red = opts.red || 'instagram';
    const out = [];
    for (const r of R){
      let hit = false, datos = null;
      if (r.check){ datos = r.check(t); hit = datos && datos.length ? true : false; }
      else if (r.re && r.re.test(t)) hit = !(r.not && r.not.test(t));
      if (!hit) continue;
      if (r.id==='ortografia' && !datos) continue;
      out.push({id:r.id, cat:r.cat, catNombre:CAT[r.cat], sev:r.sev, msg:r.msg, fix:r.fix, datos});
    }
    if (LIM[red] && t.length > LIM[red]) out.push({id:'largo', cat:'formato', catNombre:'Formato', sev:2,
      msg:`El texto tiene ${t.length} caracteres y en ${red} el límite es ${LIM[red]}.`,
      fix:'Recorta el primer párrafo o mueve el resto a comentario fijado.'});
    if (t.length < 40) out.push({id:'corto', cat:'formato', catNombre:'Formato', sev:1,
      msg:'Texto muy corto: no das contexto ni motivo para pararse.',
      fix:'Añade qué es, cuándo y qué quieres que haga quien lo lea.'});
    out.sort((a,b)=>b.sev-a.sev);
    const W={3:14,2:8,1:3,0:0};
    const puntos = Math.max(5, 100 - out.reduce((s,h)=>s + (W[h.sev]||0), 0));
    const veredicto = puntos>=85 ? 'verde' : puntos>=60 ? 'ambar' : 'rojo';
    return {puntos, veredicto, hallazgos:out, red, chars:t.length, propuesta:reescribir(t,out)};
  }

  function reescribir(t, hallazgos){
    let s = t, cambios = [];
    const ids = new Set(hallazgos.map(h=>h.id));
    for (const [re,ok] of faltas){ const m=s.match(re); if(m && m[0].toLowerCase()!==ok.toLowerCase()){ s=s.replace(re,ok); cambios.push('Ortografía corregida'); } }
    if (ids.has('tel')){ s = s.replace(/\b(\+34\s?)?[6789]\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g,''); cambios.push('Teléfono eliminado'); }
    if (ids.has('dir')){ s = s.replace(/\b(calle|c\/|avda|avenida|plaza)\s+[A-ZÁÉÍÓÚ][\wáéíóúñ ]{2,},?\s*\d{1,3}/gi,''); cambios.push('Dirección eliminada'); }
    if (ids.has('caps')){ s = s.toLowerCase().replace(/(^\w|\.\s*\w)/g, m=>m.toUpperCase()); cambios.push('Mayúsculas normalizadas'); }
    if (ids.has('hashtags')){ const hs=[...s.matchAll(/#[\wáéíóúñ]+/g)].map(m=>m[0]); s = s.replace(/(#[\wáéíóúñ]+[\s,]*){12,}/i, hs.slice(0,5).join(' ')+' '); cambios.push('Hashtags reducidos a 5'); }
    if (ids.has('emojis')){ let c=0; s = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, m => (++c<=2? m : '')); cambios.push('Emojis reducidos'); }
    if (ids.has('publi') || ids.has('colab')){ s = 'Publicidad · ' + s.replace(/^Publicidad · /,''); cambios.push('Aviso de publicidad añadido'); }
    if (ids.has('sincta')){ s = s.trim().replace(/[\s.]+$/,'') + '\n\nEscúchalo en el enlace de la bio.'; cambios.push('Llamada a la acción añadida'); }
    if (ids.has('drogas')||ids.has('violencia')||ids.has('odio')||ids.has('juego')){
      s = s.replace(/\b(porro|porros|hach[ií]s|mar[ií]huana|coca[ií]na|farlopa|pastis|matar|pistola|navaja|apuestas?|casino|1xbet)\b/gi,'…');
      cambios.push('Términos de riesgo sustituidos: revísalos, aquí no hay arreglo automático');
    }
    s = s.replace(/[ \t]{2,}/g,' ').replace(/\n{3,}/g,'\n\n').trim();
    return {texto:s, cambios:[...new Set(cambios)]};
  }

  return { analizar, CAT, total: R.length };
})();
window.RT = RT;
