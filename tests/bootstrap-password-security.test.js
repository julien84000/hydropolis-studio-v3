'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('Bootstrap is single-admin even with concurrent requests; new password minimum is 12',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hydro-admin-bootstrap-'));
 const port=String(11100+Math.floor(Math.random()*800));
 const base='http://127.0.0.1:'+port;
 const server=spawn(process.execPath,['server.js'],{
  cwd:path.resolve(__dirname,'..'),
  env:{...process.env,PORT:port,DATABASE_URL:'',HYDRO_DATA_DIR:dir,HYDRO_TOKEN_SECRET:'test-bootstrap-secret'},
  stdio:'ignore'
 });
 async function call(route,{body,token,method='POST'}={}){
  const res=await fetch(base+route,{
   method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
   ...(body?{body:JSON.stringify(body)}:{})
  });
  return {status:res.status,data:await res.json().catch(()=>({}))};
 }
 try{
  let healthy=false;
  for(let i=0;i<120;i++){
   if(server.exitCode!==null)throw Error('Server failed to start');
   try{if((await fetch(base+'/api/health')).ok){healthy=true;break}}catch{}
   await sleep(100);
  }
  assert.ok(healthy,'Local test server is running');
  const weak={name:'Test Admin',username:'weakadmin',password:'123456'};
  assert.equal((await call('/api/auth/setup',{body:weak})).status,400);
  const result=await Promise.all([
   call('/api/auth/setup',{body:{name:'First Admin',username:'adminone',password:'strong-admin-001'}}),
   call('/api/auth/setup',{body:{name:'Second Admin',username:'admintwo',password:'strong-admin-002'}})
  ]);
  assert.deepEqual(result.map(x=>x.status).sort(),[200,409]);
  const token=result.find(x=>x.status===200).data.token;
  assert.ok(token);
  const users=await call('/api/users',{method:'GET',token});
  assert.equal(users.status,200);
  assert.equal(users.data.users.length,1,'Only one admin may be bootstrapped');
  assert.equal(users.data.users[0].role,'admin');
  const bad=await call('/api/users',{token,body:{name:'Bad User',username:'baduser',password:'short11!'}});
  assert.equal(bad.status,400);
  const added=await call('/api/users',{token,body:{name:'Team User',username:'teamuser',password:'strong-team-001'}});
  assert.equal(added.status,200);
  const userId=added.data.user.id;
  assert.equal((await call('/api/users/'+userId+'/password',{method:'PATCH',token,body:{password:'1234567'}})).status,400);
  assert.equal((await call('/api/users/'+userId+'/password',{method:'PATCH',token,body:{password:'new-long-password-001'}})).status,200);
  assert.equal((await call('/api/auth/login',{body:{username:'teamuser',password:'new-long-password-001'}})).status,200);
  const now=await call('/api/users',{method:'GET',token});
  assert.equal(now.data.users.length,2);
 }finally{
  server.kill('SIGTERM');await sleep(200);
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
test('PostgreSQL admin bootstrap is advisory-locked inside an explicit transaction',()=>{
 const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
 assert.match(server,/pg_advisory_xact_lock\(116477, 20261109\)/);
 assert.match(server,/async function storeCreateBootstrapAdmin/);
 assert.match(server,/if\(!await storeCreateBootstrapAdmin\(user\)\)/);
});
