const vm=require('node:vm'), fs=require('node:fs'), assert=require('node:assert/strict');
const routes=new Map();const calls=[];let rows=[];let mutation={affectedRows:1};
const app={use(){},listen(){}};for(const method of ['get','post','put','patch','delete'])app[method]=(path,...handlers)=>routes.set(method+':'+path,handlers);
const express=()=>app;express.json=()=>()=>{};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../server.js'),'utf8'),{
 require(name){if(name==='express')return express;if(name==='cors'||name==='express-session')return ()=>()=>{};if(name==='./db')return {execute:async(sql,args)=>{calls.push([sql,args]);assert.equal((sql.match(/\?/g)||[]).length,args.length);return [/^\s*SELECT/.test(sql)?rows:mutation];}};if(name==='bcrypt')return {};return require(name);},
 process:{env:{SESSION_SECRET:'test'}},console,Buffer,
});
async function request(method,path,{body={},params={},query={},user='user-a'}={}){
 const req={body,params,query,session:user?{userId:user}:{}};let status=200;let output;
 const res={status(value){status=value;return this;},json(value){output=value;return this;},send(){return this;}};
 const handlers=routes.get(method+':'+path);assert(handlers);for(let i=0;i<handlers.length;i++){let proceed=false;await handlers[i](req,res,()=>{proceed=true;});if(i<handlers.length-1&&!proceed)break;}
 return {status,output};
}
(async()=>{
 assert.equal((await request('get','/daily-records/:date',{params:{date:'2026-11-04'},user:null})).status,401);
 assert.equal((await request('get','/daily-records/:date',{params:{date:'2026-02-30'}})).status,400);
 const daily={water_ml:8000,water_goal_ml:8000,cardio_minutes:120,cardio_goal_minutes:120,calorie_goal:2300};
 assert.equal((await request('put','/daily-records/:date',{params:{date:'2026-11-05'},body:daily})).status,200);
 assert(calls.at(-1)[1].includes('user-a'));assert.equal(calls.at(-1)[1].length,13);
 for(const bad of [{water_ml:8001},{water_goal_ml:8001},{cardio_minutes:121},{cardio_goal_minutes:121},{calorie_goal:0}])assert.equal((await request('put','/daily-records/:date',{params:{date:'2026-11-05'},body:{...daily,...bad}})).status,400);
 assert.equal((await request('post','/meals',{body:{name:'Arroz',date:'2026-11-05',calories:195}})).status,201);assert.equal(calls.at(-1)[1][4],195);
 assert.equal((await request('post','/meals',{body:{name:'Arroz',date:'2026-11-05',calories:-1}})).status,400);
 await request('get','/meals',{query:{date:'2026-11-05'}});assert.equal(calls.at(-1)[1][0],'user-a');
 await request('delete','/meals/:id',{params:{id:'other-user-meal'}});assert(calls.at(-1)[0].includes('AND user_id = ?'));assert.equal(calls.at(-1)[1][1],'user-a');
 mutation={affectedRows:0};assert.equal((await request('delete','/meals/:id',{params:{id:'missing'}})).status,404);
 console.log('PASS: autenticação, datas inválidas, limites 8000ml/120min, metas, calorias, placeholders SQL e filtro de proprietário. Pool simulado; MySQL real não disponível.');
})();
