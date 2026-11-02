'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root={},pub=path.join(__dirname,'../public');
for(const file of ['supplier-freight.js','radaway-product-options.js','radaway-tariff-loader.js']){
 const src=fs.readFileSync(path.join(pub,file),'utf8');
 vm.runInNewContext(src,{window:root,module:{exports:{}}},{filename:file,timeout:3000});
}
const freight=root.HydroSupplierFreight,opts=root.HydroRadawayOptions,tariff=root.HydroRadawayTariff;
const item=(netPurchase,heightCm,fixedPanelWidthCm=0,isFixedPanel=false)=>
 ({manufacturer:'Radaway',netPurchase,heightCm,fixedPanelWidthCm,isFixedPanel,quantity:1});

test('Radaway delivery 2026 normal and 04 05 13 2A 2B departments',()=>{
 let r=freight.radawayShipping([item(499,200)],'84');assert.equal(r.freightHT,80);
 r=freight.radawayShipping([item(500,200)],'84');assert.equal(r.freightHT,0);
 r=freight.radawayShipping([item(749,200)],'13');assert.equal(r.freightHT,130);
 r=freight.radawayShipping([item(750,200)],'13');assert.equal(r.freightHT,0);
 r=freight.radawayShipping([item(749,201)],'84');assert.equal(r.freightHT,130);
 r=freight.radawayShipping([item(750,201)],'84');assert.equal(r.freightHT,0);
 r=freight.radawayShipping([item(999,201)],'2A');assert.equal(r.freightHT,180);
 r=freight.radawayShipping([item(1000,201)],'2A');assert.equal(r.freightHT,0);
});
test('Radaway oversized orders require actual freight quote, missing data never silently priced',()=>{
 assert.equal(freight.radawayShipping([item(700,221)],'84').status,'real-costs');
 assert.equal(freight.radawayShipping([item(700,200,161,true)],'84').status,'real-costs');
 assert.equal(freight.radawayShipping([item(700,200,140,true)],'84').shippingClass,1);
 assert.equal(freight.radawayShipping([item(700,200,160,true)],'84').shippingClass,1);
 assert.equal(freight.radawayShipping([item(700,0)],'84').status,'dimensions-required');
 assert.equal(freight.radawayShipping([item(700,200)],'').status,'department-required');
});
test('Radaway supplier carriage aggregates all order lines once',()=>{
 const r=freight.calculate([item(300,200),item(300,200)],{department:'84'});
 assert.equal(r.total,0);
 assert.equal(r.byManufacturer.Radaway.freightHT,0);
});
test('2026 glass supplements preserve supplier buy rounding by sheet side',()=>{
 assert.equal(opts.glassSurcharge('UltraClear',6,1).publicHT,80);
 assert.equal(opts.glassSurcharge('UltraClear',8,2).publicHT,300);
 assert.equal(opts.glassSurcharge('UltraClear',10,1).purchaseHT,90);
 assert.equal(opts.glassSurcharge('Master-Soft',6,1).purchaseHT,83);
 assert.equal(opts.glassSurcharge('Miroir',8,2).purchaseHT,416);
 assert.equal(opts.glassSurcharge('Miroir',10,1).verified,false);
 assert.equal(opts.glassSurcharge('Transparent',6,1).publicHT,0);
});
test('Tariff exact reference and matching model variants only, no invented number',()=>{
 const rows=Array.from({length:8500},(_,i)=>({
  s:'MODO XL',u:'BLACK',r:'389414-54-'+String(i+1).padStart(5,'0'),
  e:String(500000+i),d:i===0?'Modo XL Black 30-100 x 200-250':'Other unrelated model '+i,
  t:'STD',p:i===0?870:100,a:i===0?435:50
 }));
 const v=tariff.use({source:'RADAWAY_SHOWROOMS_TARIF 02022026.xlsx',date:'2026-02-02',prices:rows});
 assert.equal(v.rows,8500);
 assert.equal(tariff.exact('389414-54-00001').p,870);
 assert.equal(tariff.variants({designation:'Modo XL Black'}).length,1);
 assert.equal(tariff.variants({designation:'Modo XL Chrome'}).length,0);
});
test('Configurator links price, image, glass thickness and supplier freight to records',()=>{
 const ui=fs.readFileSync(path.join(pub,'radaway-configurator.js'),'utf8');
 const app=fs.readFileSync(path.join(pub,'app.js'),'utf8');
 for(const x of ['radaway-thickness','radaway-profile','radaway-glass','radaway-tariff-variant','radaway-tariff-file'])
  assert.ok(ui.includes(x),x);
 assert.match(ui,/glassSupplementPurchaseHT/);
 assert.match(ui,/purchasePrice:exactPrice/);
 assert.match(ui,/mediaActive<6/);
 assert.match(app,/radawayDeliveryDepartment/);
 assert.match(app,/rec\.radawayConfiguration=chosen\.radawayConfiguration/);
});
