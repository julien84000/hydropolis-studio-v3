'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const s=fs.readFileSync(path.join(__dirname,'../public/hidrobox-guided.js'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'../public/hidrobox-panel-spot-ui.js'),'utf8');
const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
test('Program Colour uses generic branded brochure photo, never presented as precise SKU',()=>{
 assert.match(s,/const PROGRAM_COLOUR_GENERIC_IMAGE='?\/api\/image-proxy\?url=/);
 assert.match(s,/isProgramColour\?'':officialImage\(selected\?\.image\)/);
 assert.match(s,/const productImage=isColourCollection\?'':officialImage\(row\.image\)/);
 assert.match(s,/collectionImageFor\(entry\.key/);
 assert.match(s,/collectionImageFor\(name,groupMedia/);
 assert.match(server,/"catalogs\.edilportale\.com"/);
});
test('Official Neo Plus manual and sheet come from actual manufacturer URLs',()=>{
 assert(s.includes('https://hidrobox.com/wp-content/uploads/2025/07/mus_247_NeoPlus_Shower_Tray_0223-03.pdf'));
 assert(s.includes('https://hidrobox.com/wp-content/uploads/2025/01/ES_NeoPlus_FactSheet.pdf'));
});
test('All collection views offer technical PDF AND installation manual when available',()=>{
 assert.match(s,/Notice d’installation et d’entretien/);
 assert.match(s,/const tech=officialPdf\(assets\.technical\),manual=officialPdf\(assets\.manual\)/);
 assert.match(s,/docs:\{technical:officialPdf\(docs\.technical\),manual:officialPdf\(docs\.manual\)\}/);
 assert.match(ui,/function docsMarkup\(ctx\)/);
 assert.match(ui,/docsMarkup\(ctx\)/);
 assert.match(s,/item\.installationGuideUrl=ctx\.docs\.manual/);
 assert.match(s,/item\.technicalSheetUrl=ctx\.docs\.technical/);
});
