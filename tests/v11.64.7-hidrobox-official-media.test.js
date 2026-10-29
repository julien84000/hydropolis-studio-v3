'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..','public');
function registry(){
 const w={};
 vm.runInNewContext(fs.readFileSync(path.join(root,'manufacturer-official-media.js'),'utf8'),{window:w});
 return w.HydroManufacturerMediaIndex;
}
test('V11.64.7 Hidrobox collection photos: 30 exact media filenames from official WordPress',()=>{
 const index=registry(),files=index.files.Hidrobox;
 assert.equal(Object.keys(files).length,30);
 for(const [slug,file] of Object.entries(files)){
   assert.match(file,/^\/(?:[\w.-]+\/)*[\w.-]+\.(?:jpg|jpeg|png|webp)$/i,slug);
   const photo=index.get('Hidrobox',slug);
   assert.equal(photo.scope,'collection',slug);
   assert.equal(photo.collection,slug);
   assert.equal(photo.image,'https://hidrobox.com/wp-content/uploads'+file,slug);
   assert.equal(photo.source,photo.image,slug);
   assert.match(photo.label,/finition non garanties/);
   assert.ok(!photo.image.includes('placeholder')&&!photo.image.includes('stock'));
 }
 assert.equal(index.get('Hidrobox','falcon'),null,'Falcon has no verified image; do not borrow a neighbouring product photo');
 assert.equal(index.get('Other','neo-plus'),null,'manufacturer isolation');
 assert.equal(index.get('Hidrobox','not-a-real-model'),null);
 assert.equal(index.get('Hidrobox','neo-plus').image.endsWith('/Hidrobox_Showertray_Neo-Plus_Thumbnail-copia-6.png'),true);
 assert.equal(index.get('Hidrobox','program').image.endsWith('/Hidrobox_Washbasin_Program_Thumbnail.png'),true);
 assert.equal(index.get('Hidrobox','program-colour').image.endsWith('/Hidrobox_Washbasin_Program-colour_Thumbnail.png'),true);
 assert.equal(index.get('Hidrobox','paneles').image.endsWith('/Hidrobox_Showertray_Paneles_Thumbnail-1.png'),true);
 assert.equal(index.get('Hidrobox','hornacinas').image.endsWith('/Hidrobox_Niches_Thumbnail.png'),true);
 assert.equal(index.get('Hidrobox','beta-evoque').image.endsWith('/Hidrobox_Bathtub_Beta-Evoque_Thumbnail-1.png'),true);
});
test('V11.64.7 Hidrobox manufacturer media is loaded before configurators and never marked SKU exact',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const guide=fs.readFileSync(path.join(root,'hidrobox-guided.js'),'utf8');
 const js=fs.readFileSync(path.join(root,'manufacturer-official-media.js'),'utf8');
 assert(html.indexOf('manufacturer-official-media.js')>=0);
 assert(html.indexOf('manufacturer-official-media.js')<html.indexOf('hidrobox-guided.js'));
 assert.match(guide,/officialCollectionMedia\(entry\.key\)/);
 assert.match(guide,/officialGroupMedia\(g\)/);
 assert.match(guide,/imageFinishMatch:exactImage\?'exact'/);
 assert.match(guide,/imageFinishMatch:'collection'/);
 assert.match(guide,/imageScope==='collection'/);
 assert.match(guide,/couleur, dimensions et finition peuvent différer/i);
 assert.doesNotMatch(js,/imageFinishMatch:\s*['"]exact['"]/);
});
test('V11.64.7 official image index covers every verified Hidrobox collection, preserving supplier catalog structure',()=>{
 const index=registry(),media=index.files.Hidrobox;
 const guide=fs.readFileSync(path.join(root,'hidrobox-guided.js'),'utf8');
 assert.match(guide,/\['falcon','Falcon'\]/);
 for(const slug of ['neo-plus','line','twins','one','pure','quadro','arq','unique','iconik','loovers',
   'paneles','estantes','hornacinas','totems','program','program-colour','lom','guest','swap','titan',
   'soul','civit','intim','spot','fs','artop','space','beta-essential','beta-evoque','beta-fusion']){
   assert.ok(media[slug],slug+' should have official collection photo');
 }
});
