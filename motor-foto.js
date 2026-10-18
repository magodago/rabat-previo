const RF = (() => {
  function u16(v,le,o){ return le ? v.getUint16(o,true) : v.getUint16(o,false); }
  function u32(v,le,o){ return le ? v.getUint32(o,true) : v.getUint32(o,false); }

  function exif(buf){
    const v = new DataView(buf); const info = {};
    if (v.getUint16(0) !== 0xFFD8) return info;
    let off = 2;
    while (off < v.byteLength - 4){
      if (v.getUint16(off) !== 0xFFE1){ off += 2 + v.getUint16(off+2); continue; }
      const start = off + 4;
      if (v.getUint32(start) !== 0x45786966) { off += 2 + v.getUint16(off+2); continue; }
      const tiff = start + 6, le = v.getUint16(tiff) === 0x4949;
      const ifd0 = tiff + u32(v, le, tiff + 4);
      const n0 = u16(v, le, ifd0);
      let gpsPtr = 0;
      for (let i=0;i<n0;i++){
        const e = ifd0 + 2 + i*12, tag = u16(v,le,e), type = u16(v,le,e+2), cnt = u32(v,le,e+4);
        const valOff = e + 8;
        if (tag === 0x010F) info.marca = str(v,le,valOff,cnt,tiff);
        if (tag === 0x0110) info.modelo = str(v,le,valOff,cnt,tiff);
        if (tag === 0x0132) info.fecha = str(v,le,valOff,cnt,tiff);
        if (tag === 0x8825) gpsPtr = u32(v,le,valOff);
        if (tag === 0x8769){ const ex = tiff + u32(v,le,valOff), ne = u16(v,le,ex);
          for (let j=0;j<ne;j++){ const ee = ex+2+j*12, tg = u16(v,le,ee);
            if (tg === 0x9003) info.fecha = str(v,le,ee+8,u32(v,le,ee+4),tiff);
            if (tg === 0xA002) info.anchoExif = u32(v,le,ee+8);
          }}
      }
      if (gpsPtr){
        const g = tiff + gpsPtr, ng = u16(v,le,g);
        let lat=null, lon=null, latR='', lonR='';
        const rat = (o,k) => u32(v,le,o+k*8) / (u32(v,le,o+k*8+4)||1);
        const rac = (o) => rat(o,0) + rat(o,1)/60 + rat(o,2)/3600;
        for (let k=0;k<ng;k++){
          const e = g+2+k*12, tg = u16(v,le,e);
          if (tg===1) latR = String.fromCharCode(v.getUint8(e+8));
          if (tg===3) lonR = String.fromCharCode(v.getUint8(e+8));
          if (tg===2) lat = rac(tiff + u32(v,le,e+8));
          if (tg===4) lon = rac(tiff + u32(v,le,e+8));
        }
        if (lat!=null && lon!=null){ if(latR==='S') lat=-lat; if(lonR==='W') lon=-lon;
          info.gps = {lat: +lat.toFixed(5), lon: +lon.toFixed(5)}; }
      }
      break;
    }
    return info;
  }
  function str(v,le,off,cnt,base){
    let s='', o = cnt>4 ? base + u32(v,le,off) : off;
    for (let i=0;i<cnt-1;i++){ const c=v.getUint8(o+i); if(!c) break; s+=String.fromCharCode(c); }
    return s.trim();
  }

  async function medir(file){
    const bmp = await createImageBitmap(file);
    const W = bmp.width, H = bmp.height;
    const side = 420, sc = Math.min(1, side/Math.max(W,H));
    const w = Math.max(1, Math.round(W*sc)), h = Math.max(1, Math.round(H*sc));
    const c = document.createElement('canvas'); c.width=w; c.height=h;
    const g = c.getContext('2d', {willReadFrequently:true});
    g.drawImage(bmp, 0, 0, w, h);
    const d = g.getImageData(0,0,w,h).data;
    let sum=0, sum2=0, sat=0, n=w*h;
    const px = new Float32Array(n);
    for (let i=0,p=0;i<d.length;i+=4,p++){
      const r=d[i], gg=d[i+1], b=d[i+2];
      const l = 0.2126*r + 0.7152*gg + 0.0722*b;
      px[p]=l; sum+=l; sum2+=l*l;
      const mx=Math.max(r,gg,b), mn=Math.min(r,gg,b);
      sat += mx===0?0:(mx-mn)/mx;
    }
    const brillo = sum/n, contraste = Math.sqrt(Math.max(0,sum2/n - brillo*brillo));
    let lapSum=0, lapSum2=0, cnt=0;
    for (let y=1;y<h-1;y++) for (let x=1;x<w-1;x++){
      const i=y*w+x;
      const v = 4*px[i]-px[i-1]-px[i+1]-px[i-w]-px[i+w];
      lapSum+=v; lapSum2+=v*v; cnt++;
    }
    const nitidez = cnt ? (lapSum2/cnt - (lapSum/cnt)**2) : 0;
    bmp.close && bmp.close();
    return {W,H,brillo:+brillo.toFixed(1),contraste:+contraste.toFixed(1),
      nitidez:Math.round(nitidez), saturacion:+(sat/n).toFixed(2),
      ratio:+(W/H).toFixed(2)};
  }

  async function analizar(file){
    const m = await medir(file);
    let ex = {};
    try { ex = exif(await file.arrayBuffer()); } catch(e){}
    const out = [];
    const push=(sev,msg,fix)=>out.push({sev,msg,fix,cat:'Foto'});
    if (ex.gps){
      push(3, `La foto lleva la ubicación grabada (${ex.gps.lat}, ${ex.gps.lon}) y cualquiera puede extraerla.`,
        'Bórrala antes de subir: en iOS al compartir elige «Sin ubicación»; en Android, quita el permiso de ubicación a la cámara o edita los metadatos.');
    }
    if (m.W < 1080) push(2, `Resolución baja: ${m.W}×${m.H}. En el feed se verá blanda.`, 'Sube el original, no una copia de WhatsApp ni una captura.');
    if (m.ratio < 0.75 || m.ratio > 1.95) push(2, `Proporción ${m.ratio}:1. Instagram recortará los bordes.`, 'Recorta a 4:5 (vertical) o 1.91:1 (horizontal) antes de subir.');
    if (m.nitidez < 90) push(2, `La imagen sale poco nítida (nitidez ${m.nitidez}).`, 'Usa una foto sin zoom digital ni movimiento. Si es una captura, pide el archivo original.');
    if (m.brillo < 45) push(2, 'Está subexpuesta: en el móvil se verá casi negra.', 'Súbela de exposición o elige otra toma.');
    if (m.brillo > 215) push(2, 'Está sobreexpuesta: pierde detalle en las luces.', 'Baja las altas luces antes de publicar.');
    if (m.saturacion > 0.72) push(1, 'Saturación muy alta: parece filtro de terceros.', 'Baja la saturación y deja respirar el color de piel.');
    if (/screenshot|captura|whatsapp|img_\d{4}/i.test(file.name) && m.W < 1440)
      push(2, 'Parece una captura o un archivo reenviado: pierde calidad y arrastra datos.', 'Publica el archivo original.');
    if (ex.marca || ex.modelo) out.push({cat:'Dato', sev:0, msg:`Metadatos: ${[ex.marca,ex.modelo].filter(Boolean).join(' ')}${ex.fecha?' · '+ex.fecha.slice(0,10):''}`, fix:'Se eliminan al exportar desde la app, pero no al subir el archivo directo a la web.'});
    out.sort((a,b)=>b.sev-a.sev);
    return {medidas:m, exif:ex, hallazgos:out};
  }

  return { analizar, exif };
})();
window.RF = RF;
