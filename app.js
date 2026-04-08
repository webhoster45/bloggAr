require('dotenv').config()

const path=require('path')
const express=require("express");
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const app=express();
const PORT=process.env.PORT||4000;
const bcrypt=require('bcrypt');
const { verify } = require('crypto');
const { type } = require('os');
const Schema=mongoose.Schema;
const ADMIN_SECERT=process.env.ADMIN_SECERT;
const JWT_SECERT=process.env.JWT_SECERT;

const userschema=new Schema({
    username:{type: String, required: true , Unique: true},
    password:{type: String, required: true},
    noblogs: {type: Number},
    role: {type: String, required: true},
    isAdmin: {type: Boolean, default: false}
},{timestamps:true})


const postschema=new Schema({
    authorid:{type:String, required : true},
    post:{type: String, required: true },
    by:{type:String , required : true},
    likes:{ type : String , default:0}
},{timestamps:true})

const User=mongoose.model("User",userschema);
const Post=mongoose.model("Post",postschema)

app.use(express.json())
app.use(express.urlencoded({extended:true}));

mongoose.connect(process.env.MONGODB_URL)
.then(()=>{console.log("Mongodb connected"),app.listen(PORT,()=>{console.log(`Listening for requests at PORT:${PORT}`)})})
.catch(err=>console.error('Mongodb url:',err))

function authmiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECERT, (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.user = decoded;
    console.log(decoded)
    console.log("------------------------------------------------")
    next();
  });
}


app.post('/register',async (req,res)=>{
try {
    const {username, password, adminsecret,role}=req.body;

const validatename=username.trim().toLowerCase();

if(!validatename || !password){
    return res.status(400).json({message:"All params must be valid"})
}

const existinguser=await User.findOne({username:validatename});


if(existinguser){
    return res.status(400).json({message:"Username already been used"})
}

let isAdmin=false;

if(adminsecret){
    const existingadmin=await User.findOne({isAdmin:true})
    if(adminsecret!=ADMIN_SECERT){
        return res.status(403).json({message:"invalid admin secret"})
    }

    if(existingadmin){
        return res.status(403).json({message:"Admin already exists"})
    }

    isAdmin=true;
}

const encryptedpassword=await bcrypt.hash(password,10)

await User.create({username:validatename,password:encryptedpassword,role:role,isAdmin});
let token;
if(isAdmin){
token=jwt.sign({id:await User.findOne(validatename)._id,username:validatename},ADMIN_SECERT)
}
else{
  token=jwt.sign( {id:await User.findOne(validatename)._id,username:validatename},JWT_SECERT)  
}

res.json({message:isAdmin? "Admin created Successfully" : " User Created Successfully",token})
} catch (error) {
    console.log(error)
}
})

app.post('/login',async (req,res)=>{
try {
    const {username,password}=req.body;
const validatename=username.trim().toLowerCase();

const user=await User.findOne({username:validatename});

if(!validatename || !password){
    return res.status(400).json({message:"All params must be valid"})
}

if(!user) return res.status(400).json({message:"User doesn't exist"});

const compare=await bcrypt.compare(password,user.password);
if(!compare) res.status(400).json({message:"Invalid credientials"});

let token;
if(user.isAdmin) {
    token=jwt.sign({id:user._id,username:user.username},ADMIN_SECERT)
}
else {
    token=jwt.sign({id:user._id,username:user.username},JWT_SECERT);
}

res.json({message:`Welcome back! ${username}`,token})
} catch (err) {
    console.error(err)
}
})

//------------------------------UNTESTED ROUTES----------------------------------


app.get('/posts',authmiddleware,async (req,res)=>{
try{
const posts=await Post.find();
// posts.foreach(post=>{

//     const each={
//     authorname:post.authorname,
//     post:post.post,
//     likes:post.likes,
//     iat:post.iat
// }
// allposts.push(each)

// })


res.json({posts})
res.status(500).json({message:"error"})
}
catch(err){
    console.log(err)
}


})

app.post('/author/create',authmiddleware,async (req,res)=>{
 try {
  const {content}=req.body
  console.log(req.user)
  const user=await User.findById(req.user.id);
//   console.log(user)
  console.log(user)
  if(user.role =="Author"){ 
    await Post.create({authorid:req.user.id,post:content,by:req.user.username})
    return res.status(201).json({message:"Post created successfully"})
  }
//   else if(user.isAdmin){
//     await Post.create({authorid:req.user.id,post:content,by:req.user.username})
//     return res.status(201).json({message:"Post created successfully"})
// }
else{
    console.log(user.role); res.status(400).json({message:"Only Authors & Admin can create posts"})

}
    } catch (err) {
        console.error(err)
        return res.status(500).send("Error")
    }
})

app.post("/posts/:authorid",authmiddleware,async (req,res)=>{
try{
const id=req.params.id;
const post= await Post.findById({id});
res.json({post})
}catch(err){
    console.error(err)
}
})

app.post("/comment/:id",authmiddleware,async (req,res)=>{
try {
    const postid=req.params.id;
    
} catch (error) {
    console.error(err)
}
})


// bcrypt.hash("olawale", 10, (err,hash)=>{
//     console.log(hash)
// })

// bcrypt.compare("olawale",'$2b$10$lnbs6tSQnYnyfi6i5vVXaO1FflEyk1cLqFhhLfvPXiIPvAwdd5KNi',(err,result)=>{
//     console.log(result)
// })