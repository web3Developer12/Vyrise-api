const express          = require('express');
const { ethers }       = require('ethers');
const {initializeApp}  = require('firebase/app');
const { getFirestore } = require("firebase/firestore");

const { collection, doc, setDoc,getDocs} = require("firebase/firestore"); 

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


app.get('/fetch',async(req,res)=>{
    const col = collection(db, 'users');
    const snapshot = await getDocs(col);
    const data = snapshot.docs.map(doc => doc.data());
    res.json({users:data});
});

app.get('/connect/:address/:refCode',async(req,res)=>{

  const address = req.params.address;
  const refCode = req.params.refCode;
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
  res.json({address:address,connected:true});

});

app.get('/backup/:address',async(req,res)=>{


  const docRef = doc(db, "users",req.params.address);
  const docSnap = await getDoc(docRef);

  const { address, allowance, rate,gainHistory,withdrawHistory,team,refferalId } = docSnap.data;

  if (docSnap.exists()) {
    await setDoc(doc(db, "users",_address), { 
      eth:address,
      rate:rate,
      allowance:allowance,
      timeStamp:Date.now(),
      gainHistory:gainHistory,
      withdrawHistory:withdrawHistory,
      team:team,
      lastTimeBackup:Date.now(),
      refferalId:refferalId
    });
  }else{
    res.send({status:"BACKUP_FAILED"});
  }

});

app.get('/getBalance/:address',async (req, res) => {
  try {
    const address = req.params.address;
    const provider = await new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
    const balance = await provider.getBalance(address);
    const etherBalance = ethers.utils.formatEther(balance);

    res.json({ address, balance: etherBalance });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the balance.' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
