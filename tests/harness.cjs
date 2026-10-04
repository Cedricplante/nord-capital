const {JSDOM}=require('jsdom');const fs=require('fs');
function load(repo=require('path').join(__dirname,'..')){
  let html=fs.readFileSync(repo+'/index.html','utf8').replace(/<script[^>]*src=[^>]*><\/script>/g,'');
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://nord-capital.vercel.app/'});
  const w=dom.window;
  w.__alerts=[];w.addEventListener('error',e=>{console.error('SCRIPT ERROR',e.message);});w.alert=m=>w.__alerts.push(String(m));w.confirm=()=>true;
  w.fetch=async()=>({ok:true,json:async()=>({}),text:async()=>''});
  function FakeChart(){this.data={labels:[],datasets:[{data:[]}]};this.options={plugins:{}};}
  FakeChart.prototype.update=function(){};FakeChart.prototype.destroy=function(){};FakeChart.register=()=>{};FakeChart.defaults={plugins:{},font:{},color:''};
  w.Chart=FakeChart;
  w.HTMLCanvasElement.prototype.getContext=()=>({});
  const sc=w.document.createElement('script');sc.textContent=fs.readFileSync(repo+'/app.js','utf8');w.document.body.appendChild(sc);
  if(fs.existsSync(repo+'/pro.js')){const sp=w.document.createElement('script');sp.textContent=fs.readFileSync(repo+'/pro.js','utf8');w.document.body.appendChild(sp);}
  if(w.__loadErr)throw w.__loadErr;
  w.eval(`accountCurrency='CAD';fxRate=1.35;chartsInitialized=false;`);
  return w;
}
module.exports={load};
