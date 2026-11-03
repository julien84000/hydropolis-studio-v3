'use strict';
/* Hotbath product-only finish simulator.
 * Studio/transparent catalog assets only. Do not tint room photography, tiles,
 * backgrounds, shadows or lifestyle scenes. Unsegmentable images return 422.
 */
function isLightNeutral(r,g,b){
 return r>=226&&g>=226&&b>=226&&Math.max(r,g,b)-Math.min(r,g,b)<=31;
}
function prepareMask(data,w,h){
 const n=w*h,p=data,foreground=new Uint8Array(n);
 let transparent=0;
 for(let i=0;i<n;i++){if(p[i*4+3]<242)transparent++;}
 if(transparent/n>=0.025){
  let count=0;
  for(let i=0;i<n;i++){
   if(p[i*4+3]>=160){foreground[i]=1;count++;}
  }
  if(count/n<0.008||count/n>0.82)return {mask:null,mode:'transparent',reason:'subject-coverage'};
  return {mask:foreground,mode:'alpha',count};
 }
 // Only a high-key uniform studio background may be segmented safely.
 // Scenery photographs, dark tiles and patterned interiors are rejected.
 let lightEdge=0,edge=0;
 for(let x=0;x<w;x+=Math.max(1,Math.floor(w/48))){
  for(const y of [0,h-1]){
   edge++;const i=(y*w+x)*4;if(isLightNeutral(p[i],p[i+1],p[i+2]))lightEdge++;
  }
 }
 for(let y=0;y<h;y+=Math.max(1,Math.floor(h/48))){
  for(const x of [0,w-1]){
   edge++;const i=(y*w+x)*4;if(isLightNeutral(p[i],p[i+1],p[i+2]))lightEdge++;
  }
 }
 if(edge===0||lightEdge/edge<0.92)return {mask:null,mode:'studio',reason:'non-studio-background'};
 const background=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;
 function push(i){
  if(background[i])return;
  const off=i*4;
  if(!isLightNeutral(p[off],p[off+1],p[off+2]))return;
  background[i]=1;q[tail++]=i;
 }
 for(let x=0;x<w;x++){push(x);push((h-1)*w+x)}
 for(let y=0;y<h;y++){push(y*w);push(y*w+w-1)}
 while(head<tail){
  const i=q[head++],x=i%w,y=(i-x)/w;
  if(x>0)push(i-1);if(x<w-1)push(i+1);
  if(y>0)push(i-w);if(y<h-1)push(i+w);
 }
 let count=0;
 for(let i=0;i<n;i++){
  if(background[i])continue;
  foreground[i]=1;count++;
 }
 if(count/n<0.008||count/n>0.70)return {mask:null,mode:'studio',reason:'subject-coverage'};
 return {mask:foreground,mode:'studio',count};
}
function recolor(data,mask,target){
 const p=data,[tr,tg,tb]=target.rgb;
 let count=0;
 for(let i=0;i<mask.length;i++){
  if(!mask[i])continue;
  const off=i*4,r=p[off],g=p[off+1],b=p[off+2],a=p[off+3];
  if(a<160||isLightNeutral(r,g,b))continue;
  const lum=.2126*r+.7152*g+.0722*b;
  const dark=lum<45?0.30:1,light=Math.max(.22,Math.min(1.34,lum/155));
  const mix=Math.min(0.94,Math.max(0,target.strength*dark));
  p[off]=Math.round(r*(1-mix)+Math.min(255,tr*light)*mix);
  p[off+1]=Math.round(g*(1-mix)+Math.min(255,tg*light)*mix);
  p[off+2]=Math.round(b*(1-mix)+Math.min(255,tb*light)*mix);
  count++;
 }
 return count;
}
async function renderHotbathFinish(bytes,target,graphics){
 if(!target||!Array.isArray(target.rgb)||!bytes?.length)throw Error('Missing image or finish');
 const {createCanvas,loadImage}=graphics||await import('@napi-rs/canvas');
 const img=await loadImage(bytes);
 if(!img.width||!img.height)throw Error('Invalid image');
 const scale=Math.min(1,1800/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
 const canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
 const frame=ctx.getImageData(0,0,w,h),prepared=prepareMask(frame.data,w,h);
 if(!prepared.mask)return {ok:false,reason:prepared.reason,mode:prepared.mode};
 const n=recolor(frame.data,prepared.mask,target);
 if(n<Math.max(5,w*h*.002))return {ok:false,reason:'no-safe-product-pixels',mode:prepared.mode};
 ctx.putImageData(frame,0,0);
 return {ok:true,mode:prepared.mode,count:n,bytes:await canvas.encode('png')};
}
module.exports={isLightNeutral,prepareMask,recolor,renderHotbathFinish};
