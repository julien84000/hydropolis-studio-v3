'use strict';
const fs=require('fs'),zlib=require('zlib');
const {Readable}=require('stream');
const {parser}=require('stream-json');

// Decode just the requested member of a legacy JSON/Gzip asset pack. Strings
// stream as tokens: neither the pack nor a complete Base64 image enters a cache.
async function* readPackedBase64(file,memberPath,field){
  const input=fs.createReadStream(file),gzip=zlib.createGunzip();
  const tokens=parser({packKeys:true,streamKeys:false,packStrings:false,streamStrings:true});
  input.on('error',error=>tokens.destroy(error));gzip.on('error',error=>tokens.destroy(error));
  input.pipe(gzip).pipe(tokens);
  const stack=[];let key,selected=false,carry='',chunks=[],size=0;
  try{
    for await(const token of tokens){
      if(token.name==='keyValue')key=token.value;
      else if(token.name==='startObject'||token.name==='startArray'){stack.push(key);key=undefined;}
      else if(token.name==='endObject'||token.name==='endArray'){stack.pop();key=undefined;}
      else if(token.name==='startString')selected=key===field&&stack.slice(1).join('\0')===memberPath.join('\0');
      else if(token.name==='stringChunk'&&selected){
        const value=carry+token.value,n=value.length-value.length%4;
        if(n){const bytes=Buffer.from(value.slice(0,n),'base64');chunks.push(bytes);size+=bytes.length;}
        carry=value.slice(n);
        if(size>=64*1024){yield Buffer.concat(chunks,size);chunks=[];size=0;}
      }else if(token.name==='endString'&&selected){
        if(carry){const bytes=Buffer.from(carry,'base64');chunks.push(bytes);size+=bytes.length;}
        if(size)yield Buffer.concat(chunks,size);
        return;
      }
    }
    throw new Error('Ressource absente du pack');
  }finally{tokens.destroy();gzip.destroy();input.destroy();}
}
function packedStream(file,memberPath,field){return Readable.from(readPackedBase64(file,memberPath,field));}
async function collectDocument(stream,maxBytes=32*1024*1024){
  const chunks=[];let size=0;
  try{for await(const chunk of stream){size+=chunk.length;if(size>maxBytes)throw Error('Document trop volumineux');chunks.push(chunk);}return Buffer.concat(chunks,size);}
  finally{stream.destroy();}
}
module.exports={packedStream,collectDocument};
