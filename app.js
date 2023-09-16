const express          = require('express');
const { ethers }       = require('ethers');
const {initializeApp}  = require('firebase/app');
const { getFirestore } = require("firebase/firestore");

const { collection, doc, setDoc,getDocs,getDoc} = require("firebase/firestore"); 

const firebaseConfig = {
  apiKey: "AIzaSyBJMp0j3eOTA1peg1AmH4mVD-MWbthhyPs",
  authDomain: "vyrise-e3f93.firebaseapp.com",
  projectId: "vyrise-e3f93",
  storageBucket: "vyrise-e3f93.appspot.com",
  messagingSenderId: "636393356384",
  appId: "1:636393356384:web:5d69f222092b93d9459705",
  measurementId: "G-EEDWWPGX8N"
};

const instance = initializeApp(firebaseConfig);
const db       = getFirestore(instance);

const app = express();
const port = process.env.PORT || 3000;

const appCheckVerification = async (req, res, next) => {
  const appCheckToken = req.header("X-Firebase-AppCheck");

  if (!appCheckToken) {
      res.status(401);
      return next("Unauthorized");
  }

  try {
      const appCheckClaims = await getAppCheck().verifyToken(appCheckToken);
      return next();
  } catch (err) {
      res.status(401);
      return next("Unauthorized");
  }
}

app.get('/fetch',[appCheckVerification],async(req,res)=>{
    const col = collection(db, 'users');
    const snapshot = await getDocs(col);
    const data = snapshot.docs.map(doc => doc.data());
    res.json({users:data});
});

app.get('/connect/:address/:refCode',[appCheckVerification],async(req,res)=>{

  const address = req.params.address;
  const refCode = req.params.refCode;

  const docRef = doc(db, "refferals","main");
  const docRefferal = await getDoc(docRef);

  if(docRefferal.exists()){

    if(docRefferal.data().AllowedToBeInTeam.includes(refCode)){
      res.json({address:address,connected:false});
      return;
    }

    await setDoc(doc(db, "refferals","main"), {
        AllowedToBeInTeam:[...docRefferal.data().AllowedToBeInTeam,refCode]
     });

     await setDoc(doc(db, "users",address), { 
      eth:address,
      rate:1000000000,
      allowance:0,
      timeStamp:Date.now(),
      gainHistory:[],
      withdrawHistory:[],
      team:[],
      lastTimeBackup:0,
      refferalId:refCode
    });
    
    res.json({status:"CONNECTED"});

  }else{
    res.json({status:"NOT CONNECTED"});
  }

});

app.get('/backup/:address/:_rate/:_allowance/:_gainHistory/:_withdrawHistory/:_team',[appCheckVerification],async(req,res)=>{


  const docRef = doc(db, "users",req.params.address);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {

    const { eth,rate,refferalId } = docSnap.data();

    await setDoc(doc(db, "users",req.params.address), { 
      eth:eth,
      rate:rate,
      allowance:req.params._allowance,
      timeStamp:Date.now(),
      gainHistory:req.params._gainHistory,
      withdrawHistory:req.params._withdrawHistory,
      team:req.params._team,
      lastTimeBackup:Date.now(),
      refferalId:refferalId
    });
    res.send({status:"BACKUP_DONE"});
  }else{
    res.send({status:"BACKUP_FAILED"});
  }

});

app.get('/getBalance/:address',[appCheckVerification],async (req, res) => {
  try {
    const address = req.params.address;
    const provider = await new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
    const balance = await provider.getBalance(address);
    const etherBalance = ethers.utils.formatEther(balance);

    res.json({ address, balance: etherBalance });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the balance.'.toUpperCase() });
  }
});

app.get('/addReference/:address/:refcodeMember',[appCheckVerification],async (req, res) => {
  try {
    const docRef_1 = doc(db, "users",req.params.address);
    const docUser = await getDoc(docRef_1);

    if(!docUser.exists()){
      res.json({status:"USER NOT IN RECORDS"});
      return;
    }else{
      const userRefCode = docUser.data().refferalId;
      if(userRefCode == req.params.refcodeMember){
        res.json({status:"CANNOT REFERENCE YOURSELF"});
        return;
      }
    }
    const docRef_2 = doc(db, "refferals","main");
    const docRefferal = await getDoc(docRef_2);
    const allowedTobeInTeamList = docRefferal.data().AllowedToBeInTeam;
    const membersAlreadyInTeamList = docRefferal.data().MembersAlreadyTaken;
    
    if(allowedTobeInTeamList.includes(req.params.refcodeMember) && membersAlreadyInTeamList.includes(req.params.refcodeMember) == false){

      await setDoc(doc(db, "refferals","main"), {
        AllowedToBeInTeam  :allowedTobeInTeamList,
        MembersAlreadyTaken:[...membersAlreadyInTeamList,req.params.refcodeMember]
      });
      res.json({status:"REFERENCE ADDED SUCCESSFULLY"});

    }else if(allowedTobeInTeamList.includes(req.params.refcodeMember) && membersAlreadyInTeamList.includes(req.params.refcodeMember)){
      res.json({status:"REFERENCE ALREADY TAKEN"});
    }
    else if(allowedTobeInTeamList.includes(req.params.refcodeMember) == false){
      res.json({status:"REFERENCE CODE DOESN'T EXIST"});
    }

  } catch (error) {
    res.status(500).json({ error: error });
  }
});


app.listen(port, () => {
  console.log(`SERVER RUNNING ON PORT ${port}`);
});
