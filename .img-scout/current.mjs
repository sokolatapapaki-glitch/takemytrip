import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
const BCN = path.join("public","destinations","barcelona");
const folders = fs.readdirSync(BCN).filter(f=>fs.statSync(path.join(BCN,f)).isDirectory()).sort((a,b)=>{
  const na=parseInt(a),nb=parseInt(b);return (na||999)-(nb||999);});
const CW=300,CH=200,LH=26,COLS=4,GAP=5;
const tiles=[];
for(const f of folders){
  const imgs=fs.readdirSync(path.join(BCN,f)).filter(x=>/\.(jpg|jpeg|png|webp)$/i.test(x));
  if(!imgs.length)continue;
  const p=path.join(BCN,f,imgs[0]);
  const img=await sharp(p).resize(CW,CH,{fit:"cover"}).toBuffer();
  const name=f.replace(/^\d+-/,"").slice(0,38);
  const label=Buffer.from(`<svg width="${CW}" height="${LH}"><rect width="100%" height="100%" fill="#111"/><text x="5" y="18" font-family="sans-serif" font-size="13" fill="#fff">${name}</text></svg>`);
  tiles.push(await sharp({create:{width:CW,height:CH+LH,channels:3,background:"#000"}}).composite([{input:label,top:0,left:0},{input:img,top:LH,left:0}]).jpeg().toBuffer());
}
const rows=Math.ceil(tiles.length/COLS),th=CH+LH;
const W=COLS*CW+(COLS+1)*GAP,H=rows*th+(rows+1)*GAP;
await sharp({create:{width:W,height:H,channels:3,background:"#222"}}).composite(tiles.map((t,i)=>({input:t,top:GAP+Math.floor(i/COLS)*(th+GAP),left:GAP+(i%COLS)*(CW+GAP)}))).jpeg({quality:82}).toFile(".img-scout/current-all.jpg");
console.log(tiles.length+" current images → .img-scout/current-all.jpg");
