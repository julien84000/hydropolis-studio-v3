const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({limit:"20mb"}));
app.use(express.static(path.join(__dirname,"public")));

/* =========================================================
   V9.4 — Comptes + projets persistants PostgreSQL / Supabase
   ========================================================= */
const HYDRO_DATA_DIR = process.env.HYDRO_DATA_DIR || path.join(__dirname,"data");
const HYDRO_DB_FILE = path.join(HYDRO_DATA_DIR,"hydropolis-db.json");
const DATABASE_URL = String(process.env.DATABASE_URL||"").trim();
const USE_POSTGRES = /^postgres(?:ql)?:\/\//i.test(DATABASE_URL);
const TOKEN_SECRET = process.env.HYDRO_TOKEN_SECRET || crypto
  .createHash("sha256")
  .update(DATABASE_URL || "hydropolis-local-fallback")
  .digest("hex");

const pgPool = USE_POSTGRES ? new Pool({
  connectionString:DATABASE_URL,
  ssl:{rejectUnauthorized:false},
  max:5,
  idleTimeoutMillis:30000,
  connectionTimeoutMillis:15000
}) : null;

function ensureDataDir(){
  fs.mkdirSync(HYDRO_DATA_DIR,{recursive:true});
}
function emptyDb(){
  return {users:[],projects:[]};
}
function readDb(){
  ensureDataDir();
  try{
    if(!fs.existsSync(HYDRO_DB_FILE))return emptyDb();
    const db=JSON.parse(fs.readFileSync(HYDRO_DB_FILE,"utf8"));
    if(!Array.isArray(db.users))db.users=[];
    if(!Array.isArray(db.projects))db.projects=[];
    return db;
  }catch(e){
    console.error("[db read]",e);
    return emptyDb();
  }
}
function writeDb(db){
  ensureDataDir();
  const tmp=HYDRO_DB_FILE+".tmp";
  fs.writeFileSync(tmp,JSON.stringify(db,null,2),"utf8");
  fs.renameSync(tmp,HYDRO_DB_FILE);
}
async function initPersistentStore(){
  if(!USE_POSTGRES){
    console.warn("[Hydropolis] DATABASE_URL absent — fallback fichier local non persistant.");
    return false;
  }
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS hydropolis_users(
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      title TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      disabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS hydropolis_projects(
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES hydropolis_users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      client TEXT NOT NULL DEFAULT '',
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS hydropolis_projects_user_idx
      ON hydropolis_projects(user_id,updated_at DESC);
    CREATE TABLE IF NOT EXISTS hydropolis_assets(
      project_id TEXT NOT NULL REFERENCES hydropolis_projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES hydropolis_users(id) ON DELETE CASCADE,
      file TEXT NOT NULL,
      product_id TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      mime TEXT NOT NULL DEFAULT 'application/octet-stream',
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY(project_id,file)
    );
  `);
  console.log("[Hydropolis] PostgreSQL/Supabase prêt.");
  return true;
}
function normalizeUsername(v){
  return String(v||"").trim().toLowerCase().replace(/\s+/g,".");
}
function hashPassword(password,salt=crypto.randomBytes(16).toString("hex")){
  const hash=crypto.scryptSync(String(password||""),salt,64).toString("hex");
  return {salt,hash};
}
function verifyPassword(password,user){
  try{
    const test=crypto.scryptSync(String(password||""),user.salt,64);
    const saved=Buffer.from(user.passwordHash,"hex");
    return saved.length===test.length && crypto.timingSafeEqual(saved,test);
  }catch{return false}
}
function b64url(input){return Buffer.from(input).toString("base64url")}
function signToken(user){
  const payload={sub:user.id,role:user.role||"user",exp:Date.now()+1000*60*60*24*30};
  const body=b64url(JSON.stringify(payload));
  const sig=crypto.createHmac("sha256",TOKEN_SECRET).update(body).digest("base64url");
  return body+"."+sig;
}
function parseToken(token){
  try{
    const [body,sig]=String(token||"").split(".");
    if(!body||!sig)return null;
    const expected=crypto.createHmac("sha256",TOKEN_SECRET).update(body).digest("base64url");
    if(sig.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
    const payload=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
    if(!payload.exp || payload.exp<Date.now())return null;
    return payload;
  }catch{return null}
}
function mapPgUser(r){
  if(!r)return null;
  return {
    id:r.id,name:r.name,username:r.username,role:r.role||"user",
    title:r.title||"",email:r.email||"",phone:r.phone||"",
    salt:r.salt,passwordHash:r.password_hash,disabled:!!r.disabled,
    createdAt:r.created_at instanceof Date?r.created_at.toISOString():String(r.created_at||"")
  };
}
function mapPgProject(r){
  if(!r)return null;
  return {
    id:r.id,userId:r.user_id,name:r.name||"Projet sans nom",client:r.client||"",
    data:r.data||{},
    createdAt:r.created_at instanceof Date?r.created_at.toISOString():String(r.created_at||""),
    updatedAt:r.updated_at instanceof Date?r.updated_at.toISOString():String(r.updated_at||"")
  };
}

async function storeCountUsers(){
  if(USE_POSTGRES){
    const q=await pgPool.query("SELECT COUNT(*)::int AS n FROM hydropolis_users");
    return Number(q.rows[0]?.n||0);
  }
  return readDb().users.length;
}
async function storeFindUserById(id){
  if(USE_POSTGRES){
    const q=await pgPool.query("SELECT * FROM hydropolis_users WHERE id=$1 LIMIT 1",[id]);
    return mapPgUser(q.rows[0]);
  }
  return readDb().users.find(u=>u.id===id)||null;
}
async function storeFindUserByUsername(username){
  if(USE_POSTGRES){
    const q=await pgPool.query("SELECT * FROM hydropolis_users WHERE username=$1 LIMIT 1",[username]);
    return mapPgUser(q.rows[0]);
  }
  return readDb().users.find(u=>u.username===username)||null;
}
async function storeListUsers(){
  if(USE_POSTGRES){
    const q=await pgPool.query("SELECT * FROM hydropolis_users ORDER BY created_at ASC");
    return q.rows.map(mapPgUser);
  }
  return readDb().users;
}
async function storeCreateUser(user){
  if(USE_POSTGRES){
    await pgPool.query(
      `INSERT INTO hydropolis_users
       (id,name,username,role,title,email,phone,salt,password_hash,disabled,created_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [user.id,user.name,user.username,user.role||"user",user.title||"",user.email||"",user.phone||"",
       user.salt,user.passwordHash,!!user.disabled,user.createdAt||new Date().toISOString()]
    );
    return user;
  }
  const db=readDb();db.users.push(user);writeDb(db);return user;
}
async function storeUpdateUserProfile(id,patch){
  if(USE_POSTGRES){
    const q=await pgPool.query(
      `UPDATE hydropolis_users SET name=$2,title=$3,email=$4,phone=$5
       WHERE id=$1 RETURNING *`,
      [id,patch.name,patch.title||"",patch.email||"",patch.phone||""]
    );
    return mapPgUser(q.rows[0]);
  }
  const db=readDb(),u=db.users.find(x=>x.id===id);if(!u)return null;
  Object.assign(u,patch);writeDb(db);return u;
}
async function storeUpdatePassword(id,salt,passwordHash){
  if(USE_POSTGRES){
    const q=await pgPool.query(
      "UPDATE hydropolis_users SET salt=$2,password_hash=$3 WHERE id=$1 RETURNING id",
      [id,salt,passwordHash]
    );
    return !!q.rowCount;
  }
  const db=readDb(),u=db.users.find(x=>x.id===id);if(!u)return false;
  u.salt=salt;u.passwordHash=passwordHash;writeDb(db);return true;
}
async function storeDeleteUser(id){
  if(USE_POSTGRES){
    const q=await pgPool.query("DELETE FROM hydropolis_users WHERE id=$1",[id]);
    return q.rowCount>0;
  }
  const db=readDb(),before=db.users.length;
  db.users=db.users.filter(u=>u.id!==id);
  db.projects=db.projects.filter(p=>p.userId!==id);
  writeDb(db);return db.users.length<before;
}

async function storeListProjects(userId){
  if(USE_POSTGRES){
    const q=await pgPool.query(
      "SELECT * FROM hydropolis_projects WHERE user_id=$1 ORDER BY updated_at DESC",[userId]
    );
    return q.rows.map(mapPgProject);
  }
  return readDb().projects.filter(p=>p.userId===userId)
    .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
async function storeGetProject(userId,id){
  if(USE_POSTGRES){
    const q=await pgPool.query(
      "SELECT * FROM hydropolis_projects WHERE id=$1 AND user_id=$2 LIMIT 1",[id,userId]
    );
    return mapPgProject(q.rows[0]);
  }
  return readDb().projects.find(p=>p.id===id&&p.userId===userId)||null;
}
async function storeCreateProject(project){
  if(USE_POSTGRES){
    await pgPool.query(
      `INSERT INTO hydropolis_projects(id,user_id,name,client,data,created_at,updated_at)
       VALUES($1,$2,$3,$4,$5::jsonb,$6,$7)`,
      [project.id,project.userId,project.name,project.client||"",JSON.stringify(project.data||{}),
       project.createdAt,project.updatedAt]
    );
    return project;
  }
  const db=readDb();db.projects.push(project);writeDb(db);return project;
}
async function storeUpdateProject(userId,id,{name,client,data}){
  if(USE_POSTGRES){
    const q=await pgPool.query(
      `UPDATE hydropolis_projects
       SET name=COALESCE($3,name),client=COALESCE($4,client),
           data=COALESCE($5::jsonb,data),updated_at=NOW()
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [id,userId,name??null,client??null,data===undefined?null:JSON.stringify(data)]
    );
    return mapPgProject(q.rows[0]);
  }
  const db=readDb(),p=db.projects.find(x=>x.id===id&&x.userId===userId);if(!p)return null;
  if(name!==undefined)p.name=name;if(client!==undefined)p.client=client;if(data!==undefined)p.data=data;
  p.updatedAt=new Date().toISOString();writeDb(db);return p;
}
async function storeDeleteProject(userId,id){
  if(USE_POSTGRES){
    const q=await pgPool.query("DELETE FROM hydropolis_projects WHERE id=$1 AND user_id=$2",[id,userId]);
    return q.rowCount>0;
  }
  const db=readDb(),before=db.projects.length;
  db.projects=db.projects.filter(p=>!(p.id===id&&p.userId===userId));writeDb(db);
  return db.projects.length<before;
}
async function storeAssetPut(userId,projectId,asset){
  if(USE_POSTGRES){
    await pgPool.query(
      `INSERT INTO hydropolis_assets(project_id,user_id,file,product_id,name,mime,data,created_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT(project_id,file) DO UPDATE SET
       product_id=EXCLUDED.product_id,name=EXCLUDED.name,mime=EXCLUDED.mime,
       data=EXCLUDED.data,created_at=NOW()`,
      [projectId,userId,asset.file,asset.productId||"",asset.name||"",asset.mime||"application/pdf",asset.data]
    );
    return true;
  }
  const dir=path.join(HYDRO_DATA_DIR,"uploads",String(userId),String(projectId));
  fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,asset.file),asset.data);return true;
}
async function storeAssetDelete(userId,projectId,file){
  if(USE_POSTGRES){
    await pgPool.query(
      "DELETE FROM hydropolis_assets WHERE project_id=$1 AND user_id=$2 AND file=$3",
      [projectId,userId,file]
    );
    return true;
  }
  try{fs.unlinkSync(path.join(HYDRO_DATA_DIR,"uploads",String(userId),String(projectId),file))}catch{}
  return true;
}
async function storeAssetGet(userId,projectId,file){
  if(USE_POSTGRES){
    const q=await pgPool.query(
      `SELECT file,name,mime,data FROM hydropolis_assets
       WHERE project_id=$1 AND user_id=$2 AND file=$3 LIMIT 1`,
      [projectId,userId,file]
    );
    return q.rows[0]||null;
  }
  const full=path.join(HYDRO_DATA_DIR,"uploads",String(userId),String(projectId),file);
  if(!fs.existsSync(full))return null;
  return {file,name:file,mime:"application/pdf",data:fs.readFileSync(full)};
}

async function authUser(req){
  const raw=String(req.headers.authorization||"");
  const token=raw.startsWith("Bearer ")?raw.slice(7):String(req.query?.access||"");
  const payload=parseToken(token);
  if(!payload)return null;
  const user=await storeFindUserById(payload.sub);
  if(!user || user.disabled)return null;
  return {
    id:user.id,name:user.name,username:user.username,role:user.role||"user",
    title:user.title||"",email:user.email||"",phone:user.phone||""
  };
}
async function requireAuth(req,res,next){
  try{
    const user=await authUser(req);
    if(!user)return res.status(401).json({error:"Authentification requise"});
    req.user=user;next();
  }catch(e){
    console.error("[auth]",e);
    res.status(500).json({error:"Erreur d'authentification"});
  }
}
function requireAdmin(req,res,next){
  if(!req.user || req.user.role!=="admin")return res.status(403).json({error:"Administrateur requis"});
  next();
}
function publicUser(u){
  return {
    id:u.id,name:u.name,username:u.username,role:u.role||"user",
    title:u.title||"",email:u.email||"",phone:u.phone||"",createdAt:u.createdAt
  };
}
function publicProject(p){
  return {
    id:p.id,name:p.name||"Projet sans nom",client:p.client||"",
    updatedAt:p.updatedAt,createdAt:p.createdAt
  };
}

app.get("/api/auth/status",async(req,res)=>{
  try{
    const count=await storeCountUsers();
    const user=await authUser(req);
    res.json({
      setupRequired:count===0,
      user:user||null,
      persistentPath:USE_POSTGRES?"Supabase PostgreSQL":HYDRO_DATA_DIR,
      persistentConfigured:USE_POSTGRES,
      storage:USE_POSTGRES?"postgresql":"local-file"
    });
  }catch(e){
    console.error("[auth status]",e);
    res.status(500).json({error:"Connexion à la base impossible",detail:e.message});
  }
});

app.post("/api/auth/setup",async(req,res)=>{
  try{
    if(await storeCountUsers())return res.status(409).json({error:"Le compte administrateur existe déjà"});
    const name=String(req.body?.name||"").trim();
    const username=normalizeUsername(req.body?.username);
    const password=String(req.body?.password||"");
    if(!name || username.length<3 || password.length<6){
      return res.status(400).json({error:"Nom, identifiant (3 caractères) et mot de passe (6 caractères minimum) requis"});
    }
    const h=hashPassword(password);
    const user={
      id:crypto.randomUUID(),name,username,role:"admin",
      title:String(req.body?.title||"").trim(),
      email:String(req.body?.email||"").trim(),
      phone:String(req.body?.phone||"").trim(),
      salt:h.salt,passwordHash:h.hash,disabled:false,createdAt:new Date().toISOString()
    };
    await storeCreateUser(user);
    res.json({token:signToken(user),user:publicUser(user)});
  }catch(e){
    console.error("[setup]",e);
    const duplicate=e?.code==="23505";
    res.status(duplicate?409:500).json({error:duplicate?"Cet identifiant existe déjà":"Impossible de créer le compte",detail:e.message});
  }
});

app.post("/api/auth/login",async(req,res)=>{
  try{
    const username=normalizeUsername(req.body?.username);
    const user=await storeFindUserByUsername(username);
    if(!user || user.disabled || !verifyPassword(req.body?.password,user)){
      return res.status(401).json({error:"Identifiant ou mot de passe incorrect"});
    }
    res.json({token:signToken(user),user:publicUser(user)});
  }catch(e){
    console.error("[login]",e);
    res.status(500).json({error:"Connexion impossible"});
  }
});

app.get("/api/me",requireAuth,(req,res)=>res.json({user:req.user}));

app.patch("/api/me/profile",requireAuth,async(req,res)=>{
  try{
    const current=await storeFindUserById(req.user.id);
    if(!current)return res.status(404).json({error:"Utilisateur introuvable"});
    const name=String(req.body?.name??current.name??"").trim();
    const title=String(req.body?.title??current.title??"").trim();
    const email=String(req.body?.email??current.email??"").trim();
    const phone=String(req.body?.phone??current.phone??"").trim();
    if(!name)return res.status(400).json({error:"Le nom du commercial est requis"});
    if(email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return res.status(400).json({error:"Adresse e-mail invalide"});
    const user=await storeUpdateUserProfile(req.user.id,{name,title,email,phone});
    res.json({user:publicUser(user)});
  }catch(e){res.status(500).json({error:"Enregistrement impossible",detail:e.message})}
});

app.get("/api/users",requireAuth,requireAdmin,async(req,res)=>{
  try{res.json({users:(await storeListUsers()).map(publicUser)})}
  catch(e){res.status(500).json({error:"Impossible de charger l'équipe"})}
});

app.post("/api/users",requireAuth,requireAdmin,async(req,res)=>{
  try{
    const name=String(req.body?.name||"").trim();
    const username=normalizeUsername(req.body?.username);
    const password=String(req.body?.password||"");
    if(!name || username.length<3 || password.length<6){
      return res.status(400).json({error:"Nom, identifiant et mot de passe de 6 caractères minimum requis"});
    }
    if(await storeFindUserByUsername(username))return res.status(409).json({error:"Cet identifiant existe déjà"});
    const h=hashPassword(password);
    const user={
      id:crypto.randomUUID(),name,username,role:"user",
      title:String(req.body?.title||"").trim(),
      email:String(req.body?.email||"").trim(),
      phone:String(req.body?.phone||"").trim(),
      salt:h.salt,passwordHash:h.hash,disabled:false,createdAt:new Date().toISOString()
    };
    await storeCreateUser(user);
    res.json({user:publicUser(user)});
  }catch(e){
    const duplicate=e?.code==="23505";
    res.status(duplicate?409:500).json({error:duplicate?"Cet identifiant existe déjà":"Création impossible",detail:e.message});
  }
});

app.patch("/api/users/:id/password",requireAuth,requireAdmin,async(req,res)=>{
  try{
    const password=String(req.body?.password||"");
    if(password.length<6)return res.status(400).json({error:"6 caractères minimum"});
    const h=hashPassword(password);
    if(!await storeUpdatePassword(req.params.id,h.salt,h.hash))return res.status(404).json({error:"Utilisateur introuvable"});
    res.json({ok:true});
  }catch(e){res.status(500).json({error:"Modification impossible"})}
});

app.delete("/api/users/:id",requireAuth,requireAdmin,async(req,res)=>{
  try{
    if(req.params.id===req.user.id)return res.status(400).json({error:"Vous ne pouvez pas supprimer votre propre compte"});
    if(!await storeDeleteUser(req.params.id))return res.status(404).json({error:"Utilisateur introuvable"});
    res.json({ok:true});
  }catch(e){res.status(500).json({error:"Suppression impossible"})}
});

app.get("/api/projects",requireAuth,async(req,res)=>{
  try{res.json({projects:(await storeListProjects(req.user.id)).map(publicProject)})}
  catch(e){res.status(500).json({error:"Impossible de charger les projets",detail:e.message})}
});

app.post("/api/projects",requireAuth,async(req,res)=>{
  try{
    const now=new Date().toISOString();
    const data=(req.body?.data && typeof req.body.data==="object")?req.body.data:{};
    const name=String(req.body?.name||data?.project?.name||"Nouveau projet").trim()||"Nouveau projet";
    const project={
      id:crypto.randomUUID(),userId:req.user.id,name,
      client:String(data?.project?.client||""),data,createdAt:now,updatedAt:now
    };
    await storeCreateProject(project);
    res.json({project:publicProject(project)});
  }catch(e){res.status(500).json({error:"Création du projet impossible",detail:e.message})}
});

app.get("/api/projects/:id",requireAuth,async(req,res)=>{
  try{
    const project=await storeGetProject(req.user.id,req.params.id);
    if(!project)return res.status(404).json({error:"Projet introuvable"});
    res.json({project:{...publicProject(project),data:project.data}});
  }catch(e){res.status(500).json({error:"Lecture du projet impossible"})}
});

app.put("/api/projects/:id",requireAuth,async(req,res)=>{
  try{
    const current=await storeGetProject(req.user.id,req.params.id);
    if(!current)return res.status(404).json({error:"Projet introuvable"});
    const data=(req.body?.data && typeof req.body.data==="object")?req.body.data:undefined;
    const name=data
      ? String(req.body?.name||data?.project?.name||current.name||"Projet").trim()||"Projet"
      : (req.body?.name?String(req.body.name).trim():undefined);
    const client=data?String(data?.project?.client||""):undefined;
    const project=await storeUpdateProject(req.user.id,req.params.id,{name,client,data});
    res.json({project:publicProject(project)});
  }catch(e){res.status(500).json({error:"Enregistrement du projet impossible",detail:e.message})}
});

app.post("/api/projects/:id/duplicate",requireAuth,async(req,res)=>{
  try{
    const source=await storeGetProject(req.user.id,req.params.id);
    if(!source)return res.status(404).json({error:"Projet introuvable"});
    const now=new Date().toISOString();
    const copy={
      id:crypto.randomUUID(),userId:req.user.id,
      name:String(req.body?.name||`${source.name} — copie`),
      client:source.client||"",data:JSON.parse(JSON.stringify(source.data||{})),
      createdAt:now,updatedAt:now
    };
    await storeCreateProject(copy);
    res.json({project:publicProject(copy)});
  }catch(e){res.status(500).json({error:"Duplication impossible",detail:e.message})}
});

app.delete("/api/projects/:id",requireAuth,async(req,res)=>{
  try{
    if(!await storeDeleteProject(req.user.id,req.params.id))return res.status(404).json({error:"Projet introuvable"});
    res.json({ok:true});
  }catch(e){res.status(500).json({error:"Suppression impossible"})}
});



function controlledProductTranslationToFrench(text,context={}){
  const original=String(text||"").trim();
  if(!original)return {translation:"",confidence:"none",message:"Désignation vide."};

  const manufacturer=String(context.manufacturer||"").trim();
  let s=original;
  let hits=0;

  // Exact / near-exact sanitary phrases first. These are deliberately
  // conservative: Hydropolis prefers no proposal to an approximate proposal.
  const rules=[
    // Lefroy Brooks / English
    [/\bclassic black hand shower on sliding rail\b/gi,"douchette Classic noire sur barre coulissante"],
    [/\bclassic white hand shower on sliding rail\b/gi,"douchette Classic blanche sur barre coulissante"],
    [/\bclassic black hand shower on cradle\b/gi,"douchette Classic noire sur support"],
    [/\bclassic white hand shower on cradle\b/gi,"douchette Classic blanche sur support"],
    [/\bclassic black hand shower on wall bracket\b/gi,"douchette Classic noire sur support mural"],
    [/\bclassic white hand shower on wall bracket\b/gi,"douchette Classic blanche sur support mural"],
    [/\bsliding riser bracket for hand shower with classic black handle\b/gi,"support coulissant pour douchette avec poignée Classic noire"],
    [/\bsliding riser bracket for hand shower with classic white handle\b/gi,"support coulissant pour douchette avec poignée Classic blanche"],
    [/\bclassic black radiator stopcocks\b/gi,"robinets d’arrêt de radiateur Classic noirs"],
    [/\bclassic white radiator stopcocks\b/gi,"robinets d’arrêt de radiateur Classic blancs"],
    [/\bextended black ceramic cistern lever\b/gi,"levier rallongé de réservoir en céramique noire"],
    [/\bextended white ceramic cistern lever\b/gi,"levier rallongé de réservoir en céramique blanche"],
    [/\bblack ceramic cistern lever\b/gi,"levier de réservoir en céramique noire"],
    [/\bwhite ceramic cistern lever\b/gi,"levier de réservoir en céramique blanche"],
    [/\bblack ceramic cistern pull\s*&\s*chain\b/gi,"tirette et chaîne de réservoir en céramique noire"],
    [/\bwhite ceramic cistern pull\s*&\s*chain\b/gi,"tirette et chaîne de réservoir en céramique blanche"],
    [/\bwall mounted basin mixer\b/gi,"mitigeur de lavabo mural"],
    [/\bdeck mounted basin mixer\b/gi,"mitigeur de lavabo sur gorge"],
    [/\bthree hole basin mixer\b/gi,"mélangeur de lavabo 3 trous"],
    [/\b3 hole basin mixer\b/gi,"mélangeur de lavabo 3 trous"],
    [/\btwo hole basin mixer\b/gi,"mélangeur de lavabo 2 trous"],
    [/\b2 hole basin mixer\b/gi,"mélangeur de lavabo 2 trous"],
    [/\bsingle hole basin mixer\b/gi,"mitigeur de lavabo monotrou"],
    [/\bbasin bridge mixer\b/gi,"mélangeur de lavabo à pont"],
    [/\bbasin mixer\b/gi,"mitigeur de lavabo"],
    [/\bbasin taps?\b/gi,"robinets de lavabo"],
    [/\bbasin tap\b/gi,"robinet de lavabo"],
    [/\bbath\/shower mixer\b/gi,"mitigeur bain-douche"],
    [/\bbath shower mixer\b/gi,"mitigeur bain-douche"],
    [/\bbath filler\b/gi,"mélangeur de baignoire"],
    [/\bbath mixer\b/gi,"mitigeur de baignoire"],
    [/\bshower mixer\b/gi,"mitigeur de douche"],
    [/\bthermostatic shower valve\b/gi,"mitigeur thermostatique de douche"],
    [/\bthermostatic valve\b/gi,"mitigeur thermostatique"],
    [/\bhand shower\b/gi,"douchette"],
    [/\bshower head\b/gi,"douche de tête"],
    [/\bsliding rail\b/gi,"barre coulissante"],
    [/\bwall bracket\b/gi,"support mural"],
    [/\bdiverter\b/gi,"inverseur"],
    [/\bbottle trap\b/gi,"siphon bouteille"],
    [/\bclick clack waste\b/gi,"bonde clic-clac"],
    [/\bpop[- ]?up waste\b/gi,"bonde à tirette"],
    [/\bunslotted waste\b/gi,"bonde sans trop-plein"],
    [/\bslotted waste\b/gi,"bonde avec trop-plein"],
    [/\bbasin waste\b/gi,"bonde de lavabo"],
    [/\bwaste kit\b/gi,"ensemble de vidage"],
    [/\bwall mounted\b/gi,"mural"],
    [/\bdeck mounted\b/gi,"sur gorge"],
    [/\bconcealed\b/gi,"encastré"],
    [/\bexposed\b/gi,"apparent"],
    [/\bfreestanding\b/gi,"îlot"],
    [/\bwith\b/gi,"avec"],
    [/\bwithout\b/gi,"sans"],

    // Zucchetti / Italian
    [/\bmiscelatore lavabo\b/gi,"mitigeur de lavabo"],
    [/\bmiscelatore bidet\b/gi,"mitigeur de bidet"],
    [/\bmiscelatore vasca\b/gi,"mitigeur de baignoire"],
    [/\bmiscelatore doccia\b/gi,"mitigeur de douche"],
    [/\bdeviatore incasso\b/gi,"inverseur encastré"],
    [/\bdeviatore\b/gi,"inverseur"],
    [/\bporta doccetta\b/gi,"support de douchette"],
    [/\bdoccetta\b/gi,"douchette"],
    [/\bsoffione\b/gi,"douche de tête"],
    [/\bbocca erogazione\b/gi,"bec verseur"],
    [/\bbocca\b/gi,"bec"],
    [/\bincasso\b/gi,"encastré"],
    [/\bparete\b/gi,"mural"],
    [/\bal piano\b/gi,"sur plan"],
    [/\bda piano\b/gi,"sur plan"],
    [/\bpiletta\b/gi,"bonde"],
    [/\bscarico\b/gi,"vidage"],
    [/\bper\b/gi,"pour"],

    // Hotbath / Dutch
    [/\bwastafelmengkraan\b/gi,"mitigeur de lavabo"],
    [/\bwastafelkraan\b/gi,"robinet de lavabo"],
    [/\bbadmengkraan\b/gi,"mitigeur de baignoire"],
    [/\bdouchemengkraan\b/gi,"mitigeur de douche"],
    [/\bhoofddouche\b/gi,"douche de tête"],
    [/\bhanddouche\b/gi,"douchette"],
    [/\binbouw\b/gi,"encastré"],
    [/\bopbouw\b/gi,"apparent"],
    [/\buitloop\b/gi,"bec"],
    [/\bafvoer\b/gi,"vidage"]
  ];

  for(const [rx,repl] of rules){
    const before=s;
    s=s.replace(rx,repl);
    if(s!==before)hits++;
  }

  s=s
    .replace(/\s+/g," ")
    .replace(/\s+([,;:])/g,"$1")
    .replace(/\s*-\s*/g," – ")
    .trim();

  // Any recognised foreign technical vocabulary left behind means the result
  // is not safe enough to inject into the customer-facing designation.
  const residualForeign=/\b(basin|mixer|mounted|deck|concealed|exposed|thermostatic|valve|lever|handle|waste|bottle|trap|shower|bath|filler|freestanding|washbasin|tap|spout|flush|white|black|brushed|polished|diverter|outlet|rail|cradle|bracket|cistern|stopcocks?|miscelatore|vasca|doccia|doccetta|soffione|incasso|parete|piano|bocca|piletta|scarico|deviatore|wastafel|mengkraan|inbouw|opbouw|hoofddouche|handdouche|uitloop|afvoer)\b/i;

  const changed=s.toLowerCase()!==original.toLowerCase();
  const safe=changed && hits>0 && !residualForeign.test(s);

  if(safe){
    return {
      translation:s,
      confidence:"high",
      source:"hydropolis-controlled-glossary",
      message:`Traduction contrôlée${manufacturer?` · ${manufacturer}`:""}`
    };
  }

  return {
    translation:"",
    confidence:"low",
    source:"hydropolis-controlled-glossary",
    message:"Pas de traduction automatique suffisamment fiable pour cette désignation. Conservez l’original ou reformulez-la manuellement."
  };
}

app.post("/api/translate-product",requireAuth,async(req,res)=>{
  const text=String(req.body?.text||"").trim();
  if(!text)return res.status(400).json({error:"Désignation vide"});
  if(text.length>350)return res.status(400).json({error:"Désignation trop longue"});

  const french=/\b(mélangeur|mitigeur|robinet|lavabo|baignoire|douche|encastré|mural|bonde|siphon|thermostatique|vasque|cuvette|abattant)\b/i;
  const foreign=/\b(basin|mixer|mounted|concealed|shower|bath|waste|miscelatore|vasca|doccia|incasso|wastafel|mengkraan|inbouw|hoofddouche|handdouche)\b/i;

  if(french.test(text) && !foreign.test(text)){
    return res.json({
      original:text,
      translation:text,
      alreadyFrench:true,
      confidence:"high",
      source:"hydropolis-controlled-glossary"
    });
  }

  const result=controlledProductTranslationToFrench(text,{
    manufacturer:req.body?.manufacturer,
    collection:req.body?.collection,
    category:req.body?.category,
    reference:req.body?.reference
  });

  res.json({
    original:text,
    alreadyFrench:false,
    ...result
  });
});

app.get("/api/health",(req,res)=>res.json({
  ok:true,
  service:"Hydropolis Studio V10.14",
  database:USE_POSTGRES?"postgresql":"local-fallback",
  time:new Date().toISOString()
}));

function absoluteUrl(base,value){
  try{return new URL(value,base).href}catch{return null}
}
function productBase(reference){
  return String(reference||"")
    .toUpperCase()
    .replace(/\.(EXT|INT).*$/,"")
    .split(".")[0];
}
function isImageUrl(url){
  return /\.(jpe?g|png|webp)(?:\?|$)/i.test(String(url||""));
}
function uniqueBest(arr,key="url"){
  const m=new Map();
  for(const x of arr){
    if(!x || !x[key]) continue;
    const prev=m.get(x[key]);
    if(!prev || Number(x.score||0)>Number(prev.score||0)) m.set(x[key],x);
  }
  return [...m.values()];
}
async function imageExists(url,referer){
  try{
    const r=await axios.get(url,{
      responseType:"arraybuffer",
      timeout:9000,
      maxRedirects:4,
      validateStatus:s=>s>=200&&s<300,
      headers:{
        "User-Agent":"Mozilla/5.0",
        "Referer":referer||new URL(url).origin+"/"
      }
    });
    const ct=String(r.headers["content-type"]||"");
    return ct.startsWith("image/") && r.data && r.data.byteLength>3000;
  }catch{return false}
}
function decodeHtmlEntities(s){
  return String(s||"")
    .replace(/&quot;/g,'"')
    .replace(/&#039;/g,"'")
    .replace(/&amp;/g,"&")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">");
}
function normalizeToken(s){
  return String(s||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/&nbsp;/g," ")
    .replace(/[^a-z0-9]+/g," ")
    .trim();
}
function finishProfiles(){
  return {
    BS:["bs","brushed steel","acier brosse","acciaio spazzolato","stainless steel brushed"],
    BB:["bb","brushed black","black pvd","noir brosse","nero spazzolato","nero spazzolato pvd"],
    BC:["bc","brushed copper","copper pvd","cuivre brosse","rame spazzolato","rame spazzolato pvd"]
  };
}
function detectFinishCode(text){
  const n=" "+normalizeToken(text)+" ";
  const profiles=finishProfiles();
  for(const [code,terms] of Object.entries(profiles)){
    if(n.includes(" "+code.toLowerCase()+" ")) return code;
    for(const t of terms){
      const nt=normalizeToken(t);
      if(nt && n.includes(" "+nt+" ")) return code;
    }
  }
  return "";
}
function buildFinishOptionMap($){
  const valueToCode=new Map();
  const keyToCode=new Map();

  $("select").each((_,sel)=>{
    const name=$(sel).attr("name")||"";
    const id=$(sel).attr("id")||"";
    $(sel).find("option").each((__,opt)=>{
      const value=String($(opt).attr("value")||"").trim();
      const text=String($(opt).text()||"").trim();
      const code=detectFinishCode(text+" "+value);
      if(!code || !value) return;
      valueToCode.set(normalizeToken(value),code);
      if(name) keyToCode.set(normalizeToken(name)+"|"+normalizeToken(value),code);
      if(id) keyToCode.set(normalizeToken(id)+"|"+normalizeToken(value),code);
    });
  });
  return {valueToCode,keyToCode};
}
function variationFinishCode(v,finishOptionMap){
  const attrs=v?.attributes||{};
  for(const [key,value] of Object.entries(attrs)){
    const nk=normalizeToken(key);
    const nv=normalizeToken(value);
    if(!nv) continue;

    // Strongest signal: WooCommerce option value maps to visible option label BS/BB/BC.
    const mapped=finishOptionMap.keyToCode.get(nk+"|"+nv) || finishOptionMap.valueToCode.get(nv);
    if(mapped) return mapped;

    // Direct code / translated finish text in variation attributes.
    const direct=detectFinishCode(key+" "+value);
    if(direct) return direct;
  }
  return "";
}
function variationImageUrl(v){
  return v?.image?.full_src || v?.image?.src || v?.image?.url || "";
}
function productBase(reference){
  return String(reference||"")
    .toUpperCase()
    .replace(/\.(EXT|INT).*$/,"")
    .split(".")[0];
}
function isImageUrl(url){
  return /\.(jpe?g|png|webp)(?:\?|$)/i.test(String(url||""));
}
function isPdfUrl(url){
  return /\.pdf(?:\?|$)/i.test(String(url||""));
}



function productWords(s){
  const stop=new Set(["coalbrook","chrome","brushed","nickel","brass","gunmetal","bathroom","uk","with","and","the","for","fixed"]);
  return normalizeToken(s).split(/[^a-z0-9]+/).filter(x=>x.length>2&&!stop.has(x));
}
function similarityScore(a,b){
  const A=new Set(productWords(a)), B=new Set(productWords(b));
  if(!A.size||!B.size) return 0;
  let hit=0; for(const x of A) if(B.has(x)) hit++;
  return hit/Math.max(1,Math.min(A.size,B.size));
}
function coalbrookRangeSlug(collection){
  const map={
    bank:"bank",domo:"domo",decca:"decca",zurich:"zurich",
    "shower and bath":"shower-and-bath",accessories:"accessories",
    bay:"bay",mainstream:"mainstream"
  };
  return map[normalizeToken(collection||"")]||"";
}
async function fetchCoalbrookPage(url){
  const r=await axios.get(url,{
    timeout:22000,maxRedirects:5,validateStatus:x=>x>=200&&x<400,
    headers:{
      "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36",
      "Accept-Language":"en-GB,en;q=0.9"
    }
  });
  return String(r.data||"");
}
function coalbrookProductLinks(html,baseUrl){
  const $=cheerio.load(html), seen=new Set(), out=[];
  $("a[href*='/product/']").each((_,el)=>{
    const href=absoluteUrl(baseUrl,$(el).attr("href"));
    if(!href||seen.has(href))return;
    seen.add(href);
    const card=$(el).closest("article,li,.product,.card,.product-item,div");
    out.push({
      href,
      text:(($(el).attr("aria-label")||"")+" "+($(el).attr("title")||"")+" "+$(el).text()+" "+card.text()).trim()
    });
  });
  return out;
}

async function fetchCatalanoPage(url){
  const r=await axios.get(url,{timeout:22000,maxRedirects:5,validateStatus:x=>x>=200&&x<400,headers:{"User-Agent":"Mozilla/5.0","Accept-Language":"en-GB,en;q=0.9"}});
  return String(r.data||"");
}
function catalanoProductLinks(html,baseUrl){
  const $=cheerio.load(html),seen=new Set(),out=[];
  $("a[href*='/products/']").each((_,el)=>{
    const href=absoluteUrl(baseUrl,$(el).attr("href"));
    if(!href||seen.has(href))return; seen.add(href);
    out.push({href,text:(($(el).attr("title")||"")+" "+$(el).text()).trim()});
  });
  return out;
}
async function resolveCatalanoProductUrl(manufacturerUrl,reference,originalDescription,designation,collection){
  const ref=String(reference||"").replace(/\D/g,"");
  const base=ref.slice(0,6);
  const coll=normalizeToken(collection||"");
  const slug=coll.replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const starts=[];
  if(slug && !/accessori vari|vasca/.test(coll)) starts.push(`https://www.catalano.it/en/all-collections/${slug}/`);
  const text=normalizeToken((originalDescription||"")+" "+(designation||""));
  if(/shower tray|receveur|doccia/.test(text)) starts.push("https://www.catalano.it/en/shower-trays/");
  else if(/bathtub|baignoire|vasca/.test(text)) starts.push("https://www.catalano.it/en/bathtubs/");
  else if(/wc|bidet|toilet/.test(text)) starts.push("https://www.catalano.it/en/wc-and-bidet/");
  else if(/washbasin|lavabo|vasque/.test(text)) starts.push("https://www.catalano.it/en/washbasins/");
  starts.push(manufacturerUrl||"https://www.catalano.it/en/");
  const tried=new Set();
  for(const start of starts){
    if(!start||tried.has(start))continue; tried.add(start);
    try{
      const html=await fetchCatalanoPage(start);
      const links=catalanoProductLinks(html,start).map(x=>({...x,score:similarityScore(originalDescription||designation,x.text)})).sort((a,b)=>b.score-a.score);
      for(const item of links.slice(0,18)){
        try{
          const ph=await fetchCatalanoPage(item.href);
          const body=normalizeToken(cheerio.load(ph)("body").text());
          const digits=body.replace(/\D/g,"");
          if((ref&&digits.includes(ref)) || (base&&digits.includes(base))) return item.href;
        }catch{}
      }
    }catch{}
  }
  return manufacturerUrl;
}


let hotbathSitemapMemo={at:0,locs:[]};
let lefroySitemapMemo={at:0,html:""};
async function fetchBrandPage(url,lang="en-GB,en;q=0.9"){
  const r=await axios.get(url,{timeout:22000,maxRedirects:5,validateStatus:x=>x>=200&&x<400,headers:{"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36","Accept-Language":lang}});
  return String(r.data||"");
}
function normalizeHotbathReference(reference){
  // Keep the commercial reference untouched elsewhere, but remove trailing
  // country/language suffixes before any technical lookup or finish matching.
  // Example: AC003.BBP.IT -> AC003.BBP.
  let s=String(reference||"").toUpperCase().trim().replace(/^HB\./,"");
  s=s.replace(/\.(?:IT|FR|EN|UK|GB|DE|ES|NL)$/i,"");
  return s.replace(/\.+$/,"" ).trim();
}
function hotbathReferenceParts(reference,explicitFinishCode=""){
  const normalized=normalizeHotbathReference(reference);
  const parts=normalized.split(".").filter(Boolean);
  const base=String(parts[0]||"").replace(/EXT$/i,"").trim();
  const finishCode=String(explicitFinishCode||parts[1]||"").toUpperCase().trim();
  return {
    display:String(reference||"").trim(),
    normalized,
    base,
    finishCode,
    lookup:finishCode?`${base}.${finishCode}`:base
  };
}
function hotbathBase(reference){
  return hotbathReferenceParts(reference).base;
}
function normalizeHotbathAssetUrl(raw,baseUrl){
  const href=absoluteUrl(baseUrl,raw);
  if(!href)return null;
  try{
    const u=new URL(href);
    u.pathname=u.pathname.replace(/\/{2,}/g,"/");
    return u.href;
  }catch{return href}
}
async function resolveHotbathProductUrl(reference){
  const {base}=hotbathReferenceParts(reference);
  if(!base)return "https://www.hotbath.it/fr/home";

  const safeBase=base.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const exactRxFr=new RegExp(`/fr/produits/\\d+/${safeBase}(?:[/?#]|$)`,"i");
  const exactRxEn=new RegExp(`/en/products/\\d+/${safeBase}(?:[/?#]|$)`,"i");
  const token=normalizeToken(base);

  try{
    if(!hotbathSitemapMemo.locs.length || Date.now()-hotbathSitemapMemo.at>6*60*60*1000){
      const xml=await fetchBrandPage("https://www.hotbath.it/sitemap.xml","fr-FR,fr;q=0.9,en;q=0.7");
      const locs=[...String(xml||"").matchAll(/<loc>([^<]+)<\/loc>/gi)]
        .map(x=>String(x[1]||"").replace(/&amp;/g,"&"));
      hotbathSitemapMemo={at:Date.now(),locs};
    }
    const locs=hotbathSitemapMemo.locs||[];
    const frExact=locs.find(u=>exactRxFr.test(u));
    if(frExact)return frExact;
    const enExact=locs.find(u=>exactRxEn.test(u));
    if(enExact)return enExact;

    const frLoose=locs.find(u=>/\/fr\/produits\//i.test(u) && normalizeToken(u).includes(token));
    if(frLoose)return frLoose;
    const enLoose=locs.find(u=>/\/en\/products\//i.test(u) && normalizeToken(u).includes(token));
    if(enLoose)return enLoose;
  }catch(e){
    console.error("[hotbath-sitemap]",e.message);
  }

  try{
    const searchUrl="https://www.hotbath.it/fr/searchproducts";
    const html=await fetchBrandPage(searchUrl,"fr-FR,fr;q=0.9,en;q=0.7");
    const $=cheerio.load(html);
    let exact="",fallback="";
    $("a[href]").each((_,el)=>{
      const href=absoluteUrl(searchUrl,$(el).attr("href"));
      if(!href)return;
      const txt=normalizeToken([$(el).text()||"",$(el).attr("title")||"",href].join(" "));
      if(exactRxFr.test(href) || exactRxEn.test(href)) exact=exact||href;
      else if(txt.includes(token) && /\/((fr\/produits)|(en\/products))\//i.test(href)) fallback=fallback||href;
    });
    return exact||fallback||searchUrl;
  }catch(e){
    console.error("[hotbath-resolve]",e.message);
    return "https://www.hotbath.it/fr/searchproducts";
  }
}
function lefroyBase(reference){
  let s=String(reference||"").toUpperCase().trim();
  s=s.split("-")[0];
  s=s.replace(/(AG|CP|NK|PB|BN|BB|AB|TA|GN|MR|WH|MW)$/i,"");
  return s;
}
async function resolveLefroyProductUrl(reference,designation){
  const base=lefroyBase(reference);
  const m=base.match(/^([A-Z]+)(\d+[A-Z]?)$/);
  const slug=m?`${m[1].toLowerCase()}-${m[2].toLowerCase()}`:base.toLowerCase().replace(/[^a-z0-9]+/g,"-");
  try{
    if(!lefroySitemapMemo.html || Date.now()-lefroySitemapMemo.at>6*60*60*1000){
      lefroySitemapMemo={at:Date.now(),html:await fetchBrandPage("https://uk.lefroybrooks.com/sitemap.xml")};
    }
    const xml=lefroySitemapMemo.html;
    const locs=[...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(x=>x[1].replace(/&amp;/g,"&"));
    const exact=locs.find(u=>new RegExp("/"+slug.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&")+"/?$","i").test(u));
    if(exact)return exact;
    const loose=locs.find(u=>normalizeToken(u).includes(normalizeToken(base)));
    if(loose)return loose;
  }catch(e){console.error("[lefroy-sitemap]",e.message)}
  try{
    const index="https://uk.lefroybrooks.com/by-product";
    const html=await fetchBrandPage(index);
    const $=cheerio.load(html);let best=null;
    $("a[href]").each((_,el)=>{
      const href=absoluteUrl(index,$(el).attr("href")); if(!href||!/lefroybrooks\.com/i.test(href))return;
      const text=(($(el).text()||"")+" "+($(el).attr("title")||"")).trim();
      const score=(normalizeToken(text).includes(normalizeToken(base))?2:0)+similarityScore(designation||"",text);
      if(!best||score>best.score)best={href,score};
    });
    if(best&&best.score>=1)return best.href;
  }catch(e){console.error("[lefroy-index]",e.message)}
  return "https://uk.lefroybrooks.com/";
}


function recorModelFromData(reference,designation){
  let s=String(reference||"").replace(/^RECOR-/i,"").split("-").slice(0,3).join(" ");
  const known=["Grand Epoque","Roll Top","Carlton","Dual","Antique","Primrose","Slipper","Hudson","Lyra","Crosby","Gibson","Allen","Morgan","Epoque","Iris","Dakota","Eiffel","Siena","Canova","Chateau","Collins","Bali","Bavaria","Classic","Moritz","Fleming"];
  const hay=normalizeToken((designation||"")+" "+s);
  return known.find(x=>hay.includes(normalizeToken(x)))||"";
}
async function resolveRecorProductUrl(reference,designation){
  const model=recorModelFromData(reference,designation);
  if(!model)return "https://recor.pt/";
  const slug=model.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const candidate=`https://recor.pt/product/${slug}-en/`;
  try{
    await fetchBrandPage(candidate);
    return candidate;
  }catch(e){
    return "https://recor.pt/";
  }
}

async function resolveManufacturerProductUrl(manufacturerUrl,reference,originalDescription,designation,collection){
  if(/zucchettidesign\.it/i.test(manufacturerUrl)){
    try{
      const fullRef=String(reference||"").trim().toUpperCase();
      const baseRef=fullRef.split(".")[0];
      let target=manufacturerUrl||`https://www.zucchettidesign.it/en/products/${baseRef.toLowerCase()}`;

      // Clinical/sanitary lever variants use a dedicated -h product page.
      // Example: ZPA552.HC51 -> /products/zpa552-h?sku=ZPA552.HC51
      const suffix=fullRef.includes(".")?fullRef.split(".").slice(1).join("."):"";
      if(/^H[A-Z0-9]*$/i.test(suffix)){
        const u0=new URL(target);
        const clean=u0.pathname.replace(/\/+$/,"");
        if(!/-h$/i.test(clean)){
          u0.pathname=clean+"-h";
          target=u0.href;
        }
      }

      const u=new URL(target);
      u.searchParams.set("sku",fullRef||baseRef);
      return u.href;
    }catch{
      return manufacturerUrl;
    }
  }
  if(/catalano\.it/i.test(manufacturerUrl)) return resolveCatalanoProductUrl(manufacturerUrl,reference,originalDescription,designation,collection);
  if(/hotbath\.it/i.test(manufacturerUrl)) return resolveHotbathProductUrl(reference);
  if(/lefroybrooks\.com/i.test(manufacturerUrl)) return resolveLefroyProductUrl(reference,originalDescription||designation);
  if(/recor\.pt/i.test(manufacturerUrl)) return resolveRecorProductUrl(reference,originalDescription||designation);
  if(!/coalbrookuk\.co\.uk/i.test(manufacturerUrl)) return manufacturerUrl;

  const base=String(reference||"").toUpperCase().replace(/(?:CP|GM|BB|BN)$/,"");
  const wantedCollection=normalizeToken(collection||"");

  try{
    // 1) Coalbrook's own keyword search. The product page itself contains the real SKU.
    const searchUrl=`https://coalbrookuk.co.uk/products?keywords=${encodeURIComponent(base)}`;
    const searchHtml=await fetchCoalbrookPage(searchUrl);
    const searchLinks=coalbrookProductLinks(searchHtml,searchUrl);

    for(const item of searchLinks.slice(0,12)){
      try{
        const html=await fetchCoalbrookPage(item.href);
        const text=normalizeToken(cheerio.load(html)("body").text());
        if(text.includes(normalizeToken(base))){
          if(wantedCollection && ["bank","domo","decca","zurich"].includes(wantedCollection)){
            if(!text.includes(wantedCollection)) continue;
          }
          return item.href;
        }
      }catch{}
    }

    // 2) Fallback: only search inside the requested official range and compare names.
    const slug=coalbrookRangeSlug(collection);
    const catalogue=slug
      ?`https://coalbrookuk.co.uk/range/${slug}`
      :"https://coalbrookuk.co.uk/products";
    const rangeHtml=await fetchCoalbrookPage(catalogue);
    let target=String(originalDescription||designation||"")
      .replace(/^Coalbrook\s+/i,"");
    if(collection){
      const safe=String(collection).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      target=target.replace(new RegExp("^"+safe+"\\s+","i"),"");
    }
    target=target.replace(/\s*-\s*(brushed brass|brushed nickel|chrome|gunmetal|matt white)\s*$/i,"");

    const options=coalbrookProductLinks(rangeHtml,catalogue).map(x=>({
      ...x,score:similarityScore(target,x.text)
    })).sort((a,b)=>b.score-a.score);

    for(const item of options.slice(0,10)){
      if(item.score<0.52) break;
      try{
        const html=await fetchCoalbrookPage(item.href);
        const text=normalizeToken(cheerio.load(html)("body").text());
        // Exact SKU always wins. Otherwise require a strong title match in the correct range.
        if(text.includes(normalizeToken(base)) || item.score>=0.82){
          if(wantedCollection && ["bank","domo","decca","zurich"].includes(wantedCollection) && !text.includes(wantedCollection)) continue;
          return item.href;
        }
      }catch{}
    }
    return "";
  }catch(e){
    console.error("[coalbrook-resolve]",e.message);
    return "";
  }
}
function finishExactInText(text,finishCode,finish,reference){
  const n=normalizeToken(text);
  const f=normalizeToken(finish);
  const ref=normalizeToken(reference);
  if(ref && n.includes(ref)) return true;
  if(f && f.length>3 && n.includes(f)) return true;
  const code=String(finishCode||"").toUpperCase();
  const rawUpper=String(text||"").toUpperCase();
  if(code && (rawUpper.includes("_"+code+".") || rawUpper.includes("-"+code+".") || rawUpper.includes("/"+code+".") || rawUpper.includes(" "+code+" "))) return true;
  const aliases={
    CP:["chrome","chromed"],
    BN:["brushed nickel"],
    BB:["brushed brass"],
    GM:["gunmetal"],
    AG:["antique gold"],
    NK:["silver nickel"],
    PB:["polished brass"],
    BN:["brushed silver nickel","brushed nickel"],
    AB:["aged brass"],
    TA:["taunton"],
    MR:["xo mirror"],
    BBP:["brushed brass pvd","laiton brosse pvd"],
    BCP:["brushed copper pvd","cuivre brosse pvd"],
    MBP:["matt black pvd","noir mat pvd"],
    BGP:["brushed gunmetal pvd","gunmetal brosse pvd"],
    IX:["brushed steel","acier brosse"],
    CR:["chrome"],
    C3:["brushed nickel"],
    C50:["metal black"],
    C51:["brushed metal black"],
    N6:["matt black","matte black"],
    N1:["embossed matt black"],
    P21:["brushed pvd chocolate","pvd brushed chocolate"],
    P31:["brushed pvd british gold"],
    P41:["pvd brushed gold","brushed pvd gold"],
    P81:["brushed total black pvd","pvd brushed total black"],
    P91:["brushed pvd copper"]
  };
  return (aliases[String(finishCode||"").toUpperCase()]||[]).some(x=>n.includes(normalizeToken(x)));
}


async function validateRemoteImage(url,referer=""){
  if(!url || !/^https?:\/\//i.test(url))return {ok:false,status:0};
  try{
    const r=await axios.get(url,{
      responseType:"arraybuffer",
      timeout:12000,
      maxRedirects:4,
      validateStatus:()=>true,
      headers:{
        "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36",
        "Accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer":referer||new URL(url).origin+"/"
      }
    });
    const ct=String(r.headers["content-type"]||"").toLowerCase();
    const ok=r.status>=200 && r.status<300 && ct.startsWith("image/") && r.data && r.data.length>3500;
    return {ok,status:r.status,contentType:ct,size:r.data?.length||0,data:ok?Buffer.from(r.data):null};
  }catch(e){
    return {ok:false,status:Number(e.response?.status||0),error:e.message};
  }
}

async function scrapeManufacturer({manufacturerUrl,reference,finishCode,finish,designation,originalDescription,collection,manufacturer}){
  const base=productBase(reference);
  const requested=String(finishCode||"").toUpperCase();
  manufacturerUrl=await resolveManufacturerProductUrl(manufacturerUrl,reference,originalDescription,designation,collection);
  if(!manufacturerUrl){
    return {
      image:null, exact:false, drawing:null, technicalSheet:null, installationGuide:null,
      note:"Aucune photo Coalbrook certifiée : la fiche produit exacte n’a pas pu être identifiée sans ambiguïté."
    };
  }

  const page=await axios.get(manufacturerUrl,{
    timeout:22000,
    maxRedirects:5,
    validateStatus:s=>s>=200&&s<400,
    headers:{
      "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150 Safari/537.36",
      "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language":"en-US,en;q=0.9,it;q=0.8,fr;q=0.7",
      "Cache-Control":"no-cache"
    }
  });

  const html=String(page.data||"");
  const $=cheerio.load(html);

  // La collection Coalbrook a déjà été imposée par la page de gamme officielle.


  const candidates=[];
  const variationDebug=[];
  const finishOptionMap=buildFinishOptionMap($);

  function pushVariation(v,source="woocommerce-variation"){
    const url=variationImageUrl(v);
    if(!url || !isImageUrl(url)) return;

    const detected=variationFinishCode(v,finishOptionMap);
    const exact=!!requested && detected===requested;

    const item={
      url:absoluteUrl(manufacturerUrl,url),
      source,
      score:exact?1000:120,
      finishMatch:exact?"exact":"generic",
      detectedFinishCode:detected||null,
      variationId:v.variation_id||null,
      attributes:v.attributes||{}
    };
    candidates.push(item);

    variationDebug.push({
      variationId:v.variation_id||null,
      detectedFinishCode:detected||null,
      attributes:v.attributes||{},
      image:url
    });
  }

  function parseVariations(raw,source){
    if(!raw) return 0;
    const attempts=[raw,decodeHtmlEntities(raw),decodeHtmlEntities(decodeHtmlEntities(raw))];
    for(const value of attempts){
      try{
        const arr=JSON.parse(value);
        if(Array.isArray(arr)){
          for(const v of arr) pushVariation(v,source);
          return arr.length;
        }
      }catch{}
    }
    return 0;
  }

  $(".variations_form, form.variations_form").each((_,el)=>{
    parseVariations($(el).attr("data-product_variations"),"woocommerce-variation-attribute");
  });

  const rawPatterns=[
    /data-product_variations\s*=\s*"([^"]+)"/gi,
    /data-product_variations\s*=\s*'([^']+)'/gi
  ];
  for(const rx of rawPatterns){
    let m;
    while((m=rx.exec(html))) parseVariations(m[1],"woocommerce-variation-raw");
  }

  $("script").each((_,el)=>{
    const text=$(el).html()||"";
    if(!/variation_id/i.test(text) || !/"image"\s*:/i.test(text)) return;
    const chunks=text.match(/\[\s*\{[\s\S]{0,250000}?"variation_id"[\s\S]{0,250000}?\}\s*\]/g)||[];
    for(const chunk of chunks) parseVariations(chunk,"woocommerce-inline-script");
  });

  // Official product image/download are fallback only. They can never certify a finish.
  $("a").each((_,el)=>{
    const text=normalizeToken($(el).text());
    const href=absoluteUrl(manufacturerUrl,$(el).attr("href"));
    if(!href) return;
    if(text==="image" && isImageUrl(href)){
      candidates.push({
        url:href,
        source:"official-download",
        score:80,
        finishMatch:"generic",
        detectedFinishCode:null,
        variationId:null,
        attributes:{}
      });
    }
  });

  $("img").each((_,el)=>{
    // Hotbath has a dedicated extractor below. Do not let generic parsing
    // classify finish swatches as exact product photography.
    if(/hotbath\.it/i.test(manufacturerUrl))return;
    const $img=$(el);
    const alt=($img.attr("alt")||"").toLowerCase();
    const title=($img.attr("title")||"").toLowerCase();
    for(const attr of ["data-large_image","data-zoom-image","data-original","data-src","src"]){
      const href=absoluteUrl(manufacturerUrl,$img.attr(attr));
      if(!href || !isImageUrl(href)) continue;
      const text=(href+" "+alt+" "+title).toLowerCase();
      if(/logo|icon|sprite|avatar|flag|placeholder|loading|acciaio\.jpg|nero\.jpg|rame\.jpg|swatch/.test(text)) continue;
      let score=10;
      if(text.includes(base.toLowerCase())) score+=35;
      const imageExact=finishExactInText(text,requested,finish,reference);
      if(imageExact) score+=700;
      candidates.push({
        url:href,
        source:"official-page",
        score,
        finishMatch:imageExact?"exact":"generic",
        detectedFinishCode:null,
        variationId:null,
        attributes:{}
      });
    }
  });

  // Recor uses a WordPress gallery where the useful bathtub photo may live in
  // srcset, <source>, og:image, data-lazy attributes or CSS background-image.
  // Collect those official assets explicitly and rank the current model highest.
  const recorGallery=[];
  if(/recor\.pt/i.test(manufacturerUrl)){
    const seenRecor=new Set();
    const model=recorModelFromData(reference,designation||originalDescription||"");
    const modelToken=normalizeToken(model||"");
    const pageSlug=(()=>{try{return new URL(manufacturerUrl).pathname.toLowerCase()}catch{return ""}})();

    function recorCanonical(raw){
      const href=absoluteUrl(manufacturerUrl,raw);
      if(!href)return "";
      let s=href;
      try{
        const u=new URL(s);
        u.hash="";
        ["w","h","width","height","resize","fit","crop","quality","q"].forEach(k=>u.searchParams.delete(k));
        s=u.href;
      }catch{}
      return s
        .replace(/-\d{2,5}x\d{2,5}(?=\.(?:jpe?g|png|webp)(?:$|\?))/i,"")
        .toLowerCase();
    }

    function addRecor(raw,context="",bonus=0){
      const href=absoluteUrl(manufacturerUrl,raw);
      if(!href || !isImageUrl(href))return;
      const low=(href+" "+context).toLowerCase();
      if(/logo|favicon|icon|sprite|avatar|flag|placeholder|loading|cookie|social|payment|recor-logo/.test(low))return;
      if(/wp-content\/uploads\/.*(?:logo|marca|brand)/i.test(low))return;

      const key=recorCanonical(href);
      if(!key || seenRecor.has(key))return;
      seenRecor.add(key);

      let score=300+bonus;
      const norm=normalizeToken(low);
      if(modelToken && norm.includes(modelToken))score+=1000;
      if(model && pageSlug.includes(model.toLowerCase().replace(/[^a-z0-9]+/g,"-")))score+=500;
      if(/product|produto|banheira|bathtub|bathub/.test(low))score+=120;
      if(/gallery|woocommerce-product-gallery|elementor-gallery/.test(context.toLowerCase()))score+=180;

      const item={
        url:href,
        source:"recor-product-gallery",
        score,
        finishMatch:"generic",
        detectedFinishCode:null,
        variationId:null,
        attributes:{model}
      };
      recorGallery.push(item);
      candidates.push(item);
    }

    // Metadata often points to the main product photo.
    $("meta[property='og:image'],meta[property='og:image:secure_url'],meta[name='twitter:image']").each((_,el)=>{
      addRecor($(el).attr("content"),"meta product image",350);
    });

    // Normal and lazy-loaded image nodes, including srcset.
    $("img").each((_,el)=>{
      const im=$(el);
      const context=[
        im.attr("alt")||"", im.attr("title")||"",
        im.attr("class")||"", im.parent().attr("class")||""
      ].join(" ");
      for(const attr of ["data-large_image","data-original","data-lazy-src","data-src","src"]){
        addRecor(im.attr(attr),context,100);
      }
      for(const attr of ["srcset","data-srcset"]){
        const ss=im.attr(attr)||"";
        const parts=ss.split(",").map(x=>x.trim()).filter(Boolean);
        if(parts.length){
          // Prefer largest candidate in srcset.
          addRecor(parts[parts.length-1].split(/\s+/)[0],context,140);
        }
      }
    });

    $("picture source").each((_,el)=>{
      const ss=$(el).attr("srcset")||"";
      const parts=ss.split(",").map(x=>x.trim()).filter(Boolean);
      if(parts.length)addRecor(parts[parts.length-1].split(/\s+/)[0],$(el).parent().attr("class")||"",140);
    });

    // Elementor / WordPress background images.
    $("[style]").each((_,el)=>{
      const style=$(el).attr("style")||"";
      const rx=/url\((['"]?)([^'")]+)\1\)/gi;
      let m;
      while((m=rx.exec(style)))addRecor(m[2],($(el).attr("class")||"")+" "+style,80);
    });

    // Raw HTML fallback for image URLs embedded in JSON or CSS.
    const rawRecor=html.match(/https?:\\?\/\\?\/[^"'<>\\\s]+?\.(?:jpe?g|png|webp)(?:\\?[^"'<>\\\s]*)?/gi)||[];
    for(const raw of rawRecor){
      addRecor(raw.replace(/\\\//g,"/").replace(/&amp;/g,"&"),"raw html",20);
    }
  }





  function catalanoFinishTerms(finishCode,finish,reference){
    const code=String(finishCode||"").replace(/\D/g,"");
    const ref=String(reference||"").replace(/\D/g,"");
    const suffix=(code||ref.slice(-4)).slice(-2);
    const map={
      "01":["glossy white","bianco lucido","white","bianco"],
      "21":["satin bianco","bianco satinato","satin white","white satin"],
      "22":["satin nero","nero satinato","nero","black","noir"],
      "23":["satin cemento","cemento satinato","cemento","cement","ciment"],
      "28":["satin acqua","acqua satinato","acqua","aqua"],
      "29":["satin sabbia","sabbia satinato","sabbia","sand","sable"],
      "30":["satin lino","lino satinato","lino","linen","lin"],
      "31":["satin seta","seta satinato","seta","silk","soie"],
      "32":["satin tortora","tortora satinato","tortora","taupe"]
    };
    const out=new Set();
    const f=normalizeToken(finish||"");
    if(f)out.add(f);
    for(const x of (map[suffix]||[]))out.add(normalizeToken(x));
    if(code){
      out.add(code);
      out.add(code.replace(/^0+/,""));
    }
    if(ref)out.add(ref);
    return [...out].filter(Boolean);
  }

  function catalanoFinishMatchText(text,finishCode,finish,reference){
    const n=normalizeToken(text||"");
    const ref=String(reference||"").replace(/\D/g,"");
    const code=String(finishCode||"").replace(/\D/g,"");
    if(ref && n.replace(/\D/g,"").includes(ref))return true;
    if(code && n.replace(/\D/g,"").includes(code))return true;
    return catalanoFinishTerms(finishCode,finish,reference)
      .some(t=>t.length>2 && n.includes(t));
  }

  // Catalano: collect the real gallery from the resolved product page.
  // Important: Catalano commonly exposes the same visual through src/data-src/srcset
  // at several sizes. We deduplicate resized variants, but keep genuinely different views.
  const catalanoGallery=[];
  if(/catalano\.it/i.test(manufacturerUrl)){
    const gallerySeen=new Set();

    function catalanoCanonical(url){
      if(!url) return "";
      let out=absoluteUrl(manufacturerUrl,url);
      if(!out) return "";
      try{
        const u=new URL(out);
        // Width/height/transformation parameters must not turn one photo into many photos.
        ["w","h","width","height","resize","fit","crop","quality","q"].forEach(k=>u.searchParams.delete(k));
        u.hash="";
        out=u.href;
      }catch{}
      // WordPress/resizer naming: foo-768x1024.jpg == foo.jpg for deduplication.
      out=out.replace(/-\d{2,5}x\d{2,5}(?=\.(?:jpe?g|png|webp)(?:$|\?))/i,"");
      return out.toLowerCase();
    }

    function addCatalanoGallery(raw,alt="",title=""){
      const href=absoluteUrl(manufacturerUrl,raw);
      if(!href || !isImageUrl(href)) return;
      const context=(href+" "+alt+" "+title);
      const low=context.toLowerCase();
      if(/logo|icon|sprite|avatar|flag|placeholder|loading|swatch|favicon|cookie|social|plus-feature|fitting|accessor/.test(low)) return;
      // Exclude tiny assets, finish chips and interface images.
      if(/[?&](?:w|width|h|height)=([1-9]\d?|1\d\d)(?:&|$)/i.test(href)) return;
      const key=catalanoCanonical(href);
      if(!key || gallerySeen.has(key)) return;
      gallerySeen.add(key);

      const exactFinish=catalanoFinishMatchText(context,requested,finish,reference);
      catalanoGallery.push({
        url:href,
        source:"catalano-product-gallery",
        score:(exactFinish?12000:9000)-catalanoGallery.length,
        finishMatch:exactFinish?"exact":"generic",
        detectedFinishCode:exactFinish?requested:null,
        variationId:null,
        attributes:{alt,title,context}
      });
    }

    // Preserve DOM order: on Catalano this reflects the product gallery order.
    $("picture").each((_,el)=>{
      const $p=$(el);
      $p.find("source").each((__,s)=>{
        const ss=$(s).attr("srcset")||"";
        // Prefer the largest candidate from each srcset.
        const parts=ss.split(",").map(x=>x.trim()).filter(Boolean);
        if(parts.length){
          const last=parts[parts.length-1].split(/\s+/)[0];
          addCatalanoGallery(last,$p.find("img").attr("alt")||"",$p.find("img").attr("title")||"");
        }
      });
      const im=$p.find("img").first();
      if(im.length){
        const alt=im.attr("alt")||"", title=im.attr("title")||"";
        for(const attr of ["data-large_image","data-original","data-lazy-src","data-src","src"]){
          addCatalanoGallery(im.attr(attr),alt,title);
        }
        const ss=im.attr("srcset")||im.attr("data-srcset")||"";
        const parts=ss.split(",").map(x=>x.trim()).filter(Boolean);
        if(parts.length) addCatalanoGallery(parts[parts.length-1].split(/\s+/)[0],alt,title);
      }
    });

    $("img").each((_,el)=>{
      const im=$(el), alt=im.attr("alt")||"", title=im.attr("title")||"";
      for(const attr of ["data-large_image","data-original","data-lazy-src","data-src","src"]){
        addCatalanoGallery(im.attr(attr),alt,title);
      }
      for(const attr of ["srcset","data-srcset"]){
        const ss=im.attr(attr)||"";
        const parts=ss.split(",").map(x=>x.trim()).filter(Boolean);
        if(parts.length) addCatalanoGallery(parts[parts.length-1].split(/\s+/)[0],alt,title);
      }
    });

    // Some Catalano templates keep gallery URLs in inline JSON/CSS instead of <img>.
    const catRaw=html.match(/https?:\\?\/\\?\/[^"'<>\\\s]+?\.(?:jpe?g|png|webp)(?:\\?[^"'<>\\\s]*)?/gi)||[];
    for(const raw of catRaw){
      addCatalanoGallery(raw.replace(/\\\//g,"/").replace(/&amp;/g,""));
    }

    catalanoGallery.forEach(x=>candidates.push(x));
  }

  // Modern manufacturer sites (notably Zucchetti) keep product images in JSON/script payloads.
  // Extract official asset URLs even when there is no rendered <img> in the server-side HTML.
  const rawUrlRx=/https?:\\?\/\\?\/[^"'<>\\\s]+?\.(?:jpe?g|png|webp)(?:\\?[^"'<>\\\s]*)?/gi;
  const rawMatches=html.match(rawUrlRx)||[];
  for(const raw of rawMatches){
    let href=raw.replace(/\\\//g,"/").replace(/&amp;/g,"&");
    try{href=decodeURIComponent(href)}catch{}
    if(!isImageUrl(href)) continue;
    const low=href.toLowerCase();
    if(/logo|icon|sprite|avatar|flag|placeholder|loading|swatch|favicon|chrome2|brushed-gunmetal|brushed-brass|brushed-nickel3/.test(low)) continue;
    if(/[?&](?:w|h)=50(?:&|$)/i.test(href)) continue;
    let score=25;
    if(/assets\.zucchettidesign\.it/i.test(href)) score+=70;
    if(low.includes(base.toLowerCase())) score+=120;
    if(low.includes(String(reference||"").toLowerCase())) score+=500;
    const exact=finishExactInText(href,requested,finish,reference);
    if(exact) score+=700;
    candidates.push({
      url:href,source:"official-script-asset",score,
      finishMatch:exact?"exact":"generic",
      detectedFinishCode:exact?requested:null,variationId:null,attributes:{}
    });
  }


  // Zucchetti: the selected SKU is passed in ?sku= above. Their current
  // product pages expose imagery through a mix of <img>, <source>, metadata
  // and JSON/script assets. Collect all those official product assets and
  // strongly prefer URLs tied to the current product base.
  if(/zucchettidesign\.it/i.test(manufacturerUrl)){
    const zBase=String(reference||"").split(".")[0].toLowerCase();
    const zRef=String(reference||"").toLowerCase();
    const zPageText=normalizeToken($("body").text());
    const zFinish=normalizeToken(finish||"");
    const pageMatchesSku=
      (!!zRef && zPageText.includes(normalizeToken(reference))) ||
      (!!zBase && zPageText.includes(normalizeToken(zBase))) ||
      (!!zFinish && zPageText.includes(zFinish));

    function addZucchettiImage(raw,context="",source="zucchetti-product-image"){
      const href=absoluteUrl(manufacturerUrl,raw);
      if(!href || !isImageUrl(href))return;
      const text=(href+" "+context).toLowerCase();
      if(/logo|favicon|icon|sprite|placeholder|loading|cookie|social|swatch|finishings?|material|texture|flag/.test(text))return;
      if(/[?&](?:w|width|h|height)=([1-9]\d?|1\d\d)(?:&|$)/i.test(href))return;

      let score=650;
      if(/assets\.zucchettidesign\.it/i.test(href))score+=450;
      if(zBase && text.includes(zBase))score+=4000;
      if(zRef && text.includes(zRef))score+=5000;
      if(/product|prodotto|gallery|image|immagini/i.test(text))score+=300;

      // Since this page was explicitly requested with the exact official SKU,
      // a product asset on a matching SKU page is valid for the selected finish
      // even when the CDN filename itself omits the finish code.
      const exact=pageMatchesSku && pageMatchesFinish && !!String(finishCode||"");
      candidates.push({
        url:href,
        source,
        score:score+(exact?3000:0),
        finishMatch:exact?"exact":"generic",
        detectedFinishCode:exact?String(finishCode||"").toUpperCase():null,
        variationId:null,
        attributes:{context}
      });
    }

    $("meta[property='og:image'],meta[name='twitter:image'],meta[property='twitter:image']").each((_,el)=>{
      addZucchettiImage($(el).attr("content")||"","metadata","zucchetti-metadata-image");
    });

    $("picture,source").each((_,el)=>{
      const node=$(el);
      for(const attr of ["src","data-src","srcset","data-srcset"]){
        const raw=node.attr(attr)||"";
        for(const part of raw.split(",")){
          const candidate=part.trim().split(/\s+/)[0];
          if(candidate)addZucchettiImage(candidate,"picture source","zucchetti-picture-image");
        }
      }
    });

    $("img").each((_,el)=>{
      const im=$(el);
      if(im.closest("#finiture").length)return;
      const ctx=[im.attr("alt"),im.attr("title"),im.attr("class")].filter(Boolean).join(" ");
      for(const attr of ["data-large_image","data-original","data-lazy-src","data-src","src"]){
        addZucchettiImage(im.attr(attr),ctx,"zucchetti-img");
      }
      for(const attr of ["srcset","data-srcset"]){
        const raw=im.attr(attr)||"";
        for(const part of raw.split(",")){
          addZucchettiImage(part.trim().split(/\s+/)[0],ctx,"zucchetti-img-srcset");
        }
      }
    });

    // Assets embedded in hydrated JSON / scripts.
    const zuRaw=html.match(/https?:\\?\/\\?\/(?:assets\.)?zucchettidesign\.it\/[^"'<>\\\s)]+?\.(?:jpe?g|png|webp)(?:\\?[^"'<>\\\s)]*)?/gi)||[];
    for(const raw of zuRaw){
      addZucchettiImage(raw.replace(/\\\//g,"/").replace(/&amp;/g,""),"inline json","zucchetti-json-image");
    }
  }

  // Hotbath: dedicated extraction only.
  // Important: the public product page can expose broken legacy images and finish
  // swatches. We therefore isolate the real hero asset, verify it later, and never
  // allow a swatch to certify a finish.
  if(/hotbath\.it/i.test(manufacturerUrl)){
    const hp=hotbathReferenceParts(reference,finishCode);
    const hBase=hp.base.toLowerCase();
    const hLookup=normalizeToken(hp.lookup);
    const displayedHotbathRef=normalizeHotbathReference($("#descrbar").first().text()||"");
    const displayedNorm=normalizeToken(displayedHotbathRef);
    const pageTitleBase=normalizeToken($("h1").first().text()||"");
    const pageMatchesSku=!!hBase && (
      pageTitleBase===normalizeToken(hp.base) ||
      displayedNorm.startsWith(normalizeToken(hp.base))
    );
    const pageMatchesFinish=!!hp.finishCode && displayedNorm===hLookup;

    // Remove any candidates that might have been collected by generic/variation logic
    // before we reached this brand-specific block.
    candidates.splice(0,candidates.length);

    function addHotbathProductImage(raw,context="",source="hotbath-main-product-image",priority=0){
      const href=normalizeHotbathAssetUrl(raw,manufacturerUrl);
      if(!href || !isImageUrl(href))return;
      const low=(href+" "+context).toLowerCase();
      if(/logo|favicon|icon|sprite|placeholder|loading|cookie|social|flag|pinterest|instagram|jsp\/template2\/images/.test(low))return;
      if(/\/prodcateg\/\d+\/(?:cr|gn|ab|bb|wh|ai|bbp|bcp|mbp)\.jpe?g(?:\?|$)/i.test(href))return;

      let score=1000+priority;
      if(source==="hotbath-main-product-image")score+=10000;
      if(hBase && low.includes(hBase))score+=2200;

      const exact=pageMatchesSku && pageMatchesFinish && source==="hotbath-main-product-image";
      candidates.push({
        url:href,
        source,
        score:score+(exact?6000:0),
        finishMatch:exact?"exact":"generic",
        detectedFinishCode:exact?hp.finishCode:null,
        variationId:null,
        attributes:{
          context,
          normalizedReference:hp.normalized,
          displayedReference:displayedHotbathRef,
          pageMatchesFinish
        }
      });
    }

    // Only the image inside #imgprod is the official product photo.
    $("#imgprod img[src]").each((_,el)=>{
      const im=$(el);
      addHotbathProductImage(
        im.attr("src")||"",
        im.attr("alt")||"",
        "hotbath-main-product-image",
        4000
      );
    });
  }

  // Coalbrook: first look for the exact full SKU anywhere in the official page HTML.
  // This is stricter and more reliable than guessing from image order.
  if(/coalbrookuk\.co\.uk/i.test(manufacturerUrl)){
    const fullRef=String(reference||"").toUpperCase();
    const escaped=fullRef.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const rx=new RegExp(`https?:\\\\?\\/\\\\?\\/[^"'<>\\\\s]*${escaped}[^"'<>\\\\s]*\\.(?:jpe?g|png|webp)(?:\\\\?[^"'<>\\\\s]*)?`,"gi");
    for(const raw of (html.match(rx)||[])){
      let href=raw.replace(/\\\//g,"/").replace(/&amp;/g,"&");
      try{href=decodeURIComponent(href)}catch{}
      const low=href.toLowerCase();
      if(/swatch|colour|color|chrome2|brushed-gunmetal|brushed-brass|brushed-nickel3/.test(low)) continue;
      candidates.push({
        url:href,
        source:"coalbrook-exact-sku-image",
        score:10000,
        finishMatch:"exact",
        detectedFinishCode:requested||null,
        variationId:null,
        attributes:{reference:fullRef}
      });
    }
  }

  // Coalbrook: product pages expose the four real product images first, then four
  // circular finish swatches. The Excel reference can differ from the current web SKU,
  // so map the requested finish by the SKU suffix in the official image URL (CP/GM/BB/BN),
  // not by requiring the full Excel reference to appear in the filename.
  if(/coalbrookuk\.co\.uk/i.test(manufacturerUrl)){
    const coalFinish=String(requested||"").toUpperCase();
    $("img").each((_,el)=>{
      const $img=$(el);
      const alt=normalizeToken($img.attr("alt")||"");
      const title=normalizeToken($img.attr("title")||"");
      const attrs=["src","data-src","srcset","data-srcset"];
      for(const attr of attrs){
        const raw=$img.attr(attr)||"";
        for(const part of raw.split(",")){
          const candidate=part.trim().split(/\s+/)[0];
          const href=absoluteUrl(manufacturerUrl,candidate);
          if(!href || !/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(href)) continue;

          const low=href.toLowerCase();
          // Never use Coalbrook's circular colour chips as product photography.
          if(
            /(?:chrome2|brushed-gunmetal|brushed-brass|brushed-nickel3|colour|color|swatch)/i.test(low) ||
            /\b(?:chrome|gunmetal|brushed brass|brushed nickel)\s+colour\b/i.test(alt+" "+title) ||
            /[?&](?:w|h)=50(?:&|$)/i.test(href)
          ) continue;

          // Real Coalbrook product images use filenames such as DC1009BB-2000.png.
          const pathname=(()=>{try{return new URL(href).pathname}catch{return href}})();
          const filename=pathname.split("/").pop()||"";
          const m=filename.toUpperCase().match(/([A-Z0-9]+)(CP|GM|BB|BN)(?:[-_].*)?\.(?:JPE?G|PNG|WEBP)$/i);
          if(!m) continue;

          const detected=m[2].toUpperCase();
          const exact=coalFinish && detected===coalFinish;
          candidates.push({
            url:href,
            source:"coalbrook-product-image",
            score: exact ? 5000 : 500,
            finishMatch: exact ? "exact" : "generic",
            detectedFinishCode:detected,
            variationId:null,
            attributes:{}
          });
        }
      }
    });
  }

  // FICHES TECHNIQUES / SPEC SHEETS + NOTICE D'INSTALLATION.
  // Hotbath often exposes the useful technical sheet as a JPG inside the
  // “Drawing” area, with icon-only links instead of textual anchors.
  function linkSemanticText(el){
    const $el=$(el);
    const bits=[
      $el.text(),
      $el.attr("title"),
      $el.attr("aria-label"),
      $el.attr("download"),
      $el.attr("class"),
      $el.parent().text(),
      $el.parent().prev().text(),
      $el.parent().parent().prev().text(),
      $el.closest("section,article,div,li,p").children("h1,h2,h3,h4,strong").first().text()
    ];
    $el.find("img").each((_,img)=>{
      bits.push($(img).attr("alt")||"");
      bits.push($(img).attr("title")||"");
      bits.push($(img).attr("aria-label")||"");
      bits.push($(img).attr("class")||"");
      bits.push(path.basename($(img).attr("src")||""));
    });
    return bits.filter(Boolean).join(" ");
  }
  function inferredDownloadType(href,hintRaw=""){
    const hint=normalizeToken(hintRaw);
    if(isPdfUrl(href) || /\bpdf\b/.test(hint)) return "pdf";
    if(isImageUrl(href) || /\b(jpg|jpeg|png|image)\b/.test(hint)) return "image";
    if(/\.(dwg|dxf|igs|stp|3ds|bim)(?:\?|$)/i.test(href) || /\b(dwg|dxf|igs|stp|3ds|bim|cad)\b/.test(hint)) return "cad";
    return "link";
  }

  let technicalSheet=null;
  let installationGuide=null;
  let drawing=null;
  let cadDrawing=null;
  const isHotbath=/hotbath\.it/i.test(manufacturerUrl);

  // Hotbath documentation is structured into labelled .attach blocks.
  // Use the DOM structure directly instead of inferring from icon filenames.
  if(isHotbath){
    $("#data .attach").each((_,box)=>{
      const b=$(box);
      const heading=normalizeToken(b.find(".titatt").first().text()||"");

      if(heading==="drawing" || heading.includes("drawing")){
        const link=b.find("a[href]").filter((__,a)=>{
          const h=normalizeHotbathAssetUrl($(a).attr("href"),manufacturerUrl);
          return !!h && isImageUrl(h);
        }).first();
        const href=normalizeHotbathAssetUrl(link.attr("href"),manufacturerUrl);
        if(href){
          drawing={
            url:href,
            label:"Drawing 2D · JPG",
            type:"image",
            source:"hotbath-drawing-jpg"
          };
          // User requirement: for Hotbath, the technical sheet used in Hydropolis
          // is precisely the JPG exposed in the Drawing section.
          technicalSheet={
            url:href,
            label:"Fiche technique · Drawing JPG",
            type:"image",
            source:"hotbath-drawing-jpg"
          };
        }
      }

      if(heading.includes("instructions")){
        const link=b.find("a[href]").filter((__,a)=>{
          const h=normalizeHotbathAssetUrl($(a).attr("href"),manufacturerUrl);
          return !!h && isPdfUrl(h);
        }).first();
        const href=normalizeHotbathAssetUrl(link.attr("href"),manufacturerUrl);
        if(href){
          installationGuide={
            url:href,
            label:"Notice d'installation",
            type:"pdf",
            source:"hotbath-instructions"
          };
        }
      }

      if(heading==="cad" || heading.includes("cad")){
        let chosen=null;
        b.find("a[href]").each((__,a)=>{
          const href=normalizeHotbathAssetUrl($(a).attr("href"),manufacturerUrl);
          if(!href)return;
          const title=String($(a).attr("title")||"").toLowerCase();
          if(!chosen || title==="dwg"){
            if(/\.(?:dwg|dxf|igs|stp|3ds)(?:\?|$)/i.test(href)){
              chosen={href,title};
            }
          }
        });
        if(chosen){
          cadDrawing={
            url:chosen.href,
            label:chosen.title==="dwg"?"Fichier DWG":"Fichier CAD",
            type:"cad",
            source:"hotbath-cad"
          };
        }
      }
    });
  }

  $("a[href]").each((_,el)=>{
    const href=absoluteUrl(manufacturerUrl,$(el).attr("href"));
    if(!href) return;

    const rawText=($(el).text()||"").trim();
    const hintRaw=linkSemanticText(el);
    const hint=normalizeToken(rawText+" "+hintRaw+" "+href);
    const type=inferredDownloadType(href,hintRaw);

    const looksTechnical=/\b(spec sheet|specification sheet|technical specification sheet|technical specifications?|technical sheet|technical data sheet|technical info|fiche technique)\b/.test(hint);
    const looksInstall=/\b(installation guide|installation servicing guide|installation and servicing guide|installation service guide|installation manual|installation manual warnings|servicing guide|instructions|notice d installation)\b/.test(hint);
    const looksDrawing=/\b(2d drawing|dwg file|drawing|disegno|dessin|technical drawing|plan technique)\b/.test(hint);
    const looksCad=/\b(cad|dwg|dxf|igs|stp|3ds|bim)\b/.test(hint) || /\.(dwg|dxf|igs|stp|3ds|bim)(?:\?|$)/i.test(href);

    if(!technicalSheet && looksTechnical){
      technicalSheet={
        url:href,
        label:rawText||(/\btechnical info\b/.test(hint)?"Technical info":"Fiche technique"),
        type,
        source:/lefroybrooks\.com/i.test(manufacturerUrl)?"lefroy-official-download":"official-download"
      };
    }

    if(!installationGuide && looksInstall){
      installationGuide={
        url:href,
        label:rawText||"Notice d'installation",
        type,
        source:/lefroybrooks\.com/i.test(manufacturerUrl)?"lefroy-official-download":"official-download"
      };
    }

    if(!drawing && looksDrawing && (type==="pdf" || type==="image" || type==="cad" || type==="link")){
      drawing={
        url:href,
        label:rawText||(/\bdrawing\b/.test(hint)?"Drawing 2D":"Dessin technique"),
        type,
        source:"official-download"
      };
    }

    if(!cadDrawing && looksCad && !looksInstall && !looksTechnical && (!drawing || type==="cad")){
      cadDrawing={
        url:href,
        label:rawText||"Fichier 2D CAD",
        type:type==="cad"?"cad":"link",
        source:"official-download"
      };
    }
  });


  // Lefroy Brooks (Squarespace): product downloads are commonly served from /s/
  // and labels use "Technical Specification Sheet" / "Installation & Servicing Guide".
  if(/lefroybrooks\.com/i.test(manufacturerUrl)){
    $("a[href]").each((_,el)=>{
      const href=absoluteUrl(manufacturerUrl,$(el).attr("href"));
      if(!href)return;
      const raw=($(el).text()||"").trim();
      const label=normalizeToken(raw+" "+linkSemanticText(el));
      const lowHref=href.toLowerCase();

      if(!technicalSheet &&
         (/\btechnical specification sheet\b/.test(label) ||
          /\btechnical specifications?\b/.test(label) ||
          /_technical_(?:specification_)?sheet/i.test(lowHref))){
        technicalSheet={
          url:href,
          label:raw||"Technical Specification Sheet",
          type:isPdfUrl(href)?"pdf":"link",
          source:"lefroy-official-download"
        };
      }

      if(!installationGuide &&
         (/\binstallation servicing guide\b/.test(label) ||
          /\binstallation and servicing guide\b/.test(label) ||
          /\bservicing guide\b/.test(label) ||
          /installation.*servic/i.test(lowHref))){
        installationGuide={
          url:href,
          label:raw||"Installation & Servicing Guide",
          type:isPdfUrl(href)?"pdf":"link",
          source:"lefroy-official-download"
        };
      }
    });

    // Raw HTML fallback for Squarespace download URLs which may be injected in JSON.
    if(!technicalSheet){
      const base=lefroyBase(reference);
      const esc=base.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      const patterns=[
        new RegExp(`https?:\\?/\\?/[^"'<>\\s]+/s/${esc}[^"'<>\\s]*Technical[^"'<>\\s]*Specification[^"'<>\\s]*\.pdf`,"i"),
        new RegExp(`https?:\\?/\\?/[^"'<>\\s]+/s/${esc}[^"'<>\\s]*Technical[^"'<>\\s]*\.pdf`,"i")
      ];
      for(const rx of patterns){
        const x=html.match(rx);
        if(x){
          const u=x[0].replace(/\\//g,"/").replace(/&amp;/g,"&");
          technicalSheet={url:u,label:"Technical Specification Sheet",type:"pdf",source:"lefroy-html-download"};
          break;
        }
      }
    }
  }

  // Zucchetti fallback: official technical sheets use the base reference as PDF filename.
  if(!technicalSheet && /zucchettidesign\.it/i.test(manufacturerUrl)){
    const zbase=String(reference||"").split(".")[0].toUpperCase();
    if(/^Z[A-Z0-9]+$/.test(zbase)){
      const candidate=`https://assets.zucchettidesign.it/uploads/downloads/pdf/${zbase}.pdf`;
      try{
        const head=await axios.get(candidate,{
          responseType:"arraybuffer",timeout:12000,maxRedirects:3,
          validateStatus:x=>x>=200&&x<300,
          headers:{"User-Agent":"Mozilla/5.0","Referer":"https://www.zucchettidesign.it/"}
        });
        const ct=String(head.headers["content-type"]||"");
        if(ct.includes("pdf") && head.data?.length>1000){
          technicalSheet={url:candidate,label:"Technical sheet",type:"pdf",source:"official-derived"};
        }
      }catch{}
    }
  }

  // Hotbath: keep the explicit Drawing JPG as both drawing and technical sheet.
  // If the current Hotbath page does not expose it, generic parsing may still
  // provide a secondary document, but it must never replace an identified Drawing JPG.
  if(isHotbath && drawing?.source==="hotbath-drawing-jpg"){
    technicalSheet={
      url:drawing.url,
      label:"Fiche technique · Drawing JPG",
      type:"image",
      source:"hotbath-drawing-jpg"
    };
  }


  // Zucchetti technical PDFs are multi-page. For Hydropolis the technical
  // drawing to present is page 3 of that official PDF. Preserve the separate
  // CAD/DXF download as an auxiliary link, but use PDF page 3 in the dossier.
  if(/zucchettidesign\.it/i.test(manufacturerUrl) && technicalSheet?.type==="pdf"){
    technicalSheet={...technicalSheet,page:3,previewPage:3};

    if(drawing && ["cad","link"].includes(drawing.type)){
      cadDrawing={...drawing};
    }

    drawing={
      url:technicalSheet.url,
      label:"Dessin technique · page 3",
      type:"pdf",
      page:3,
      source:"zucchetti-technical-sheet-page-3"
    };
  }

  // Hotbath pages currently contain legacy asset links that can return 404.
  // Validate the hero image before it can ever reach the browser.
  if(isHotbath){
    const official=[...candidates].sort((a,b)=>b.score-a.score);
    candidates.splice(0,candidates.length);

    for(const item of official){
      const check=await validateRemoteImage(item.url,manufacturerUrl);
      if(check.ok){
        candidates.push({
          ...item,
          validated:true,
          validatedContentType:check.contentType
        });
        // One live official hero is enough.
        break;
      }
      console.warn("[hotbath-official-image]",JSON.stringify({
        reference,
        url:item.url,
        status:check.status||0,
        error:check.error||""
      }));
    }

    const hp=hotbathReferenceParts(reference,requested);
    const hasOfficialExact=candidates.some(x=>x.finishMatch==="exact");
    if(!hasOfficialExact && hp.base){
      try{
        const webCandidates=await findHotbathWebImageCandidates(reference,requested,finish);
        const compact=v=>normalizeToken(v).replace(/\s+/g,"");
        const fullCompact=compact(hp.lookup);
        const baseCompact=compact(hp.base);

        for(const item of webCandidates){
          const hay=compact([item.image,item.page,item.title].join(" "));
          const exactReferenceMatch=!!item.exactReferenceMatch || (!!fullCompact && hay.includes(fullCompact));
          const baseMatch=!!baseCompact && hay.includes(baseCompact);
          if(!baseMatch)continue;
          const isSanitair=/sanitairkamer/.test(item.source||item.page||item.image||"");
          const resolvedSource=isSanitair
            ?(exactReferenceMatch?"sanitairkamer-exact":"sanitairkamer-generic")
            :(exactReferenceMatch?"hotbath-web-exact":"hotbath-web-generic");
          const resolvedFinishMatch=exactReferenceMatch?"exact":"generic";

          candidates.push({
            url:item.image,
            page:item.page||"",
            title:item.title||"",
            source:resolvedSource,
            score:exactReferenceMatch?(isSanitair?17000:15000):(isSanitair?6000:4500),
            finishMatch:resolvedFinishMatch,
            detectedFinishCode:(exactReferenceMatch || isSanitair)?hp.finishCode:null,
            variationId:null,
            attributes:{
              sourcePage:item.page||"",
              title:item.title||"",
              exactReferenceMatch,
              provider:isSanitair?"sanitairkamer":"web"
            }
          });
        }
      }catch(e){
        console.warn("[hotbath-auto-web]",e.message);
      }
    }
  }

  const sorted=uniqueBest(candidates).filter(x=>x.url).sort((a,b)=>{
    if(a.finishMatch!==b.finishMatch) return a.finishMatch==="exact"?-1:1;
    return b.score-a.score;
  });

  const isAmphora=/amphoradesign\.it/i.test(manufacturerUrl);
  const isCoalbrook=/coalbrookuk\.co\.uk/i.test(manufacturerUrl);
  let exact=sorted.find(x=>x.finishMatch==="exact" &&
    (!isAmphora || x.source.startsWith("woocommerce-variation")) &&
    (!isCoalbrook || x.source==="coalbrook-product-image" || x.source==="coalbrook-exact-sku-image")
  )||null;
  let fallback=sorted.find(x=>x.finishMatch!=="exact")||null;
  let best=exact||fallback;

  if(isHotbath){
    const officialExact=sorted.find(x=>x.source==="hotbath-main-product-image" && x.finishMatch==="exact")||null;
    const sanitairExact=sorted.find(x=>/sanitairkamer/.test(x.source||x.page||x.url||"") && x.finishMatch==="exact")||null;
    const webExact=sorted.find(x=>x.source==="hotbath-web-exact" && x.finishMatch==="exact")||null;
    const sanitairGeneric=sorted.find(x=>/sanitairkamer/.test(x.source||x.page||x.url||""))||null;
    const officialGeneric=sorted.find(x=>x.source==="hotbath-main-product-image")||null;
    const webGeneric=sorted.find(x=>x.source==="hotbath-web-generic")||null;

    exact=sanitairExact||officialExact||webExact||null;
    fallback=officialGeneric||sanitairGeneric||webGeneric||null;
    best=sanitairExact||officialExact||webExact||officialGeneric||sanitairGeneric||webGeneric||null;
  }

  // Catalano: the selected finish is authoritative.
  // Never mix images from other finishes or generic collection/lifestyle galleries.
  const isCatalano=/catalano\.it/i.test(manufacturerUrl);
  const isRecor=/recor\.pt/i.test(manufacturerUrl);
  let productImages=best?[best]:[];

  if(isRecor && recorGallery.length){
    const recorSorted=uniqueBest(recorGallery).sort((x,y)=>y.score-x.score);
    productImages=recorSorted.slice(0,2);
    best=productImages[0]||best;
  }

  if(isCatalano){
    const exactFinishGallery=catalanoGallery.filter(x=>x.finishMatch==="exact");
    const suffix=String(requested||reference||"").replace(/\D/g,"").slice(-2);
    const isWhiteFinish=["01","21"].includes(suffix);

    if(exactFinishGallery.length){
      productImages=exactFinishGallery.slice(0,6);
    }else if(isWhiteFinish){
      // White product pages often use their default gallery without explicit finish metadata.
      productImages=catalanoGallery.slice(0,2);
    }else{
      // For coloured finishes, do not pollute the dossier with unrelated lifestyle photos.
      // If Catalano does not expose an exact-finish image server-side, keep only the best
      // product visual instead of showing the whole page gallery.
      const exactSorted=sorted.filter(x=>x.finishMatch==="exact");
      productImages=(exactSorted.length?exactSorted:[best].filter(Boolean)).slice(0,2);
    }
  }

  // Évite les images cassées : on rapatrie l'image officielle choisie côté serveur
  // et on la renvoie directement au navigateur sous forme data URL.
  async function embedOfficialImage(item){
    if(!item) return item;
    if(!/(?:coalbrookuk\.co\.uk|zucchettidesign\.it|assets\.zucchettidesign\.it|catalano\.it|recor\.pt|hotbath\.it)/i.test(item.url||manufacturerUrl)) return item;
    try{
      const ir=await axios.get(item.url,{
        responseType:"arraybuffer",timeout:18000,maxRedirects:5,
        headers:{"User-Agent":"Mozilla/5.0","Referer":new URL(manufacturerUrl).origin+"/"}
      });
      const ct=String(ir.headers["content-type"]||"image/jpeg");
      if(ct.startsWith("image/") && ir.data && ir.data.length<9000000){
        return {...item,dataUrl:`data:${ct};base64,${Buffer.from(ir.data).toString("base64")}`};
      }
    }catch(e){console.warn("[manufacturer-image-embed]",e.message);}
    return item;
  }
  if(best) best=await embedOfficialImage(best);

  if(isHotbath && best && /hotbath\.it/i.test(best.url||"") && !best.dataUrl){
    // A Hotbath official asset without embedded bytes is not trustworthy:
    // its page may still reference a 404 legacy file.
    const check=await validateRemoteImage(best.url,manufacturerUrl);
    if(!check.ok){
      console.warn("[hotbath-best-image-dead]",JSON.stringify({reference,url:best.url,status:check.status||0}));
      const webAlternative=sorted.find(x=>x.source==="hotbath-web-exact" || x.source==="hotbath-web-generic")||null;
      best=webAlternative;
    }else if(check.data){
      best={...best,dataUrl:`data:${check.contentType};base64,${check.data.toString("base64")}`};
    }
  }

  if(isCatalano || isRecor){
    productImages=await Promise.all(productImages.map(embedOfficialImage));
    if(productImages.length) best=productImages[0];
  }else productImages=best?[best]:[];

  console.log("[manufacturer-image]",JSON.stringify({
    reference,
    finishCode:requested,
    exact:!!exact,
    source:best?.source||null,
    variationId:best?.variationId||null,
    detectedFinishCode:best?.detectedFinishCode||null,
    drawing:!!drawing,
    candidates:sorted.length,
    catalanoGallery:isCatalano?productImages.length:undefined,
    catalanoExactFinish:isCatalano?catalanoGallery.filter(x=>x.finishMatch==="exact").length:undefined,
    recorGallery:isRecor?productImages.length:undefined
  }));

  if(!exact){
    console.log("[manufacturer-variation-debug]",JSON.stringify({
      reference,
      finishCode:requested,
      optionValues:[...finishOptionMap.valueToCode.entries()].slice(0,20),
      variations:variationDebug.slice(0,12)
    }));
  }

  return {
    manufacturerUrl,reference,finishCode:requested,finish,base,
    best,
    images:productImages,
    exactFound:!!exact,
    drawing,
    cadDrawing,
    technicalSheet,
    installationGuide,
    candidates:sorted.slice(0,20),
    note:isHotbath
      ?(best?.source==="hotbath-main-product-image" && best.finishMatch==="exact"
        ?`Photo officielle Hotbath certifiée pour ${hotbathReferenceParts(reference,requested).lookup}.`
        :(/sanitairkamer/.test((best?.source||"")+" "+(best?.url||"")) && (/sanitairkamer/.test((best?.source||"")+" "+(best?.url||"")+" "+(best?.page||"")) ? best?.finishMatch==="exact" || best?.finishMatch==="web" : best?.finishMatch==="web"))
          ?`L'image Hotbath officielle n'était pas exploitable. Un visuel Sanitairkamer correspondant à la référence ${hotbathReferenceParts(reference,requested).lookup} a été retenu.`
          :best?.source==="hotbath-web-exact"
            ?`L'image officielle Hotbath n'était pas exploitable ou ne correspondait pas à la finition. Un visuel web correspondant à la référence exacte ${hotbathReferenceParts(reference,requested).lookup} a été retenu.`
            :best?.source==="hotbath-main-product-image"
              ?`Photo officielle Hotbath du bon produit utilisée en dernier recours. La finition ${requested||finish||"sélectionnée"} n'est pas certifiée.`
              :best
                ?`Visuel web du bon produit utilisé en dernier recours ; finition à vérifier.`
              :`Aucune image Hotbath exploitable trouvée : les liens image de la fiche officielle peuvent être obsolètes (404).`)
      :(exact
        ?`Photo officielle fabricant correspondant à la finition ${requested}, associée à la variation fabricant.`
        :(best
          ?"Visuel officiel trouvé, mais aucune donnée fabricant ne permet de certifier cette finition."
          :"Aucune photo officielle exploitable trouvée."))
  };
}


const hotbathWebImageCache=new Map();
const finishSimulationCache=new Map();

function hotbathFinishTarget(code){
  const c=String(code||"").toUpperCase();
  const map={
    CR:{rgb:[205,207,207],strength:.74,label:"Chrome"},
    GN:{rgb:[166,163,153],strength:.72,label:"Nickel brossé"},
    AB:{rgb:[113,88,60],strength:.82,label:"Laiton vieilli"},
    BB:{rgb:[166,139,86],strength:.78,label:"Laiton brossé"},
    WH:{rgb:[232,229,220],strength:.84,label:"Blanc mat"},
    AI:{rgb:[83,78,72],strength:.82,label:"Fer vieilli"},
    BBP:{rgb:[181,146,69],strength:.82,label:"Laiton brossé PVD"},
    BCP:{rgb:[151,91,67],strength:.84,label:"Cuivre brossé PVD"},
    MBP:{rgb:[36,35,34],strength:.90,label:"Noir mat"}
  };
  return map[c]||null;
}


function normalizeCompact(v){
  return normalizeToken(v).replace(/\s+/g,"");
}
function hotbathFinishAliases(code,finish=""){
  const c=String(code||"").toUpperCase();
  const target=hotbathFinishTarget(c);
  const map={
    CR:["chrome","chromé","chrome polished","chroom"],
    GN:["nickel brosse","nickel brossé","nickel brushed","geborsteld nikkel","nikkel geborsteld"],
    AB:["laiton vieilli","aged brass","verouderd messing","messing verouderd"],
    BB:["laiton brosse","laiton brossé","brushed brass","geborsteld messing","messing geborsteld"],
    WH:["blanc mat","mat white","wit mat","mat wit"],
    AI:["fer vieilli","aged iron","verouderd ijzer"],
    BBP:["laiton brosse pvd","laiton brossé pvd","brushed brass pvd","geborsteld messing pvd","messing geborsteld pvd"],
    BCP:["cuivre brosse pvd","cuivre brossé pvd","brushed copper pvd","koper geborsteld pvd","geborsteld koper pvd","koper geborsteld","geborsteld koper"],
    MBP:["noir mat pvd","noir brosse pvd","mat black pvd","brushed black pvd","zwart mat pvd","geborsteld zwart pvd","mat zwart pvd"]
  };
  return [...new Set([finish,target?.label,...(map[c]||[])]
    .filter(Boolean)
    .map(x=>normalizeToken(x))
    .filter(x=>x && x.length>2))];
}
function hotbathFinishReferenceVariants(code=""){
  const c=String(code||"").toUpperCase().trim();
  const map={
    // Sanitairkamer sometimes uses BC for Hotbath's BCP copper finish.
    BCP:["BCP","BC"],
    BBP:["BBP"],
    MBP:["MBP"]
  };
  return map[c]||[c].filter(Boolean);
}
function sanitairkamerPageUrlScore(pageUrl,base,finishCode="",finish=""){
  const href=String(pageUrl||"").trim();
  const compact=normalizeCompact(href);
  const normalized=normalizeToken(href);
  const baseCompact=normalizeCompact(base);
  const variants=hotbathFinishReferenceVariants(finishCode);
  const finishTerms=hotbathFinishAliases(finishCode,finish);
  let score=0;
  if(baseCompact && compact.includes(baseCompact))score+=100;
  for(const code of variants){
    const sku=normalizeCompact(`${base}${code}`);
    if(sku && compact.includes(sku)){
      score+=9000;
      break;
    }
  }
  for(const term of finishTerms){
    if(term && normalized.includes(term)){
      score+=3500;
      break;
    }
  }
  if(/accessoire|toebehoren|onderdeel|spare|reserve|service|handleiding|instructie/i.test(href))score-=5000;
  return score;
}
async function sanitairkamerBasePageCandidates(reference,finishCode="",finish=""){
  const hp=hotbathReferenceParts(reference,finishCode);
  const base=String(hp.base||"").toUpperCase();
  if(!base)return [];

  const urls=[];
  const addUrl=(raw)=>{
    const href=String(raw||"").trim();
    if(!/^https?:\/\//i.test(href))return;
    try{
      const u=new URL(href);
      if(!/sanitairkamer\.nl$/i.test(u.hostname) && !/\.sanitairkamer\.nl$/i.test(u.hostname))return;
      const hay=normalizeCompact(u.href);
      if(!hay.includes(normalizeCompact(base)))return;
      if(!/\.html(?:$|[?#])/i.test(u.href))return;
      if(!urls.includes(u.href))urls.push(u.href);
    }catch{}
  };

  // 1) PRIORITY: Sanitairkamer's own search, using ONLY the Hotbath base reference.
  // No .IT suffix and no finish code are ever sent here.
  const internalSearchUrls=[
    `https://sanitairkamer.nl/catalogsearch/result/?q=${encodeURIComponent(base)}`,
    `https://sanitairkamer.nl/catalogsearch/result/index/?q=${encodeURIComponent(base)}`
  ];
  for(const searchUrl of internalSearchUrls){
    try{
      const html=await fetchBrandPage(searchUrl,'nl-NL,nl;q=0.9,en;q=0.7');
      const $=cheerio.load(html);
      $('a[href]').each((_,el)=>{
        const href=absoluteUrl(searchUrl,$(el).attr('href'));
        const text=normalizeCompact([$(el).text()||'',$(el).attr('title')||'',href||''].join(' '));
        if(text.includes(normalizeCompact(base)))addUrl(href);
      });
      if(urls.length>=12)break;
    }catch(e){
      console.warn('[hotbath-sanitair-internal-search]',JSON.stringify({base,url:searchUrl,error:e.message}));
    }
  }

  // 2) Fallback discovery through a public search engine, STILL using the base only.
  if(urls.length<4){
    const query=`site:sanitairkamer.nl "Hotbath" "${base}"`;
    try{
      const html=await fetchBrandPage(`https://www.bing.com/search?q=${encodeURIComponent(query)}&form=QBLH`,'nl-NL,nl;q=0.9,en;q=0.7');
      const $=cheerio.load(html);
      $('a[href]').each((_,el)=>{
        const raw=String($(el).attr('href')||'').trim();
        if(/^https?:\/\//i.test(raw))addUrl(raw);
      });
    }catch(e){
      console.warn('[hotbath-sanitair-base-bing]',JSON.stringify({base,error:e.message}));
    }
    console.log('[hotbath-sanitair-base-search]',JSON.stringify({reference:hp.display,base,query,candidates:urls.slice(0,16)}));
  }else{
    console.log('[hotbath-sanitair-base-search]',JSON.stringify({reference:hp.display,base,query:`Sanitairkamer internal search: ${base}`,candidates:urls.slice(0,16)}));
  }

  const ordered=[...urls].sort((a,b)=>
    sanitairkamerPageUrlScore(b,base,hp.finishCode,finish)-sanitairkamerPageUrlScore(a,base,hp.finishCode,finish)
  );
  // V10.13: do not crawl every colour variant. The internal search can return
  // 10–20 Hotbath pages for the same base; the target finish is now ranked first.
  return ordered.slice(0,6);
}

function extractSanitairkamerPageCandidate(html,pageUrl,reference,finishCode,finish){
  const $=cheerio.load(html);
  const hp=hotbathReferenceParts(reference,finishCode);
  const base=String(hp.base||"").toUpperCase();
  const baseCompact=normalizeCompact(base);
  const finishVariants=hotbathFinishReferenceVariants(hp.finishCode||finishCode);
  const finishTerms=hotbathFinishAliases(hp.finishCode||finishCode,finish);
  const pageTitle=String($('h1').first().text()||$('title').text()||'').trim();
  const breadcrumb=String($('.breadcrumbs,.breadcrumb').first().text()||'').trim();
  const metaDescription=String($('meta[name="description"]').attr('content')||'').trim();
  const rawHeader=[pageTitle,breadcrumb,metaDescription].join(' ');
  const rawBody=[$('body').text(),pageTitle,breadcrumb,metaDescription].join(' ');
  const bodyText=normalizeToken(rawHeader);
  const bodyCompact=normalizeCompact(rawHeader+' '+pageUrl);
  const pageSlug=normalizeCompact(decodeURIComponent(String(pageUrl||'').split('/').pop()||'').replace(/\.html(?:[?#].*)?$/i,''));

  // Sanitairkamer's article number is the most reliable way to map a colour variant.
  // Examples: B008GN, B008CR, B008BBP, and B008BC for Hotbath BCP.
  let articleNumber="";
  const articlePatterns=[
    /Artikelnummer\s*[:|]?\s*([A-Z0-9._-]+)/i,
    /\|\s*([A-Z0-9._-]{4,})\s*(?:\n|$)/i
  ];
  for(const rx of articlePatterns){
    const mm=rawBody.match(rx);
    if(mm?.[1]){articleNumber=String(mm[1]).toUpperCase().replace(/[^A-Z0-9]/g,'');break;}
  }
  if(!articleNumber){
    const urlCompact=String(pageUrl||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    const possible=[base,...finishVariants.map(v=>base+v)].sort((a,b)=>b.length-a.length);
    articleNumber=possible.find(v=>urlCompact.includes(v))||"";
  }

  const exactBase=!!baseCompact && (bodyCompact.includes(baseCompact) || normalizeCompact(pageUrl).includes(baseCompact));
  const skuExact=finishVariants.some(code=>articleNumber===`${base}${code}` || bodyCompact.includes(normalizeCompact(`${base}${code}`)));
  const slugSkuExact=finishVariants.some(code=>pageSlug.includes(normalizeCompact(`${base}${code}`)));
  const headerHasBase=normalizeCompact(rawHeader).includes(baseCompact);
  const headerFinish=finishTerms.some(term=>term && bodyText.includes(term));
  const conflictingArticleNumber=!!articleNumber && !finishVariants.some(code=>articleNumber===`${base}${code}`);
  const exactFinish=!!(skuExact || slugSkuExact || (!conflictingArticleNumber && headerHasBase && headerFinish));
  const pageExact=exactBase && exactFinish;
  const gallery=[];

  function push(raw,ctx='',prio=0){
    const href=absoluteUrl(pageUrl,raw);
    if(!href || !isImageUrl(href))return;
    const hay=normalizeToken((href+' '+ctx));
    if(/logo|icon|sprite|placeholder|favicon|trustpilot|klarna|paypal|review|rating|banner|avatar/.test(hay))return;
    if(/tekening|drawing|schema|dimension|afmeting|maatvoering/.test(hay))return;
    if(/accessoire|toebehoren|aanbevolen|specialisten/.test(hay))prio-=5000;
    let score=2000+prio;
    if(exactBase)score+=2500;
    if(pageExact)score+=6000;
    if(skuExact)score+=2500;
    if(hay.includes('hotbath'))score+=500;
    if(baseCompact && normalizeCompact(hay).includes(baseCompact))score+=1200;
    if(/gallery|product|fotorama|media|image|main/.test(hay))score+=700;
    gallery.push({
      image:href,
      page:pageUrl,
      title:pageTitle,
      articleNumber,
      score,
      exactReferenceMatch:pageExact,
      exactFinish:pageExact,
      source:'sanitairkamer'
    });
  }

  $('meta[property="og:image"]').each((_,el)=>push($(el).attr('content')||'', 'og:image', 2200));
  $('meta[name="twitter:image"]').each((_,el)=>push($(el).attr('content')||'', 'twitter:image', 1600));
  $('[data-gallery-role], .gallery-placeholder, .fotorama, .product.media, .product-item-info').find('img[src],img[data-src],source[srcset]').each((_,el)=>{
    const raw=$(el).attr('src')||$(el).attr('data-src')||String($(el).attr('srcset')||'').split(',')[0].trim().split(' ')[0]||'';
    const ctx=[$(el).attr('alt')||'', $(el).attr('title')||'', $(el).closest('div,li,a').attr('class')||''].join(' ');
    push(raw,ctx,1200);
  });
  $('img[src], img[data-src]').each((_,el)=>{
    const raw=$(el).attr('src')||$(el).attr('data-src')||'';
    const ctx=[$(el).attr('alt')||'', $(el).attr('title')||'', $(el).closest('section,div,li').attr('class')||''].join(' ');
    push(raw,ctx,0);
  });

  const uniq=[]; const seen=new Set();
  for(const g of gallery.sort((a,b)=>b.score-a.score)){
    if(seen.has(g.image))continue;
    seen.add(g.image);
    uniq.push(g);
    if(uniq.length>=6)break;
  }
  uniq.pageInfo={pageUrl,pageTitle,articleNumber,exactBase,skuExact,headerFinish,exactFinish:pageExact};
  return uniq;
}

async function sanitairkamerHotbathImageCandidates(reference,finishCode,finish){
  const hp=hotbathReferenceParts(reference,finishCode);
  const urls=await sanitairkamerBasePageCandidates(reference,finishCode,finish);
  console.log('[hotbath-sanitair-fast]',JSON.stringify({reference:hp.display,base:hp.base,finishCode:hp.finishCode,pagesToCheck:urls.length,first:urls[0]||null}));
  const exact=[];
  const generic=[];
  const maxPages=Math.min(urls.length,6);

  // Process the best-ranked pages one by one. In normal Hotbath cases the exact
  // finish URL (e.g. B008GN / B008BC / B008BBP) is first, so only one page is fetched.
  for(let i=0;i<maxPages;i++){
    const pageUrl=urls[i];
    try{
      const html=await fetchBrandPage(pageUrl,'nl-NL,nl;q=0.9,en;q=0.7');
      const pageCandidates=extractSanitairkamerPageCandidate(html,pageUrl,reference,finishCode,finish);
      const info=pageCandidates.pageInfo||{};
      console.log('[hotbath-sanitair-page]',JSON.stringify({
        reference:hp.display,
        base:hp.base,
        finishCode:hp.finishCode,
        rank:i+1,
        pageUrl,
        articleNumber:info.articleNumber||"",
        exactFinish:!!info.exactFinish,
        candidates:pageCandidates.slice(0,2).map(x=>({image:x.image,score:x.score,exact:x.exactReferenceMatch}))
      }));

      // If this page is not the requested finish, do not spend time validating all
      // its images. Keep at most one generic candidate for last-resort display.
      if(!info.exactFinish){
        if(!generic.length && pageCandidates[0])generic.push({...pageCandidates[0],source:'sanitairkamer'});
        continue;
      }

      // Correct finish page: validate only the top two product images and stop as
      // soon as the first live image is found.
      for(const cand of pageCandidates.slice(0,2)){
        const check=await validateRemoteImage(cand.image,pageUrl);
        if(!check.ok)continue;
        exact.push({...cand,contentType:check.contentType,source:'sanitairkamer',exactReferenceMatch:true,exactFinish:true});
        break;
      }
      if(exact.length)break;
    }catch(e){
      console.warn('[sanitairkamer-hotbath-page]',JSON.stringify({pageUrl,error:e.message}));
    }
  }

  const result=exact.length?exact:generic.slice(0,1);
  console.log('[hotbath-sanitair-result]',JSON.stringify({
    reference:hp.display,
    base:hp.base,
    finishCode:hp.finishCode,
    pagesChecked:Math.min(maxPages, exact.length?1:maxPages),
    exactCount:exact.length,
    fallbackCount:exact.length?0:generic.length,
    best:result[0]||null
  }));
  return result;
}

async function findHotbathWebImageCandidates(reference,finishCode,finish){
  const combined=[];
  try{
    const sanit=await sanitairkamerHotbathImageCandidates(reference,finishCode,finish);
    for(const item of sanit){
      combined.push({...item,prioritySource:'sanitairkamer'});
    }
  }catch(e){
    console.warn('[sanitairkamer-hotbath]',e.message);
  }
  try{
    const generic=await bingHotbathImageCandidates(reference,finishCode,finish);
    for(const item of generic){
      combined.push({...item,prioritySource:item.prioritySource||'web'});
    }
  }catch(e){
    console.warn('[hotbath-web-generic]',e.message);
  }
  combined.sort((a,b)=>b.score-a.score);
  const uniq=[]; const seen=new Set();
  for(const c of combined){
    if(seen.has(c.image))continue;
    seen.add(c.image);
    uniq.push(c);
  }
  return uniq;
}

async function bingHotbathImageCandidates(reference,finishCode,finish){
  const hp=hotbathReferenceParts(reference,finishCode);
  const full=hp.lookup;
  const base=hp.base;
  const code=hp.finishCode;
  const query=[`"${full}"`,`"${base}"`,"Hotbath",code,finish||""].filter(Boolean).join(" ");
  const searchUrl="https://www.bing.com/images/search";
  const html=await fetchBrandPage(`${searchUrl}?q=${encodeURIComponent(query)}&form=HDRSC3`,"fr-FR,fr;q=0.9,en;q=0.7");
  const $=cheerio.load(html);
  const candidates=[];

  $("a.iusc").each((_,el)=>{
    const raw=$(el).attr("m")||"";
    if(!raw)return;
    try{
      const m=JSON.parse(raw);
      const image=String(m.murl||"");
      const page=String(m.purl||"");
      const title=String(m.t||m.desc||$(el).attr("aria-label")||"");
      if(!/^https?:\/\//i.test(image))return;
      const hay=normalizeToken([image,page,title].join(" "));
      const compact=(v)=>normalizeToken(v).replace(/\s+/g,"");
      let score=0;
      if(compact(hay).includes(compact(full)))score+=5000;
      if(compact(hay).includes(compact(base)))score+=1800;
      if(code && compact(hay).includes(compact(code)))score+=1400;
      if(finish && hay.includes(normalizeToken(finish)))score+=1000;
      if(hay.includes("hotbath"))score+=900;
      if(/hotbath\.it/i.test(page)||/hotbath\.it/i.test(image))score+=1500;
      if(/pinterest|facebook|instagram|logo|icon|swatch|colour|color/i.test(image+" "+page))score-=3000;
      const exactReferenceMatch=!!full && compact(hay).includes(compact(full));
      candidates.push({image,page,title,score,exactReferenceMatch});
    }catch{}
  });

  candidates.sort((a,b)=>b.score-a.score);
  const checked=[];
  for(const item of candidates.slice(0,12)){
    if(item.score<1800)continue;
    try{
      const r=await axios.get(item.image,{
        responseType:"arraybuffer",timeout:10000,maxRedirects:4,
        validateStatus:x=>x>=200&&x<300,
        headers:{"User-Agent":"Mozilla/5.0","Referer":item.page||"https://www.bing.com/"}
      });
      const ct=String(r.headers["content-type"]||"");
      if(!ct.startsWith("image/") || !r.data || r.data.length<5000 || r.data.length>9000000)continue;
      checked.push({...item,contentType:ct});
      if(checked.length>=4)break;
    }catch{}
  }
  return checked;
}

app.post("/api/hotbath-web-image",async(req,res)=>{
  const reference=String(req.body?.reference||"").trim();
  const finishCode=String(req.body?.finishCode||"").trim();
  const finish=String(req.body?.finish||"").trim();
  if(!reference)return res.status(400).json({error:"Référence Hotbath requise"});
  const hp=hotbathReferenceParts(reference,finishCode);
  const key=[hp.lookup,finish].join("|").toLowerCase();

  try{
    let candidates=hotbathWebImageCache.get(key);
    if(!candidates){
      candidates=await findHotbathWebImageCandidates(reference,finishCode,finish);
      hotbathWebImageCache.set(key,candidates);
    }
    const exactCandidates=candidates.filter(x=>x.exactReferenceMatch===true && x.exactFinish!==false);
    const sanitairCandidates=candidates.filter(x=>/sanitairkamer/.test(x.source||x.page||x.image||""));
    res.json({
      reference,finishCode,finish,
      candidates,
      exactCandidates,
      bestExact:exactCandidates[0]||null,
      best:exactCandidates[0]||candidates[0]||null,
      exactFound:exactCandidates.length>0,
      note:exactCandidates.length
        ?(/sanitairkamer/.test((exactCandidates[0]?.source||"")+" "+(exactCandidates[0]?.page||""))
          ?"Image Sanitairkamer trouvée avec la référence Hotbath et la finition correspondante."
          :"Image web trouvée avec la référence Hotbath exacte.")
        :(sanitairCandidates.length
          ?"Visuel Sanitairkamer du bon produit trouvé, mais la finition exacte n'est pas certifiée."
          :(candidates.length
            ?"Visuel web du bon produit trouvé, mais la finition exacte n'est pas certifiée."
            :"Aucune image web suffisamment fiable trouvée pour cette référence et cette finition."))
    });
  }catch(e){
    console.error("[hotbath-web-image]",e.message);
    res.status(502).json({error:"Recherche web Hotbath impossible",detail:e.message});
  }
});

app.get("/api/finish-simulation",async(req,res)=>{
  const url=String(req.query.url||"");
  const finish=String(req.query.finish||"").toUpperCase();
  if(!/^https?:\/\//i.test(url))return res.status(400).send("URL image invalide");
  const target=hotbathFinishTarget(finish);
  if(!target)return res.status(400).send("Finition Hotbath non prise en charge");

  const cacheKey=crypto.createHash("sha1").update(url+"|"+finish).digest("hex");
  if(finishSimulationCache.has(cacheKey)){
    const cached=finishSimulationCache.get(cacheKey);
    res.set("Content-Type","image/jpeg");
    res.set("Cache-Control","public, max-age=604800");
    return res.send(cached);
  }

  try{
    const r=await axios.get(url,{
      responseType:"arraybuffer",timeout:18000,maxRedirects:5,
      headers:{"User-Agent":"Mozilla/5.0","Referer":new URL(url).origin+"/"}
    });
    const ct=String(r.headers["content-type"]||"");
    if(!ct.startsWith("image/"))return res.status(415).send("Ressource non image");

    const {createCanvas,loadImage}=await import("@napi-rs/canvas");
    const img=await loadImage(Buffer.from(r.data));
    const maxDim=1800;
    const ratio=Math.min(1,maxDim/Math.max(img.width,img.height));
    const w=Math.max(1,Math.round(img.width*ratio));
    const h=Math.max(1,Math.round(img.height*ratio));
    const canvas=createCanvas(w,h);
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);
    ctx.drawImage(img,0,0,w,h);

    const data=ctx.getImageData(0,0,w,h);
    const px=data.data;
    const [tr,tg,tb]=target.rgb;

    // Background estimate from four corners. This makes the simulation usable
    // on Hotbath's light-background product photography without recolouring it.
    const cornerAt=(x,y)=>{
      const i=(y*w+x)*4;
      return [px[i],px[i+1],px[i+2]];
    };
    const corners=[cornerAt(0,0),cornerAt(w-1,0),cornerAt(0,h-1),cornerAt(w-1,h-1)];
    const bg=[
      Math.round(corners.reduce((s,c)=>s+c[0],0)/4),
      Math.round(corners.reduce((s,c)=>s+c[1],0)/4),
      Math.round(corners.reduce((s,c)=>s+c[2],0)/4)
    ];

    for(let i=0;i<px.length;i+=4){
      const r0=px[i],g0=px[i+1],b0=px[i+2],a=px[i+3];
      if(a<12)continue;

      const bgDist=Math.sqrt((r0-bg[0])**2+(g0-bg[1])**2+(b0-bg[2])**2);
      const mx=Math.max(r0,g0,b0), mn=Math.min(r0,g0,b0);
      const lum=.2126*r0+.7152*g0+.0722*b0;

      // Preserve background and near-white studio areas.
      if(bgDist<22 || (mx>242 && mn>232))continue;

      // Preserve very dark contact shadows with a lighter influence.
      const shadowFactor=lum<45?.35:1;
      const metallic=target.strength*shadowFactor;

      // Preserve the source's highlights and geometry by modulating target colour
      // with the original luminance rather than painting a flat colour.
      const shade=Math.max(.16,Math.min(1.34,lum/150));
      const nr=Math.max(0,Math.min(255,tr*shade));
      const ng=Math.max(0,Math.min(255,tg*shade));
      const nb=Math.max(0,Math.min(255,tb*shade));

      px[i]=Math.round(r0*(1-metallic)+nr*metallic);
      px[i+1]=Math.round(g0*(1-metallic)+ng*metallic);
      px[i+2]=Math.round(b0*(1-metallic)+nb*metallic);
    }

    ctx.putImageData(data,0,0);
    const out=await canvas.encode("jpeg",90);
    if(finishSimulationCache.size>80)finishSimulationCache.clear();
    finishSimulationCache.set(cacheKey,out);
    res.set("Content-Type","image/jpeg");
    res.set("Cache-Control","public, max-age=604800");
    res.set("X-Hydropolis-Simulation",target.label);
    res.send(out);
  }catch(e){
    console.error("[finish-simulation]",e.message);
    res.status(502).send("Simulation de finition impossible");
  }
});

app.post("/api/manufacturer-image",async(req,res)=>{
  const {manufacturerUrl,reference,lookupReference,finishCode,finish,designation,originalDescription,collection,manufacturer}=req.body||{};
  if(!manufacturerUrl||!reference) return res.status(400).json({error:"manufacturerUrl et reference requis"});
  try{
    const technicalReference=/hotbath/i.test(manufacturer||"")
      ?normalizeHotbathReference(lookupReference||reference)
      :reference;
    const result=await scrapeManufacturer({manufacturerUrl,reference:technicalReference,finishCode,finish,designation,originalDescription,collection,manufacturer});
    // Preserve the commercial catalogue reference for the browser/UI.
    result.displayReference=reference;
    result.lookupReference=technicalReference;
    res.json(result);
  }catch(e){
    res.status(502).json({
      error:"Impossible d'analyser la fiche fabricant",
      detail:e.message
    });
  }
});


function safeAssetName(v){
  const name=path.basename(String(v||""));
  return /^[a-zA-Z0-9._-]+$/.test(name)?name:"";
}

app.post("/api/projects/:id/assets/:productId/technical-sheet",requireAuth,async(req,res)=>{
  try{
    const project=await storeGetProject(req.user.id,req.params.id);
    if(!project)return res.status(404).json({error:"Projet introuvable"});

    const fileName=String(req.body?.fileName||"fiche-technique.pdf");
    const mime=String(req.body?.mime||"application/pdf").toLowerCase();
    const dataBase64=String(req.body?.dataBase64||"").replace(/^data:application\/pdf;base64,/i,"");
    if(!dataBase64)return res.status(400).json({error:"Fichier PDF manquant"});

    let buf;
    try{buf=Buffer.from(dataBase64,"base64")}catch{return res.status(400).json({error:"PDF invalide"})}
    if(!buf.length || buf.length>10*1024*1024)return res.status(413).json({error:"La fiche technique doit faire moins de 10 Mo"});
    if(buf.subarray(0,5).toString("ascii")!=="%PDF-" || mime!=="application/pdf"){
      return res.status(415).json({error:"Seuls les fichiers PDF sont acceptés"});
    }

    const previous=safeAssetName(req.body?.previousFile);
    if(previous)await storeAssetDelete(req.user.id,project.id,previous);

    const stored=`tech-${String(req.params.productId).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,40)}-${crypto.randomUUID()}.pdf`;
    await storeAssetPut(req.user.id,project.id,{
      file:stored,productId:req.params.productId,
      name:path.basename(fileName)||"fiche-technique.pdf",
      mime:"application/pdf",data:buf
    });

    res.json({asset:{file:stored,name:path.basename(fileName)||"fiche-technique.pdf",mime:"application/pdf",size:buf.length}});
  }catch(e){
    console.error("[technical upload]",e);
    res.status(500).json({error:"Enregistrement de la fiche technique impossible",detail:e.message});
  }
});

app.delete("/api/projects/:id/assets/:file",requireAuth,async(req,res)=>{
  try{
    const project=await storeGetProject(req.user.id,req.params.id);
    if(!project)return res.status(404).json({error:"Projet introuvable"});
    const file=safeAssetName(req.params.file);
    if(!file)return res.status(400).json({error:"Fichier invalide"});
    await storeAssetDelete(req.user.id,project.id,file);
    res.json({ok:true});
  }catch(e){res.status(500).json({error:"Suppression du fichier impossible"})}
});

app.get("/api/project-assets/:projectId/:file",requireAuth,async(req,res)=>{
  try{
    const project=await storeGetProject(req.user.id,req.params.projectId);
    if(!project)return res.status(404).send("Projet introuvable");
    const file=safeAssetName(req.params.file);
    if(!file)return res.status(400).send("Fichier invalide");
    const asset=await storeAssetGet(req.user.id,project.id,file);
    if(!asset)return res.status(404).send("Fichier introuvable");
    res.set("Content-Type",asset.mime||"application/pdf");
    res.set("Content-Disposition",`inline; filename="${safeAssetName(asset.name)||file}"`);
    res.set("Cache-Control","private, max-age=300");
    res.send(asset.data);
  }catch(e){
    console.error("[asset read]",e);
    res.status(500).send("Lecture du fichier impossible");
  }
});

app.get("/api/pdf-page-image",async(req,res)=>{
  const url=req.query.url;
  if(!url||!/^https?:\/\//i.test(url)) return res.status(400).send("URL invalide");
  try{
    const r=await axios.get(url,{
      responseType:"arraybuffer",
      timeout:22000,
      maxRedirects:5,
      headers:{
        "User-Agent":"Mozilla/5.0",
        "Referer":new URL(url).origin+"/"
      }
    });
    const ct=String(r.headers["content-type"]||"");
    if(!ct.includes("pdf") && !isPdfUrl(url)) return res.status(415).send("Ressource non PDF");

    const [{getDocument},{createCanvas}] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("@napi-rs/canvas")
    ]);

    const loadingTask=getDocument({
      data:new Uint8Array(r.data),
      disableWorker:true,
      useSystemFonts:true
    });
    const pdf=await loadingTask.promise;
    const pageNumber=Math.max(1,Math.min(Number(pdf.numPages||1),Number.parseInt(String(req.query.page||"1"),10)||1));
    const page=await pdf.getPage(pageNumber);
    const baseViewport=page.getViewport({scale:1});
    const askedScale=Math.max(1,Math.min(3.2,Number(req.query.scale||2.4)||2.4));
    const scale=Math.min(askedScale, 2200/Math.max(baseViewport.width,baseViewport.height));
    const viewport=page.getViewport({scale});
    const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    await page.render({canvasContext:ctx,viewport}).promise;
    const png=await canvas.encode("png");
    res.set("Content-Type","image/png");
    res.set("Cache-Control","public, max-age=86400");
    res.send(png);
  }catch(e){
    console.error("[drawing-render]",e.message);
    res.status(502).send("Impossible de convertir le drawing");
  }
});

app.get("/api/image-proxy",async(req,res)=>{
  const url=req.query.url;
  if(!url||!/^https?:\/\//i.test(url)) return res.status(400).send("URL invalide");
  try{
    const r=await axios.get(url,{
      responseType:"arraybuffer",
      timeout:18000,
      maxRedirects:5,
      headers:{
        "User-Agent":"Mozilla/5.0",
        "Referer":new URL(url).origin+"/"
      }
    });
    const ct=String(r.headers["content-type"]||"image/jpeg");
    if(!ct.startsWith("image/")) return res.status(415).send("Ressource non image");
    res.set("Content-Type",ct);
    res.set("Cache-Control","public, max-age=86400");
    res.send(r.data);
  }catch(e){
    res.status(502).send("Image inaccessible");
  }
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
async function startServer(){
  try{
    await initPersistentStore();
    app.listen(PORT,"0.0.0.0",()=>console.log(`Hydropolis V10.14 on ${PORT} · ${USE_POSTGRES?"PostgreSQL":"local fallback"}`));
  }catch(e){
    console.error("[Hydropolis] Démarrage impossible :",e);
    process.exit(1);
  }
}
startServer();
