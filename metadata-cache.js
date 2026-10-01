'use strict';

// Only parsed product metadata belongs here; never HTML, images or catalogue rows.
class MetadataCache {
  constructor({max=120,ttl=2*60*60*1000,clock=Date.now}={}) {
    this.max=max; this.ttl=ttl; this.clock=clock;
    this.entries=new Map(); this.pending=new Map();
  }
  prune() {
    const now=this.clock();
    for(const [key,row] of this.entries) if(row.expires<=now) this.entries.delete(key);
  }
  get size() { this.prune(); return this.entries.size; }
  get(key) { this.prune(); return this.entries.get(key)?.value; }
  set(key,value) {
    this.prune(); this.entries.delete(key);
    this.entries.set(key,{value,expires:this.clock()+this.ttl});
    while(this.entries.size>this.max) this.entries.delete(this.entries.keys().next().value);
    return value;
  }
  has(key) { return this.get(key)!==undefined; }
  delete(key) { return this.entries.delete(key); }
  keys() { this.prune(); return this.entries.keys(); }
  clear() { this.entries.clear(); }
  async resolve(key,loader) {
    const hit=this.get(key); if(hit!==undefined) return hit;
    if(this.pending.has(key)) return this.pending.get(key);
    const job=Promise.resolve().then(loader).then(value=>this.set(key,value)).finally(()=>this.pending.delete(key));
    this.pending.set(key,job); return job;
  }
}

function createPool(max=4,queueLimit=64) {
  let active=0; const queue=[];
  const run=fn=>new Promise((resolve,reject)=>{
    const start=()=>{
      active++;
      Promise.resolve().then(fn).then(resolve,reject).finally(()=>{active--;queue.shift()?.();});
    };
    if(active<max)start();
    else if(queue.length<queueLimit)queue.push(start);
    else reject(Object.assign(new Error('Trop de recherches simultanées. Réessayez.'),{status:503}));
  });
  run.stats=()=>({active,queued:queue.length,limit:max});
  return run;
}
module.exports={MetadataCache,createPool};
