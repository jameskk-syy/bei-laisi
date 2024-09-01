const express = require('express');
const apps = require('./firebase');
const cors = require('cors');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const bodyParser = require('body-parser');

// Initialize your app
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const fireStoreDb = getFirestore(apps);
const fireStoreCollection = collection(fireStoreDb, "Auctions");

app.get('/', (req, res) => {
    res.send('hello world');
});

app.post('/ussd', async (req, res) => {
    let response = "";
    const {
        sessionId,
        phoneNumber,
        serviceCode,
        text
    } = req.body;

    // Split the text input by "*" to parse the user's input at different stages
    const textArray = text.split("*");

    // First request
    if (text == "") {
        response = `CON Welcome to Laisi Reverse Auctions \n\n`;
        response += `Bid on our live auctions:\n`;
        const result = await getAuctions();
        result.forEach((resq, index) => {
            response += `${index + 1}. ${resq.auctionName}\n`;
        });
        response += `\nEnter the number of the auction you want to bid on:`;
    } else {
        // User has selected an auction
        const selectedAuctionIndex = parseInt(textArray[0]) - 1;
        const result = await getAuctions();
        if (selectedAuctionIndex >= 0 && selectedAuctionIndex < result.length) {
            const selectedAuction = result[selectedAuctionIndex];
            response = `CON You selected ${selectedAuction.auctionName}\n`;
            response += `Please enter your bid amount:`;
        } else {
            response = `CON Invalid selection. Please try again.\n`;
        }
    }

    res.set('content-type', 'text/plain');
    res.send(response);
});

async function getAuctions() {
    const data = [];
    const result = await getDocs(fireStoreCollection);
    result.docs.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
    });
    return data;
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening at port ${port}`));
