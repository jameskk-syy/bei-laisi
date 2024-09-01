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

    const textArray = text.split("*");
    const currentPage = textArray[0] === "" || isNaN(textArray[0]) ? 1 : parseInt(textArray[0], 10);
    const result = await getAuctions();
    const itemsPerPage = 10;

    // Check if the user selects to go back to the main menu
    if (textArray[textArray.length - 1] === "00") {
        response = `CON Welcome back to the main menu \n\n`;
        response += listAuctions(result, 1, itemsPerPage);
    } else if (text === "") {
        response = `CON Welcome to Laisi Reverse Auctions \n\n`;
        response += listAuctions(result, 1, itemsPerPage);
    } else if (textArray.length === 1) {
        if (textArray[0] === "#") {
            response = `CON ${listAuctions(result, currentPage + 1, itemsPerPage)}`;
        } else {
            const selectedAuctionIndex = parseInt(textArray[0], 10) - 1;
            if (selectedAuctionIndex >= 0 && selectedAuctionIndex < result.length) {
                const selectedAuction = result[selectedAuctionIndex];
                response = `CON You selected ${selectedAuction.auctionName}\n`;
                response += `Please enter your bid amount:`;
            } else {
                response = `CON Invalid selection. Please try again.\n`;
            }
        }
    }

    res.set('content-type', 'text/plain');
    res.send(response);
});

function listAuctions(auctions, page, itemsPerPage) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedAuctions = auctions.slice(start, end);

    let response = "CON Bid on our live auctions:\n";
    paginatedAuctions.forEach((auction, index) => {
        response += `${start + index + 1}. ${auction.auctionName}\n`;
    });

    // If there are more items to show, offer the option for the next page
    if (end < auctions.length) {
        response += `\n#. Next page\n`;
    }
    
    response += `\n00. Go back to the main menu\n`;

    return response;
}

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
