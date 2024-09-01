const express = require('express');
const apps = require('./firebase');
const cors = require('cors');
const {getFirestore,collection,getDocs} = require('firebase/firestore');
const bodyParser = require('body-parser');


//initialize your app
const app = express();
app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}));

const fireStoreDb = getFirestore(apps);
const fireStoreCollection =  collection(fireStoreDb,"Auctions");

app.post('/ussd',async(req,res)=>{
 let response = "";
 const {
  sessionId,
  phoneNumber,
  serviceCode,
  text
 } = req.body;

 //first request
 if(text == ""){

  response = `CON Welcome Bid Laisi Reverse Auctions \n\n`;
  response += `Bid on our live auctions\n`;
  const result  = await getAuctions();
  result.forEach((resq,index)=>{
    response += `${index+1}. ${resq.auctionName}`
  });
 }
 res.set('content-type:text/plain');
 res.send(response);
});

async function getAuctions(){
 const data = [];
 const result  = await getDocs(fireStoreCollection);
 result.docs.forEach((doc)=>{
 data.push({...doc.data(),id:doc.id});
 })
 return data;
}
const port = process.env.PORT || 3000;
app.listen(port,()=> console.log(`Listening at port ${port}`))
