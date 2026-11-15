import"./chunk-NYAKAUGY.js";
// Sistema de Billares Ángel (S.B.A) · Exportar a Excel (.xlsx) con formato profesional.
// Cada concepto tiene su color: ingresos (verde), costos y gastos (rojo), utilidad (dorado),
// caja (azul), cantidades (violeta), tiempo (celeste) y textos (gris verdoso).
var esc=o=>String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"");
function colLetra(o){let n="";for(let r=o+1;r>0;r=Math.floor((r-1)/26))n=String.fromCharCode(65+(r-1)%26)+n;return n}

// enc = color del encabezado · t1/t2 = tono claro de las filas (alternadas) · tx = color del texto
var PAL={
  texto:    {enc:"1F3D36",t1:"FFFFFF",t2:"F2F5F3",tx:"13201A",nombre:"Datos"},
  ingreso:  {enc:"15803D",t1:"F0FDF4",t2:"DCF5E4",tx:"14532D",nombre:"Ingresos"},
  egreso:   {enc:"B3231F",t1:"FEF4F3",t2:"FDE3E1",tx:"8B1A17",nombre:"Costos y gastos"},
  resultado:{enc:"A66F00",t1:"FFFBEB",t2:"FDF1CC",tx:"6B4700",nombre:"Utilidad"},
  caja:     {enc:"1F5FD1",t1:"F2F7FF",t2:"DFEAFC",tx:"173F8A",nombre:"Caja"},
  conteo:   {enc:"6D28D9",t1:"F7F5FF",t2:"EBE6FC",tx:"4C1D95",nombre:"Cantidades"},
  tiempo:   {enc:"0E7490",t1:"F0FBFE",t2:"DAF3F9",tx:"0B566B",nombre:"Tiempo"}
};
PAL.id=PAL.texto;
var GUIA={
  ingreso:"Dinero que entra: alquiler de mesas y venta de productos.",
  egreso:"Dinero que sale o se descuenta: costo de productos, gastos, descuentos y compras.",
  resultado:"Lo que queda: ingresos menos costo de productos y gastos.",
  caja:"Efectivo de la caja: inicial, esperado, contado y diferencia.",
  conteo:"Cantidades: ventas, partidas y anulaciones."
};
var COLOR_HOJA={"Resumen":"0B5740","Por día":"15803D","Métodos de pago":"1F5FD1","Mesas":"0E7490","Horarios":"4F46E5","Productos":"E07A06","Empleados":"7C3AED","Gastos por tipo":"B3231F","Partidas":"0891B2","Cierres de caja":"A66F00"};
var FMT={
  bs:'"Bs"\\ #,##0.00;[Red]\\-"Bs"\\ #,##0.00',
  ent:"#,##0;[Red]\\-#,##0",
  dec:"#,##0.00;[Red]\\-#,##0.00",
  id:"0"
};

// ---------- Clasificación de conceptos ----------
function conceptoColumna(enc,hoja){
  let h=String(enc??"").trim();
  if(/^(fecha|hora|mesa|m[eé]todo|producto$|persona|atendi|tipo|estado|tarifa|responsable|nota|inicio|fin$|apertura|cierre$|cerr[oó]|concepto|negocio|periodo|abri[oó])/i.test(h))return"texto";
  if(/^minutos/i.test(h))return"tiempo";
  if(/^(ventas|partidas|cobros|cantidad|anulaciones)/i.test(h))return"conteo";
  if(/^(inicial|esperado|contado|diferencia)/i.test(h))return"caja";
  if(/margen|utilidad/i.test(h))return"resultado";
  if(/costo|gasto|descuento|compra|retiro/i.test(h))return"egreso";
  return/gasto/i.test(hoja)?"egreso":"ingreso";
}
function conceptoFila(etq){
  let e=String(etq??"").trim();
  if(/^(negocio|periodo|apertura|abri[oó]|cierre|cerr[oó]|nota)/i.test(e))return"texto";
  if(/^jornada/i.test(e))return"id";
  if(/^(ventas cobradas|partidas cobradas|anulaciones)$/i.test(e))return"conteo";
  if(/utilidad|margen/i.test(e))return"resultado";
  if(/^(efectivo|diferencia)/i.test(e))return"caja";
  if(/descuento|costo|gasto|compra|retiro|monto anulado/i.test(e))return"egreso";
  return"ingreso";
}
function formatoNumero(concepto,valor){
  if(concepto==="id")return FMT.id;
  if(concepto==="ingreso"||concepto==="egreso"||concepto==="resultado"||concepto==="caja")return FMT.bs;
  if(concepto==="conteo"||concepto==="tiempo")return Number.isInteger(valor)?FMT.ent:FMT.dec;
  return Number.isInteger(valor)?FMT.ent:FMT.dec;
}

