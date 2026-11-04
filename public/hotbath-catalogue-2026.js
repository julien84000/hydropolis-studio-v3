/* Indexed against the supplied Hotbath Catalogue 2026, 205-page PDF.
 * PDF pages are 1-based physical page numbers (cover = page 1).
 * Source PDF is hosted by the manufacturer; commercial prices remain sourced
 * solely from catalog_hotbath.json (2026-07-07 tariff).
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HydroHotbathCatalogue2026=api;})(typeof window==='object'?window:null,function(){
'use strict';
const PAGE_BY_MODEL=Object.freeze({"GT003":9,"GT003H":9,"GT004":9,"GT003M":9,"GT023":10,"GT033":10,"GT023H":10,"GT018":10,"GT105":11,"GT131":11,"GT129":11,"GT105T":11,"GT111":12,"GT073":12,"GT095-20":12,"GT075":12,"GT187":13,"SDS33":13,"GT7066":14,"GT7009":14,"GT7067":14,"GT7070":14,"GT7071":15,"GT7072":15,"AR318":16,"AR306":16,"AR440":16,"AR514":17,"AR354":17,"AR515":17,"AR015":17,"AR517":17,"AR450":17,"AR500":17,"AR452":18,"AR100":18,"AR106":18,"AR453":18,"AR454":18,"AR198":18,"AR199":18,"AR470":19,"AR110":19,"AR471":19,"AR111":19,"AR472":19,"AR142":19,"AR193":20,"AR160":20,"AR710":21,"AR132":21,"AR035":21,"AR133":21,"AR2002":21,"MIR90":26,"MIR90T":27,"MIR100":28,"MIR120":28,"MIR100T":28,"MIR120T":28,"AR003":31,"AR003H":31,"AR014":31,"AR003M":31,"AR023":32,"AR078W":32,"AR033":32,"AR124":33,"AR131":33,"AR018":33,"AR129":33,"AR096":34,"AR183":34,"AR096-15":34,"AR096-20":34,"AR185":34,"AR096-25":34,"AR096-30":34,"AR187":35,"AR086":35,"AR7066":36,"AR7067":36,"AR7009":37,"AR7171":37,"AR7070":37,"AR7172":37,"AR088":38,"AR320":39,"AR443":40,"AR190":47,"AR091":47,"M317":59,"M354":60,"M318":60,"M355":60,"M015":61,"M445":61,"M017":61,"M446":61,"M514":62,"M100":62,"M515":62,"M105":62,"M517":62,"M106":62,"CB450":63,"M470":63,"CB452":63,"M471":63,"CB453":63,"M472":63,"C104":72,"C105T":72,"C133":72,"C173":73,"C175":73,"C7009":74,"C7066":74,"C7070":74,"C7067":74,"C7071":75,"C7072":75,"M311":76,"AC003":83,"AC004":83,"AC003H":83,"AC018":83,"AC023":84,"AC105":84,"AC023H":84,"AC131":85,"AC129":85,"AC111":85,"AC177":86,"AC073":86,"AC075":86,"AC009":87,"AC071":87,"AC039":87,"AC072":88,"M305":89,"M274":89,"M306":89,"AC440":90,"AC450":90,"AC452":90,"AC443":90,"AC453":90,"AC106":91,"AC193":91,"AC104":91,"AC195":91,"AC370":92,"M376":92,"AC514":93,"M161":93,"M162":93,"AC515":93,"M111":93,"AC517":93,"AC148":94,"AC146":94,"AC040":96,"AC042":96,"GL003":99,"GL004":99,"GL003H":99,"GL005":99,"GL002":100,"GL031":100,"GL018":100,"GL009":100,"GL177":101,"GL073":101,"GL075":101,"GL008":102,"GL020":102,"GL7066":103,"GL7067":103,"GL7071":104,"GL7072":104,"GL307":105,"GL440":105,"GL309":106,"GL311":106,"GL515":107,"GL517":107,"GL450":107,"GL350":107,"GL452":107,"GL100":108,"GL106":108,"M147":108,"CB003C":115,"CB003S":115,"CB004":116,"CB178W":116,"CB023":117,"CB033":117,"CB023H":117,"CB018":117,"CB105-18":118,"CB105-25":118,"CB105T":119,"CB095":119,"CB095-15":119,"CB095-18":119,"CB095-22":119,"CB095-25":119,"CB095-30":119,"CB131":120,"CB010H":120,"CB111":120,"CB010C":120,"CB129":121,"CB127":121,"CB187":122,"CB176":122,"CB173":123,"CB175":123,"CB007":125,"CB009":125,"CB7001H":126,"CB7080":126,"CB7001V":126,"CB7083":126,"CB7068":127,"CB7069":127,"CB7098":128,"CB7066":128,"CB7502":128,"CB7067":128,"CB7009":129,"CB7171":129,"CB7070":129,"CB7172":130,"M537":131,"M538":132,"M319":133,"M321":133,"M447":135,"M448":136,"CB040":140,"CB041":140,"CX003C":149,"CX004":149,"CX105-18":150,"CX023":150,"CX105-25":150,"CX023H":150,"CX018":151,"CX111":151,"CX131":151,"CX127":151,"CX187":152,"CX008":152,"CX020":152,"CX7009":154,"CX7066":154,"CX7070":154,"CX7067":154,"CX7171":155,"CX7172":155,"CX040":156,"CX041":156,"M183":172,"M193":172,"M150":173,"M108":173,"M110":173,"M194":173,"M143":174,"M142":174,"M145":174,"M148":175,"M146":175,"M190":176,"M173":176,"M010":177,"M020":177,"M352":178,"AR352":178,"M360":179,"M353":179,"M378":179,"M179":183,"M135":183,"M177":183,"M122":183,"M130":183,"M123":183});
const PDF='https://service.hotbath.it/documents/WOCateg/160/Hotbath_catalogue_2026.pdf';
const REPRODUCTION='https://pdf.archiexpo.com/pdf/hotbath/general-catalog-2026/159470-463917.html';
const PAGE_IMAGE='https://img.archiexpo.com/pdf/repository_ae/159470/general-catalog-2026-463917_';
const clean=s=>String(s||'').toUpperCase().trim().replace(/\.(?:IT|FR|EN)$/,'').replace(/(?:EXT(?:\..*)?)$/,'');
function pageFor(row){
 const base=clean(typeof row==='string'?row:row?.base||row?.reference);
 if(PAGE_BY_MODEL[base])return PAGE_BY_MODEL[base];
 // The manufacturer prints some 2-variant mixer stems with e.g. CB105-18.
 // Re-use their technical drawing for a priced model only if the family
 // stem is unambiguous.
 if(/^CB105/.test(base)&&PAGE_BY_MODEL['CB105-18'])return PAGE_BY_MODEL[base.includes('25')?'CB105-25':'CB105-18'];
 if(/^CX105/.test(base)&&PAGE_BY_MODEL['CX105-18'])return PAGE_BY_MODEL[base.includes('25')?'CX105-25':'CX105-18'];
 return null;
}
function entry(row){
 const page=pageFor(row);return page?{
  page,url:PDF+'#page='+page,source:'Hotbath Catalogue 2026',kind:'catalogue-dimensioned-drawing',
  preview:PAGE_IMAGE+page+'m.jpg',reproduction:REPRODUCTION
 }:null;
}
function apply(rows){
 let count=0;
 for(const row of rows||[]){
  if(row?.manufacturer!=='Hotbath')continue;
  const source=entry(row);if(!source)continue;
  row.catalogue2026Page=source.page;
  row.catalogue2026Url=source.url;
  if(!row.technicalSheetUrl){
   row.technicalSheetUrl=source.url;
   row.technicalSheetLabel='Plan coté · catalogue Hotbath 2026 p. '+source.page;
   row.technicalSheetType='pdf';
   row.technicalSheetSource='catalogue-2026';
  }
  count++;
 }
 return count;
}
return {PDF,REPRODUCTION,PAGE_IMAGE,PAGE_BY_MODEL,clean,pageFor,entry,apply};
});