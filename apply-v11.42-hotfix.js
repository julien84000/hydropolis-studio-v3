#!/usr/bin/env node
"use strict";

/*
  Hydropolis Studio V11.42 — Quantity Hotfix
  Le hotfix est lancé par npm start AVANT server.js.
  Il ne dépend donc plus du buildCommand Render.
*/

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const pkgPath = path.join(root, "package.json");
const appPath = path.join(root, "public", "app.js");
const oldPatcherPath = path.join(root, "apply-v11.42-from-v11.41.js");
const desiredStart = "node apply-v11.42-hotfix.js && node server.js";

function readText(p){ return fs.readFileSync(p, "utf8"); }
function readJson(p){ return JSON.parse(readText(p)); }
function writeJson(p, obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8"); }

if(!fs.existsSync(pkgPath) || !fs.existsSync(appPath)){
  throw new Error("Hydropolis V11.42 hotfix : lancer depuis la racine du dépôt.");
}

function quantityFeaturePresent(){
  const app = readText(appPath);
  return app.includes('function normalizedQuantity(v)')
    && app.includes('class="article-quantity-input"')
    && app.includes('class="manual-qty-input"')
    && app.includes('grouped.get(key).qty+=itemQuantity(p)')
    && app.includes('effectiveSaleValue(p)*itemQuantity(p)')
    && app.includes('purchaseCostFor(p)*itemQuantity(p)');
}

let pkg = readJson(pkgPath);

if(!["11.41.0","11.42.0"].includes(String(pkg.version || ""))){
  throw new Error(
    "Hydropolis V11.42 hotfix : version de base inattendue (" +
    String(pkg.version || "inconnue") + ")."
  );
}

if(!quantityFeaturePresent()){
  if(!fs.existsSync(oldPatcherPath)){
    throw new Error("Hydropolis V11.42 hotfix : apply-v11.42-from-v11.41.js manquant.");
  }

  // Le patcher cumulatif a été validé sur la base V11.41 du dépôt.
  // Le package fourni annonce V11.42 ; on présente temporairement 11.41
  // au patcher afin qu'il transforme réellement public/app.js et le reste.
  pkg.version = "11.41.0";
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.start = desiredStart;
  writeJson(pkgPath, pkg);

  delete require.cache[require.resolve(oldPatcherPath)];
  require(oldPatcherPath);
}

// Etat final stable V11.42.
pkg = readJson(pkgPath);
pkg.version = "11.42.0";
pkg.description = "Hydropolis Studio V11.42 - gestion native des quantités par article";
pkg.scripts = pkg.scripts || {};
pkg.scripts.start = desiredStart;
writeJson(pkgPath, pkg);

if(!quantityFeaturePresent()){
  throw new Error("Hydropolis V11.42 hotfix : la gestion des quantités n'a pas été injectée.");
}

console.log("Hydropolis Studio V11.42 hotfix OK.");
console.log("Quantités articles + éléments libres + devis + Excel : actives.");