// ---------- Registro de estilos (se arma solo, según lo que se use) ----------
function crearEstilos(){
  let fuentes=[],rellenos=[],bordes=[],xfs=[],formatos={},mapaXf={};
  let fuenteXML=o=>`<font>${o.b?"<b/>":""}${o.i?"<i/>":""}<sz val="${o.sz||11}"/><color rgb="FF${o.col||"13201A"}"/><name val="Calibri"/></font>`;
  let idx=(arr,x)=>{let i=arr.indexOf(x);if(i<0){arr.push(x);i=arr.length-1}return i};
  idx(fuentes,fuenteXML({}));
  rellenos.push('<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>');
  let lado=(n,e,c)=>`<${n} style="${e}"><color rgb="FF${c}"/></${n}>`;
  let borde=t=>{
    let g="DDE4DF";
    if(t==="ninguno")return"<border><left/><right/><top/><bottom/><diagonal/></border>";
    if(t==="total")return`<border>${lado("left","thin",g)}${lado("right","thin",g)}${lado("top","medium","13201A")}${lado("bottom","thin",g)}<diagonal/></border>`;
    return`<border>${lado("left","thin",g)}${lado("right","thin",g)}${lado("top","thin",g)}${lado("bottom","thin",g)}<diagonal/></border>`;
  };
  idx(bordes,borde("ninguno"));
  let fmtId=c=>{if(!c)return 0;if(formatos[c]==null)formatos[c]=164+Object.keys(formatos).length;return formatos[c]};
  function xf(o){
    let clave=JSON.stringify(o);
    if(mapaXf[clave]!=null)return mapaXf[clave];
    let fo=idx(fuentes,fuenteXML(o)),
      fi=o.fill?idx(rellenos,`<fill><patternFill patternType="solid"><fgColor rgb="FF${o.fill}"/><bgColor indexed="64"/></patternFill></fill>`):0,
      bo=idx(bordes,borde(o.borde||"ninguno")),
      al=`<alignment${o.h?` horizontal="${o.h}"`:""} vertical="${o.v||"center"}"${o.wrap?' wrapText="1"':""}${o.indent?` indent="${o.indent}"`:""}/>`;
    xfs.push(`<xf numFmtId="${fmtId(o.fmt)}" fontId="${fo}" fillId="${fi}" borderId="${bo}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${al}</xf>`);
    return mapaXf[clave]=xfs.length-1;
  }
  xf({});
  function xml(){
    let fm=Object.keys(formatos);
    return'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
      (fm.length?`<numFmts count="${fm.length}">${fm.map(c=>`<numFmt numFmtId="${formatos[c]}" formatCode="${esc(c)}"/>`).join("")}</numFmts>`:"")+
      `<fonts count="${fuentes.length}">${fuentes.join("")}</fonts>`+
      `<fills count="${rellenos.length}">${rellenos.join("")}</fills>`+
      `<borders count="${bordes.length}">${bordes.join("")}</borders>`+
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'+
      `<cellXfs count="${xfs.length}">${xfs.join("")}</cellXfs></styleSheet>`;
  }
  return{xf,xml};
}

