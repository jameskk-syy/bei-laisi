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
    const { sessionId, phoneNumber, serviceCode, text } = req.body;

    const textArray = text.split("*");
    const result = await getAuctions();

    if (text === "") {
        // Initial welcome message and first page of auctions
        response = `CON Welcome to Laisi Reverse Auctions \n\n`;
        response += `Bid on our live auctions:\n`;
        result.forEach((resu, index) => {
            response += `${index + 1}. ${resu.auctionName}\n`;
        });
    } else if (textArray.length === 1) {
        const input = textArray[0];
        const selectedOption = parseInt(input);
        const selectedAuctionIndex = selectedOption - 1;

        if (selectedAuctionIndex >= 0 && selectedAuctionIndex < result.length) {
            const selectedAuction = result[selectedAuctionIndex];
            response = `CON place your bid on ${selectedAuction.auctionName} .\n`;
            response += `1 Bid = UGX ${selectedAuction.price}. \n\n`;
            response += `Enter unique Bid Price from UGX ${selectedAuction.price} and above.`;
        } else {
            response = `END Invalid selection. Please try again.\n`;
        }
    } else if (textArray.length === 2) {
        // Handle bid amount input
        const selectedOption = parseInt(textArray[0]);
        const selectedAuctionIndex = selectedOption - 1;

        if (selectedAuctionIndex >= 0 && selectedAuctionIndex < result.length) {
            const bidAmount = parseFloat(textArray[1]);

            if (isNaN(bidAmount) || bidAmount <= 0) {
                response = `END Invalid bid amount. Please try again.\n`;
            } else {
                const selectedAuction = result[selectedAuctionIndex];
                response = `CON choose payment method 
                1 Airtel Money
                2 MOMO`;
                // Here, you can add the logic to save the bid amount to the database.
            }
        }
        else if(textArray.length == 3){
           
        } else {
            response = `END Invalid selection. Please try again.\n`;
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
