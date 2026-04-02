require('dotenv').config()

const path=require('path')
const express=require("express");
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const app=express();
const PORT=process.env.PORT||4000;
const bcrypt=require('bcrypt');
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

const User=mongoose.model("User",userschema)

app.use(express.json())
app.use(express.urlencoded({extended:true}));

mongoose.connect(process.env.MONGODB_URL)
.then(()=>{console.log("Mongodb connected"),app.listen(PORT,()=>{console.log(`Listening for requests at PORT:${PORT}`)})})
.catch(err=>console.error('Mongodb url:',err))


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
token=jwt.sign({username},ADMIN_SECERT)
}
else{
  token=jwt.sign({username},JWT_SECERT)  
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
    token=jwt.sign({username},ADMIN_SECERT)
}
else {
    token=jwt.sign({username},JWT_SECERT);
}

res.json({message:`Welcome back! ${username}`,token})
} catch (err) {
    console.error(err)
}
})

// bcrypt.hash("olawale", 10, (err,hash)=>{
//     console.log(hash)
// })

// bcrypt.compare("olawale",'$2b$10$lnbs6tSQnYnyfi6i5vVXaO1FflEyk1cLqFhhLfvPXiIPvAwdd5KNi',(err,result)=>{
//     console.log(result)
// })