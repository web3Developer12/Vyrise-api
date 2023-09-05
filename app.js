const express          = require('express');
const { ethers }       = require('ethers');
const {initializeApp}  = require('firebase/app');
const { getFirestore } = require("firebase/firestore");
const { getAppCheck }  = require("firebase-admin/app-check");

const { collection, doc, setDoc,getDocs,getDoc } = require("firebase/firestore"); 

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

app.get('/fetch',async(req,res)=>{
    const col = collection(db, 'users');
    const snapshot = await getDocs(col);
    const data = snapshot.docs.map(doc => doc.data());
    res.json({users:data});
});

app.get('/connect/:address',async(req,res)=>{

  const _address = req.params.address;
  await setDoc(doc(db, "users",_address), { eth:_address,rate:0.00001,allowance:0.00000,timeStamp:0});
  res.json({address:_address,connected:true});

});

app.get('/claim/:address',async(req,res)=>{

    const _address = req.params.address;
    const docRef = doc(db, "users",_address);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      
      const data = docSnap.data();
    
      if (Date.now() - data.timeStamp < 60000) {
        res.json({ status: "delay hasn't been reached out".toUpperCase() });
      } else {
        await setDoc(doc(db, "users", _address), {
          eth: _address,
          rate:data.rate,
          allowance: data.allowance + data.rate,
          timeStamp: Date.now(),
        });
        res.json({ status: 'delay has been reached out'.toUpperCase() });
      }
    } else {
      res.send({ status: 'claimer-null-exist'.toUpperCase() });
    }

});

app.get('/getAllowance/:address',async(req,res)=>{

  const _address = req.params.address;
  const docRef = doc(db, "users",_address);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    res.send({allowance:data.allowance});
    
  } else {
    res.send({ status: 'account-no-exist'.toUpperCase() });
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
