import fs from "node:fs"; import path from "node:path"; import sharp from "sharp";
const UA="ttk scout (educational; kopotitore@gmail.com)";
const [, , slug, ...titles] = process.argv;
const OUT=path.join(".img-scout",slug); fs.mkdirSync(OUT,{recursive:true});
const strip=s=>(s||"").replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();
const CW=400,CH=270,LH=22,COLS=2,GAP=6;
const tiles=[],meta=[];let i=0;
for(const t of titles){
  const u="https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&titles="+encodeURIComponent("File:"+t);
  const r=await fetch(u,{headers:{"User-Agent":UA}});const d=await r.json();
  const p=Object.values(d?.query?.pages||{})[0];const ii=p?.imageinfo?.[0];
  if(!ii?.thumburl){console.log("MISS",t);continue;}
  i++;
  const raw=Buffer.from(await (await fetch(ii.thumburl,{headers:{"User-Agent":UA}})).arrayBuffer());
  const m=ii.extmetadata||{};
  meta.push({n:i,title:p.title,author:strip(m.Artist?.value),license:strip(m.LicenseShortName?.value),pageUrl:ii.descriptionurl});
  const img=await sharp(raw).resize(CW,CH,{fit:"cover"}).toBuffer();
  const label=Buffer.from(`<svg width="${CW}" height="${LH}"><rect width="100%" height="100%" fill="#111"/><text x="5" y="16" font-family="sans-serif" font-size="13" fill="#fff">c${i} ${strip(m.LicenseShortName?.value)}</text></svg>`);
  tiles.push(await sharp({create:{width:CW,height:CH+LH,channels:3,background:"#000"}}).composite([{input:label,top:0,left:0},{input:img,top:LH,left:0}]).jpeg().toBuffer());
  console.log("c"+i,p.title);
}
const rows=Math.ceil(tiles.length/COLS),th=CH+LH;
const W=COLS*CW+(COLS+1)*GAP,H=rows*th+(rows+1)*GAP;
await sharp({create:{width:W,height:H,channels:3,background:"#222"}}).composite(tiles.map((t,k)=>({input:t,top:GAP+Math.floor(k/COLS)*(th+GAP),left:GAP+(k%COLS)*(CW+GAP)}))).jpeg({quality:82}).toFile(path.join(OUT,"sheet.jpg"));
fs.writeFileSync(path.join(OUT,"picks.json"),JSON.stringify(meta,null,2));
