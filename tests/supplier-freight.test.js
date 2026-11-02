'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const freight=require('../public/supplier-freight.js');
const item=(manufacturer,netPurchase,quantity=1)=>({manufacturer,netPurchase,quantity});

test('Supplier carriage applies once per manufacturer per consolidated order',()=>{
 const result=freight.calculate([
  item('Gessi',200),item('Gessi',199.99),
  item('Galassia',150),item('Galassia',150),
  item('Amphora',200),item('Amphora',300)
 ]);
 assert.equal(result.byManufacturer.Gessi.freightHT,30);
 assert.equal(result.byManufacturer.Galassia.freightHT,50);
 assert.equal(result.byManufacturer.Amphora.freightHT,0);
 assert.equal(result.total,80);
});
test('Gessi and Amphora franko thresholds use net supplier purchase value incl quantity',()=>{
 assert.equal(freight.calculate([item('Gessi',400)]).total,0);
 assert.equal(freight.calculate([item('Gessi',199.99,2)]).total,30);
 assert.equal(freight.calculate([item('Amphora',499.99)]).total,50);
 assert.equal(freight.calculate([item('Amphora',250,2)]).total,0);
 assert.equal(freight.calculate([]).total,0);
});
test('Naxani shipping stays unpriced while supplier memo contradicts itself',()=>{
 const result=freight.calculate([item('Naxani',450)]);
 assert.equal(result.total,0);
 assert.equal(result.naxaniFreightPending,true);
 assert.match(result.naxaniWarning,/contradictoire/);
});
test('Dornbracht uses sequential 45% + 10% supplier discount throughout financial UI',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'../public/dornbracht-configurator.js'),'utf8');
 assert.match(app,/"Dornbracht":50\.5/);
 assert.match(app,/supplierDiscountMigrationV20261102Dornbracht/);
 assert.match(app,/function negotiatedSupplierFreight\(\)/);
 assert.match(ui,/purchaseDiscount:50\.5/);
 assert.match(ui,/sum\*\.495/);
 assert.match(app,/negotiatedSupplierShipping/);
});
