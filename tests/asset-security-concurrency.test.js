"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const crypto=require("node:crypto"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawn}=require("node:child_process");
const {signAssetReadTicket,verifyAssetReadTicket,MAX_TTL_MS}=require("../asset-read-tickets");
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test("A file-scoped ticket is short-lived, path-bound, tamper-resistant and not a session token",()=>{
  const secret="unit-test-secret-not-used-in-production",now=1700000000000;
  const {ticket,expiresAt}=signAssetReadTicket({
    userId:"u1",projectId:"p1",file:"tech-123.pdf",sessionVersion:2,secret,now
  });
  assert.equal(expiresAt-now,MAX_TTL_MS);
  assert.equal(verifyAssetReadTicket(ticket,secret,{projectId:"p1",file:"tech-123.pdf",now}).sub,"u1");
  assert.equal(verifyAssetReadTicket(ticket,secret,{projectId:"p2",file:"tech-123.pdf",now}),null);
  assert.equal(verifyAssetReadTicket(ticket,secret,{projectId:"p1",file:"other.pdf",now}),null);
  assert.equal(verifyAssetReadTicket(ticket,secret,{projectId:"p1",file:"tech-123.pdf",now:expiresAt+1}),null);
  const [body,signature]=ticket.split(".");
  const bearerSignature=crypto.createHmac("sha256",secret).update(body).digest("base64url");
  assert.notEqual(signature,bearerSignature,"Ticket must not authenticate as a full session");
  assert.equal(verifyAssetReadTicket(body+".x"+signature,secret,{projectId:"p1",file:"tech-123.pdf",now}),null);
});

test("Production code never puts the thirty-day Bearer in document URLs",()=>{
  const server=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8");
  const app=fs.readFileSync(path.join(__dirname,"../public/app.js"),"utf8");
  assert.doesNotMatch(server,/req\.query\?\.access/);
  assert.doesNotMatch(app,/\?access=\$\{encodeURIComponent\(cloud\.token\)\}/);
  assert.match(app,/updatedAt:cloud\.currentProjectUpdatedAt/);
  assert.match(server,/date_trunc\('milliseconds',updated_at\)=\$6::timestamptz/);
  assert.match(server,/PROJECT_CONFLICT/);
  const match=app.match(/const DEFAULT_SUPPLIER_DISCOUNTS=Object\.freeze\((\{[^;]*\})\);/);
  assert.ok(match,"One table must govern defaults");
  const defaults=JSON.parse(match[1]);
  for(const maker of ["Hidrobox","Bette","Carrodrain","Galassia","Radaway"])assert.equal(defaults[maker],50);
  assert.equal(defaults.Naxani,0);
  assert.equal(defaults.Recor,61.5385);
});

test("Real API: old tabs cannot overwrite a project and asset links cannot authenticate another API",async()=>{
  const data=fs.mkdtempSync(path.join(os.tmpdir(),"hydro-secure-assets-"));
  const port=String(10500+Math.floor(Math.random()*500));
  const base="http://127.0.0.1:"+port;
  const child=spawn(process.execPath,["server.js"],{
    cwd:path.join(__dirname,".."),
    env:{...process.env,PORT:port,DATABASE_URL:"",HYDRO_DATA_DIR:data,HYDRO_TOKEN_SECRET:"integration-test-secret"},
    stdio:"ignore"
  });
  async function json(url,options={}){
    const response=await fetch(base+url,options);
    const body=await response.json().catch(()=>({}));
    return {response,body};
  }
  try{
    let ready=false;
    for(let i=0;i<120;i++){
      if(child.exitCode!==null)throw Error("Server exited before ready");
      try{const r=await fetch(base+"/api/health");if(r.ok){ready=true;break}}catch{}
      await pause(100);
    }
    assert.ok(ready,"Test server must become healthy");
    const setup=await json("/api/auth/setup",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name:"Security test",username:"security-test",password:"secure-test-password"})
    });
    assert.equal(setup.response.status,200);
    const token=setup.body.token;
    const authHeaders={"Content-Type":"application/json",Authorization:"Bearer "+token};
    const legacy=await fetch(base+"/api/projects?access="+encodeURIComponent(token));
    assert.equal(legacy.status,401,"Session token must not be accepted via query string");
    const created=await json("/api/projects",{
      method:"POST",headers:authHeaders,
      body:JSON.stringify({name:"First",data:{project:{name:"First"}}})
    });
    assert.equal(created.response.status,200);
    const id=created.body.project.id,version=created.body.project.updatedAt;
    const first=await json("/api/projects/"+id,{
      method:"PUT",headers:authHeaders,
      body:JSON.stringify({name:"Updated",data:{project:{name:"Updated"}},updatedAt:version})
    });
    assert.equal(first.response.status,200);
    assert.notEqual(first.body.project.updatedAt,version,"Successful update must advance revision");
    const stale=await json("/api/projects/"+id,{
      method:"PUT",headers:authHeaders,
      body:JSON.stringify({name:"Stale",data:{project:{name:"Stale"}},updatedAt:version})
    });
    assert.equal(stale.response.status,409);
    const persisted=await json("/api/projects/"+id,{headers:authHeaders});
    assert.equal(persisted.body.project.data.project.name,"Updated");
    const upload=await json("/api/projects/"+id+"/assets/p1/technical-sheet",{
      method:"POST",headers:authHeaders,
      body:JSON.stringify({fileName:"test.pdf",mime:"application/pdf",dataBase64:Buffer.from("%PDF-1.4\n1 0 obj\n").toString("base64")})
    });
    assert.equal(upload.response.status,200);
    const file=upload.body.asset.file;
    const signed=await json("/api/project-assets/"+id+"/"+encodeURIComponent(file)+"/read-ticket",{
      method:"POST",headers:authHeaders
    });
    assert.equal(signed.response.status,200);
    assert.ok(signed.body.url.includes("?ticket="));
    assert.ok(!signed.body.url.includes(token));
    const allowed=await fetch(base+signed.body.url);
    assert.equal(allowed.status,200);
    assert.equal(allowed.headers.get("referrer-policy"),"no-referrer");
    const cookieNo=await fetch(base+"/api/project-assets/"+id+"/"+encodeURIComponent(file)+"?access="+encodeURIComponent(token));
    assert.equal(cookieNo.status,401);
    const wrongId=await fetch(base+"/api/project-assets/not-my-project/"+encodeURIComponent(file)+"?"+signed.body.url.split("?")[1]);
    assert.equal(wrongId.status,401);
    const ticket=signed.body.url.split("?ticket=")[1];
    const notBearer=await fetch(base+"/api/projects",{headers:{Authorization:"Bearer "+ticket}});
    assert.equal(notBearer.status,401);
  }finally{
    child.kill("SIGTERM");
    await pause(200);
    fs.rmSync(data,{recursive:true,force:true});
  }
});
