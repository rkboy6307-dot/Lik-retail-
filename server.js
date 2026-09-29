const express=require("express"),path=require("path"),fs=require("fs");
const app=express(),PORT=process.env.PORT||3000,dir=path.join(__dirname,"data"),file=path.join(dir,"store.json");
app.use(express.json());app.use(express.static(path.join(__dirname,"public")));
const seed=()=>({shop:{name:"My Retail Store",owner:"",phone:"",address:""},products:[{id:1,name:"Sample Product",price:99,stock:25,category:"General"}],orders:[]});
function load(){try{return fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):seed()}catch{return seed()}}
let db=load();function save(){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file,JSON.stringify(db,null,2))}save();
app.get("/api/health",(q,s)=>s.json({ok:true,app:"RetailAI",version:"1.0.0"}));
app.get("/api/products",(q,s)=>s.json(db.products));
app.post("/api/products",(q,s)=>{let{x,price,stock,category}=q.body,name=q.body.name;if(!name||Number(price)<0||Number(stock)<0)return s.status(400).json({error:"Valid name, price and stock required"});let p={id:Date.now(),name:String(name).trim(),price:Number(price),stock:Number(stock),category:category||"General"};db.products.push(p);save();s.status(201).json(p)});
app.delete("/api/products/:id",(q,s)=>{let n=db.products.length;db.products=db.products.filter(p=>p.id!==Number(q.params.id));if(n===db.products.length)return s.status(404).json({error:"Not found"});save();s.json({ok:true})});
app.get("/api/orders",(q,s)=>s.json([...db.orders].reverse()));
app.post("/api/orders",(q,s)=>{let{customerName,phone,items}=q.body;if(!customerName||!items?.length)return s.status(400).json({error:"Customer and items required"});let total=0,oi=[];for(let i of items){let p=db.products.find(x=>x.id===Number(i.productId)),qty=Number(i.qty);if(!p||qty<1||p.stock<qty)return s.status(400).json({error:"Invalid stock"});total+=p.price*qty;oi.push({productId:p.id,name:p.name,price:p.price,qty})}oi.forEach(i=>db.products.find(p=>p.id===i.productId).stock-=i.qty);let o={id:Date.now(),customerName,phone:phone||"",items:oi,total,status:"New",createdAt:new Date().toISOString()};db.orders.push(o);save();s.status(201).json(o)});
app.patch("/api/orders/:id",(q,s)=>{let o=db.orders.find(x=>x.id===Number(q.params.id));if(!o)return s.status(404).json({error:"Not found"});o.status=q.body.status;save();s.json(o)});
app.get("*",(q,s)=>s.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("RetailAI running on "+PORT));