// ---------- Una hoja ----------
function hojaXML(h,cx){
  let est=cx.est,filas=h.filas,
    nc=Math.max(1,...filas.map(f=>f.length)),
    enc=filas[0]||[],
    esRes=h.nombre==="Resumen"&&nc===2,
    conc=esRes?null:Array.from({length:nc},(_,c)=>conceptoColumna(enc[c],h.nombre)),
    color=COLOR_HOJA[h.nombre]||"0B5740",
    ult=colLetra(nc-1),
    filasXML=[],fusion=[],
    num=1;

  // anchos
  let anchos=Array.from({length:nc},(_,c)=>{
    let m=String(enc[c]??"").length*1.25+4;
    for(let i=1;i<Math.min(filas.length,300);i++){
      let v=filas[i][c];
      m=Math.max(m,typeof v=="number"?15:(esRes&&c===1?Math.min(String(v??"").length+3,46):String(v??"").length+3));
    }
    return Math.min(esRes&&c===1?46:60,Math.max(esRes?(c===0?34:24):(conc[c]==="texto"?12:15),m));
  });
  let total=anchos.reduce((a,b)=>a+b,0);
  if(total<66)anchos[nc-1]+=66-total;

  let celda=(ref,v,s)=>{
    if(v==null||v==="")return`<c r="${ref}" s="${s}"/>`;
    if(typeof v=="number"&&!Number.isFinite(v))return`<c r="${ref}" s="${s}"/>`;
    if(typeof v=="number"&&Number.isFinite(v))return`<c r="${ref}" s="${s}"><v>${v}</v></c>`;
    return`<c r="${ref}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  };
  let filaBanda=(fila,alto,texto,estilo,estiloVacio)=>{
    let cs=celda("A"+fila,texto,estilo);
    for(let c=1;c<nc;c++)cs+=`<c r="${colLetra(c)}${fila}" s="${estiloVacio??estilo}"/>`;
    filasXML.push(`<row r="${fila}" ht="${alto}" customHeight="1">${cs}</row>`);
    if(nc>1)fusion.push(`A${fila}:${ult}${fila}`);
  };

  // 1) Banner con el nombre del sistema (y el logo)
  filaBanda(1,46,"Sistema de Billares Ángel · S.B.A",est.xf({b:1,sz:18,col:"FFFFFF",fill:"052E22",h:"left",indent:cx.logo?8:1}));
  // 2) Nombre del documento y de la hoja (con el color de la hoja)
  filaBanda(2,22,`${cx.titulo}  ·  ${h.nombre}`,est.xf({b:1,sz:12,col:"FFFFFF",fill:color,h:"left",indent:1}));
  // 3) Fecha de generación
  filaBanda(3,18,`Generado el ${cx.generado}`,est.xf({i:1,sz:10,col:"4F5D56",fill:"F2F5F3",h:"left",indent:1}));

  // 4) Encabezados
  let cab=filas[0]||[],
    cabXML="";
  for(let c=0;c<nc;c++){
    let k=esRes?"texto":conc[c],
      s=est.xf({b:1,col:"FFFFFF",fill:esRes?"1F3D36":PAL[k].enc,borde:"fino",h:(esRes?(c===0?"left":"center"):(k==="texto"?"left":"center")),wrap:1,indent:(esRes?c===0:k==="texto")?1:0});
    cabXML+=celda(colLetra(c)+4,cab[c],s);
  }
  filasXML.push(`<row r="4" ht="24" customHeight="1">${cabXML}</row>`);
  num=4;

  // 5) Datos
  let sumas=new Array(nc).fill(null),conceptosUsados={};
  for(let i=1;i<filas.length;i++){
    let f=filas[i],r=5+i-1,zebra=(i-1)%2===1,cs="",alto=17;
    num=r;
    if(esRes){
      let k=conceptoFila(f[0]),p=PAL[k];
      conceptosUsados[k]=1;
      let v=f[1],esN=typeof v=="number"&&Number.isFinite(v),largo=typeof v=="string"&&v.length>46;
      cs+=celda("A"+r,f[0],est.xf({b:1,col:p.tx,fill:k==="texto"?"F2F5F3":p.t2,borde:"fino",h:"left",indent:1}));
      cs+=celda("B"+r,v,est.xf({b:k==="resultado"?1:0,col:p.tx,fill:p.t1,borde:"fino",h:esN?"right":"left",wrap:largo?1:0,fmt:esN?formatoNumero(k,v):null,indent:esN?0:1}));
      if(largo)alto=Math.max(17,Math.ceil(v.length/44)*15+4);
    }else{
      for(let c=0;c<nc;c++){
        let k=conc[c],p=PAL[k],v=f[c],esN=typeof v=="number"&&Number.isFinite(v);
        let s=est.xf({b:(k==="resultado"||(c===0&&k==="texto"))?1:0,col:p.tx,fill:zebra?p.t2:p.t1,borde:"fino",h:esN?"right":"left",wrap:(typeof v=="string"&&v.length>40)?1:0,fmt:esN?formatoNumero(k,v):null,indent:esN?0:1});
        cs+=celda(colLetra(c)+r,v,s);
        if(esN&&(k==="ingreso"||k==="egreso"||k==="resultado"||k==="conteo"||k==="tiempo"))sumas[c]=(sumas[c]??0)+v;
        if(typeof v=="string"&&v.length>40)alto=Math.max(alto,Math.ceil(v.length/Math.max(10,anchos[c]))*15+4);
      }
    }
    filasXML.push(`<row r="${r}" ht="${alto}" customHeight="1">${cs}</row>`);
  }
  let ultimaDato=num;

  // 6) Fila de totales (con fórmulas) para las tablas
  let hayTotal=!esRes&&filas.length>2&&sumas.some(x=>x!=null);
  if(hayTotal){
    let r=num+1,cs="";
    for(let c=0;c<nc;c++){
      let k=conc[c],p=PAL[k],fill=k==="texto"?"DDE4DF":p.t2;
      let s=est.xf({b:1,col:k==="texto"?"13201A":p.tx,fill,borde:"total",h:c===0?"left":"right",indent:c===0?1:0,fmt:sumas[c]!=null?formatoNumero(k,sumas[c]):null});
      if(c===0)cs+=celda(colLetra(c)+r,"TOTAL",s);
      else if(sumas[c]!=null){
        let L=colLetra(c),val=Math.round(sumas[c]*100)/100;
        cs+=`<c r="${L}${r}" s="${s}"><f>SUM(${L}5:${L}${ultimaDato})</f><v>${val}</v></c>`;
      }else cs+=`<c r="${colLetra(c)}${r}" s="${s}"/>`;
    }
    filasXML.push(`<row r="${r}" ht="20" customHeight="1">${cs}</row>`);
    num=r;
  }

  // 7) Guía de colores (solo en el Resumen)
  if(esRes){
    let r=num+2;
    filasXML.push(`<row r="${r}" ht="20" customHeight="1">${celda("A"+r,"Guía de colores",est.xf({b:1,sz:12,col:"13201A",h:"left"}))}</row>`);
    ["ingreso","egreso","resultado","caja","conteo"].filter(k=>conceptosUsados[k]).forEach(k=>{
      r++;
      filasXML.push(`<row r="${r}" ht="32" customHeight="1">${celda("A"+r,PAL[k].nombre,est.xf({b:1,col:"FFFFFF",fill:PAL[k].enc,borde:"fino",h:"left",indent:1}))}${celda("B"+r,GUIA[k],est.xf({col:PAL[k].tx,fill:PAL[k].t1,borde:"fino",h:"left",wrap:1,indent:1}))}</row>`);
    });
    num=r;
  }
  // Los renglones de la guía quedan en el orden correcto (r crece de uno en uno)

  let cols=anchos.map((w,c)=>`<col min="${c+1}" max="${c+1}" width="${Math.round(w*100)/100}" customWidth="1"/>`).join(""),
    congelar=filas.length>25,
    panel=congelar?'<pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A5" sqref="A5"/>':"",
    filtro=!esRes&&ultimaDato>4?`<autoFilter ref="A4:${ult}${ultimaDato}"/>`:"",
    merge=fusion.length?`<mergeCells count="${fusion.length}">${fusion.map(m=>`<mergeCell ref="${m}"/>`).join("")}</mergeCells>`:"";
  return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><tabColor rgb="FF${color}"/><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${ult}${Math.max(num,4)}"/><sheetViews><sheetView showGridLines="0"${cx.indice===0?' tabSelected="1"':""} workbookViewId="0">${panel}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="16"/><cols>${cols}</cols><sheetData>${filasXML.join("")}</sheetData>${filtro}${merge}<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="${nc>5?"landscape":"portrait"}" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;L&amp;8Sistema de Billares Ángel (S.B.A)&amp;C&amp;8Comprobante interno. No es factura.&amp;R&amp;8&amp;P / &amp;N</oddFooter></headerFooter>${cx.logo?'<drawing r:id="rId1"/>':""}</worksheet>`;
}

function dibujoXML(){
  let px=n=>n*9525;
  return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>${px(8)}</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>${px(5)}</xdr:rowOff></xdr:from><xdr:ext cx="${px(50)}" cy="${px(50)}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Logo S.B.A" descr="Logo de Sistema de Billares Ángel"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${px(50)}" cy="${px(50)}"/></a:xfrm><a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`;
}

async function descargarExcel(nombreArchivo,hojas){
  let{default:JSZipLib}=await import("./jszip.min-F2I4M63A.js"),
    zip=new JSZipLib,
    nombresHoja=hojas.map((e,t)=>e.nombre.replace(/[\\/?*[\]:]/g," ").slice(0,31)||`Hoja ${t+1}`),
    hoy=new Date().toISOString().slice(0,10),
    ahora=new Date(),
    dd=n=>String(n).padStart(2,"0"),
    generado=`${dd(ahora.getDate())}/${dd(ahora.getMonth()+1)}/${ahora.getFullYear()} ${dd(ahora.getHours())}:${dd(ahora.getMinutes())}`,
    titulo=nombreArchivo.replace(/\.xlsx$/,""),
    logo=null;
  // Logo del sistema en la cabecera (si no se puede leer, el Excel sale igual, sin logo)
  try{let r=await fetch("iconos/icono-192.png");if(r.ok)logo=await r.arrayBuffer()}catch{}
  let est=crearEstilos();

  let hojasXML=hojas.map((e,t)=>hojaXML(e,{est,titulo,generado,logo:!!logo,indice:t}));

  zip.file("[Content_Types].xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logo?'<Default Extension="png" ContentType="image/png"/>':""}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${hojas.map((e,t)=>`<Override PartName="/xl/worksheets/sheet${t+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}${logo?hojas.map((e,t)=>`<Override PartName="/xl/drawings/drawing${t+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`).join(""):""}</Types>`);

  zip.file("_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');

  zip.file("docProps/core.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(nombreArchivo)}</dc:title><dc:creator>Sistema de Billares Ángel (S.B.A)</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`);
  zip.file("docProps/app.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>S.B.A</Application></Properties>');

  // Al imprimir, el encabezado de cada tabla (fila 4) se repite en cada página.
  let nombresDef=nombresHoja.map((n,t)=>hojas[t].filas.length>25?`<definedName name="_xlnm.Print_Titles" localSheetId="${t}">'${esc(n).replace(/'/g,"''")}'!$4:$4</definedName>`:"").join("");
  zip.file("xl/workbook.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${nombresHoja.map((e,t)=>`<sheet name="${esc(e)}" sheetId="${t+1}" r:id="rId${t+1}"/>`).join("")}</sheets>${nombresDef?`<definedNames>${nombresDef}</definedNames>`:""}</workbook>`);

  zip.file("xl/_rels/workbook.xml.rels",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${hojas.map((e,t)=>`<Relationship Id="rId${t+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${t+1}.xml"/>`).join("")}<Relationship Id="rId${hojas.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);

  hojasXML.forEach((x,t)=>zip.file(`xl/worksheets/sheet${t+1}.xml`,x));
  if(logo){
    zip.file("xl/media/logo.png",logo);
    hojas.forEach((e,t)=>{
      zip.file(`xl/worksheets/_rels/sheet${t+1}.xml.rels`,`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${t+1}.xml"/></Relationships>`);
      zip.file(`xl/drawings/drawing${t+1}.xml`,dibujoXML());
      zip.file(`xl/drawings/_rels/drawing${t+1}.xml.rels`,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo.png"/></Relationships>');
    });
  }
  zip.file("xl/styles.xml",est.xml());

  let blob=await zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",compression:"DEFLATE"}),
    nombreFinal=(nombreArchivo.endsWith(".xlsx")?nombreArchivo.slice(0,-5):nombreArchivo).replace(/[\\/?*[\]:]/g,"_"),
    a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`${nombreFinal}_${hoy}.xlsx`;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1e4);
}
export{descargarExcel};
