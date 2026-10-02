from pathlib import Path

p=Path('public/app.js')
s=p.read_text(encoding='utf-8')

if 'function exportExcel(){' not in s:
    marker='function exportJson(){let blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="hydropolis-projet.json";a.click();}\n'
    if marker not in s:
        raise SystemExit('exportJson marker not found')
    block=r'''function toast(msg){const old=$(".export-toast");if(old)old.remove();const el=document.createElement("div");el.className="export-toast";el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2400)}
function downloadBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function exportExcel(){
  const xmlEsc=v=>String(v??"").replace(/[&<>]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[ch]));
  const rows=quoteRows().map(row=>{
    const product=row.manual?null:((Number.isInteger(row.sourceIndex)?(state.selected||[])[row.sourceIndex]:null) || (state.selected||[]).find(p=>p.manufacturer===row.manufacturer&&p.reference===row.reference&&String(p.finish||"")===String(row.finish||"")));
    const purchaseUnit=product?purchaseCostFor(product):"";
    const totalNet=Number(row.netUnit||0)*Number(row.qty||1);
    const totalPurchase=product?Number(purchaseUnit||0)*Number(row.qty||1):"";
    const margin=product?totalNet-Number(totalPurchase||0):"";
    const avail=product?availabilityInfo(product).label:"";
    return [row.room,row.manufacturer,row.reference,row.designation,row.finish,row.qty,Number(row.unit||0),Number(row.discount||0),Number(row.netUnit||0),totalNet,purchaseUnit,totalPurchase,margin,row.leadTime,avail,product?.source||""];
  });
  const headers=["Pièce","Fabricant","Référence","Désignation","Finition","Qté","Prix public unitaire HT","Remise client %","Prix net unitaire HT","Total vente HT","Coût achat unitaire HT","Coût achat total HT","Marge brute ligne HT","Délai","Disponibilité","Source"];
  const numeric=new Set([5,6,7,8,9,10,11,12]);
  const cell=(v,num=false)=>`<Cell><Data ss:Type="${num&&v!==""?"Number":"String"}">${xmlEsc(v)}</Data></Cell>`;
  const body=[headers,...rows].map((r,i)=>`<Row>${r.map((v,j)=>cell(v,i>0&&numeric.has(j))).join("")}</Row>`).join("");
  const f=projectFinancials();
  const summary=[["Synthèse","Valeur"],["Tarif public produits HT",f.list],["Port fournisseur HT",f.supplierShipping],["dont port Recor automatique HT",f.recorSupplierShipping],["Vente HT",f.net],["Coût achat HT",f.purchase],["Marge brute produits HT",f.margin],["Taux de marque %",f.marginOnSales],["TVA %",f.vatRate],["Total TTC",f.ttc]];
  const summaryXml=summary.map((r,i)=>`<Row>${r.map((v,j)=>cell(v,i>0&&j===1)).join("")}</Row>`).join("");
  const xml=`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sélection"><Table>${body}</Table></Worksheet><Worksheet ss:Name="Synthèse"><Table>${summaryXml}</Table></Worksheet></Workbook>`;
  downloadBlob(new Blob([xml],{type:"application/vnd.ms-excel;charset=utf-8"}),`Hydropolis_${(state.project.name||"Projet").replace(/[^a-z0-9_-]+/gi,"_")}.xls`);toast("Export Excel enrichi généré");
}
'''.replace('\\"','"')
    s=s.replace(marker,marker+block,1)

# Moodboard is outside V11.57 scope. Its absence must never break application startup.
s=s.replace('$("#exportMoodboardTopBtn").onclick=()=>exportMoodboard().catch(e=>alert("Moodboard impossible : "+e.message));','if($("#exportMoodboardTopBtn") && typeof exportMoodboard==="function")$("#exportMoodboardTopBtn").onclick=()=>exportMoodboard().catch(e=>alert("Moodboard impossible : "+e.message));',1)
s=s.replace('if($("#exportsMoodboardBtn"))$("#exportsMoodboardBtn").onclick=()=>exportMoodboard().catch(e=>alert("Moodboard impossible : "+e.message));','if($("#exportsMoodboardBtn") && typeof exportMoodboard==="function")$("#exportsMoodboardBtn").onclick=()=>exportMoodboard().catch(e=>alert("Moodboard impossible : "+e.message));',1)

p.write_text(s,encoding='utf-8')

t=Path('tests/v11.57-regression.test.js')
ts=t.read_text(encoding='utf-8')
if "Excel export remains defined and uses the structured quote rows" not in ts:
    ts += r'''

test('Excel export remains defined and uses the structured quote rows',()=>{
  assert.match(appSource,/function exportExcel\(\)\{/,'Excel export function must exist');
  assert.match(appSource,/const rows=quoteRows\(\)\.map/,'Excel export must derive from the same quote rows');
  assert.match(appSource,/"Marge brute ligne HT"/,'Excel costing columns must be preserved');
  assert.match(appSource,/function downloadBlob\(/,'Excel download helper must exist');
});
'''
t.write_text(ts,encoding='utf-8')
