const mongoose=require('mongoose');
const PoolSchema=new mongoose.Schema({
 name:{type:String,required:true,maxlength:80,trim:true},
 home:{type:String,required:true,maxlength:45},away:{type:String,required:true,maxlength:45},
 price:{type:Number,required:true,min:0,max:100000},
 squares:{type:[{type:String,default:null}],default:()=>Array(100).fill(null),validate:{validator:a=>a.length===100,message:'Exactly 100 squares required'}},
 rows:{type:[Number],default:()=>[0,1,2,3,4,5,6,7,8,9]},
 cols:{type:[Number],default:()=>[0,1,2,3,4,5,6,7,8,9]}
},{timestamps:true});
PoolSchema.set('toJSON',{transform:(_doc,obj)=>{obj.id=obj._id.toString();delete obj._id;delete obj.__v;return obj}});
module.exports=mongoose.model('Pool',PoolSchema);
