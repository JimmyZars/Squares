const router=require('express').Router();
const mongoose=require('mongoose');const Pool=require('../models/Pool');
const validId=id=>mongoose.isValidObjectId(id);
const { requireAuth } = require('../auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const isMember = (p,id) => String(p.owner)===String(id) || (p.members||[]).some(m=>String(m)===String(id));
// Labels are unique within each pool. The first matching initials get 2 letters;
// later matching users get 4 letters, with a numeric suffix if needed.
const letters = value => String(value || '').normalize('NFKD').replace(/[^A-Za-z]/g, '').toUpperCase();
function initials(user, pool) {
 const first = letters(user.firstName) || letters(user.email.split('@')[0]) || 'U';
 const last = letters(user.lastName) || 'X';
 const existing = new Set((pool.memberLabels || []).map(item => item.label));
 const short = first[0] + last[0];
 if (!existing.has(short)) return short;
 const long = first.slice(0,2) + last.slice(0,2);
 if (!existing.has(long)) return long;
 let n = 2;
 while (existing.has(long + n)) n++;
 return long + n;
}
async function ensureLabel(pool, user) {
 const found = (pool.memberLabels || []).find(item => String(item.user) === String(user._id));
 if (found) return found.label;
 const label = initials(user, pool);
 await Pool.updateOne({_id:pool._id,'memberLabels.user':{$ne:user._id}},{$push:{memberLabels:{user:user._id,label}}});
 return label;
}
const safePool = p => { const obj=p.toObject({virtuals:false}); delete obj.passwordHash; delete obj.__v; obj.id=String(obj._id); delete obj._id; obj.isLocked=Boolean(p.passwordHash); return obj; };

router.get('/',requireAuth,async(req,res,next)=>{try{res.json(await Pool.find({owner:req.userId}).sort({createdAt:-1}).limit(100))}catch(e){next(e)}});
router.get('/search',requireAuth,async(req,res,next)=>{try{
 const q=String(req.query.q||'').trim().slice(0,80);
 if(q.length<2)return res.json([]);
 const escaped=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pools=await Pool.find({name:{$regex:escaped,$options:'i'}}).select('+passwordHash').sort({createdAt:-1}).limit(30);
 res.json(pools.map(p=>({id:String(p._id),name:p.name,home:p.home,away:p.away,isLocked:Boolean(p.passwordHash),joined:isMember(p,req.userId)})));
}catch(e){next(e)}});
router.get('/joined',requireAuth,async(req,res,next)=>{try{res.json(await Pool.find({members:req.userId}).sort({createdAt:-1}).limit(100))}catch(e){next(e)}});
router.post('/',requireAuth,async(req,res,next)=>{try{
 const {name,home,away,price,password}=req.body||{};
 const user=await User.findById(req.userId);if(!user)return res.status(401).json({error:'Session expired'});
 if(password!==undefined && (typeof password!=='string'||(password.length>72||(password.length>0&&password.length<8))))return res.status(400).json({error:'Pool password must be blank or between 8 and 72 characters'});
 if(![name,home,away].every(v=>typeof v==='string'&&v.trim().length>0)||name.length>80||home.length>45||away.length>45||typeof price!=='number'||!Number.isFinite(price)||price<0||price>100000)return res.status(400).json({error:'Invalid pool details'});
 const passwordHash=password?.trim()?await bcrypt.hash(password,12):null;
 const pool=await Pool.create({owner:req.userId,members:[req.userId],memberLabels:[{user:req.userId,label:initials(user,{memberLabels:[]})}],passwordHash,name:name.trim(),home:home.trim(),away:away.trim(),price});res.status(201).json(pool)
}catch(e){next(e)}});
router.post('/:id/join',requireAuth,async(req,res,next)=>{try{
 if(!validId(req.params.id))return res.status(400).json({error:'Invalid ID'});
 const p=await Pool.findById(req.params.id).select('+passwordHash');
 if(!p)return res.status(404).json({error:'Pool not found'});
 if(isMember(p,req.userId)){const user=await User.findById(req.userId);if(user)await ensureLabel(p,user);return res.json({joined:true,id:String(p._id)});}
 if(p.passwordHash){
   const password=req.body?.password;
   if(typeof password!=='string'||!await bcrypt.compare(password,p.passwordHash))return res.status(403).json({error:'Incorrect pool password'});
 }
 const user=await User.findById(req.userId);if(!user)return res.status(401).json({error:'Session expired'});
 await ensureLabel(p,user);
 await Pool.updateOne({_id:p._id},{$addToSet:{members:req.userId}});
 res.json({joined:true,id:String(p._id)});
}catch(e){next(e)}});
router.get('/:id',requireAuth,async(req,res,next)=>{try{if(!validId(req.params.id))return res.status(400).json({error:'Invalid ID'});const p=await Pool.findById(req.params.id).select('+passwordHash');if(!p)return res.status(404).json({error:'Pool not found'});if(!isMember(p,req.userId))return res.status(403).json({error:'Join this pool before viewing its squares'});const user=await User.findById(req.userId);if(user){await ensureLabel(p,user);await p.populate('memberLabels.user','firstName lastName email');}res.json(safePool(p))}catch(e){next(e)}});
router.patch('/:id/squares/:index',requireAuth,async(req,res,next)=>{try{
 const index=Number(req.params.index);
 const user=await User.findById(req.userId);
 if(!user)return res.status(401).json({error:'Please log in again'});
 if(!validId(req.params.id)||!Number.isInteger(index)||index<0||index>=100)return res.status(400).json({error:'Invalid square claim'});
 const p=await Pool.findById(req.params.id);
 if(!p||!isMember(p,req.userId))return res.status(403).json({error:'Join this pool first'});
 const label=await ensureLabel(p,user);
 const field=`squares.${index}`;
 const pool=await Pool.findOneAndUpdate({_id:req.params.id,[field]:null,$or:[{owner:req.userId},{members:req.userId}]},{$set:{[field]:label,[`squareUsers.${index}`]:req.userId}},{new:true,runValidators:true});
 if(!pool)return res.status(409).json({error:'This square has already been claimed, or the pool no longer exists'});
 res.json(pool);
}catch(e){next(e)}});
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
router.post('/:id/shuffle',requireAuth,async(req,res,next)=>{try{if(!validId(req.params.id))return res.status(400).json({error:'Invalid ID'});const p=await Pool.findOneAndUpdate({_id:req.params.id,owner:req.userId},{$set:{rows:shuffle([0,1,2,3,4,5,6,7,8,9]),cols:shuffle([0,1,2,3,4,5,6,7,8,9])}},{new:true});if(!p)return res.status(403).json({error:'Only the pool owner can shuffle numbers'});res.json(p)}catch(e){next(e)}});
module.exports=router;
