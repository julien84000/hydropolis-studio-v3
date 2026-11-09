"use strict";
const crypto=require("node:crypto");
const DOMAIN="hydropolis:project-asset-read:v1";
const MAX_TTL_MS=5*60*1000;
function signature(body,secret){
  return crypto.createHmac("sha256",String(secret)).update(DOMAIN+":"+body).digest("base64url");
}
function signAssetReadTicket({userId,projectId,file,sessionVersion,secret,now=Date.now()}){
  if(!userId||!projectId||!file||!secret)throw new Error("Asset ticket fields are required");
  const expiresAt=now+MAX_TTL_MS;
  const body=Buffer.from(JSON.stringify({
    scope:"asset-read",sub:String(userId),pid:String(projectId),file:String(file),
    sv:Number(sessionVersion||1),exp:expiresAt
  })).toString("base64url");
  return {ticket:body+"."+signature(body,secret),expiresAt};
}
function verifyAssetReadTicket(token,secret,{projectId,file,now=Date.now()}={}){
  try{
    const parts=String(token||"").split(".");
    if(parts.length!==2||parts[0].length>2048||!secret)return null;
    const [body,sig]=parts,expected=signature(body,secret);
    if(sig.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
    const p=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
    if(p.scope!=="asset-read"||!p.sub||!p.pid||!p.file)return null;
    if(p.pid!==projectId||p.file!==file)return null;
    if(!Number.isSafeInteger(p.sv)||p.sv<1)return null;
    if(!Number.isFinite(p.exp)||p.exp<now||p.exp>now+MAX_TTL_MS)return null;
    return p;
  }catch{return null}
}
module.exports={signAssetReadTicket,verifyAssetReadTicket,MAX_TTL_MS};
