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
    const itemsPerPage = 5;

    // Calculate the current page
    const currentPage = textArray.includes("#") ? parseInt(textArray[textArray.length - 2], 10) + 1 : 1;
    const selectedOption = textArray[textArray.length - 1]; // Get the last input from the user

    const result = await getAuctions();
    const totalItems = result.length;

    if (text === "") {
        // Initial menu
        response = `CON Welcome to Laisi Reverse Auctions \n\n`;
        response += listAuctions(result, 1, itemsPerPage);
    } else if (selectedOption === "#") {
        // Next page logic
        response = `CON ${listAuctions(result, currentPage, itemsPerPage)}`;
    } else if (selectedOption === "00") {
        // Go back to main menu
        response = `CON Welcome back to the main menu \n\n`;
        response += listAuctions(result, 1, itemsPerPage);
    } else {
        // User made a selection
        const selectedAuctionIndex = (currentPage - 1) * itemsPerPage + parseInt(selectedOption, 10) - 1;

        if (selectedAuctionIndex >= 0 && selectedAuctionIndex < totalItems) {
            const selectedAuction = result[selectedAuctionIndex];
            response = `CON You selected ${selectedAuction.auctionName}\n`;
            response += `Please enter your bid amount:`;
        } else {
            response = `CON Invalid selection. Please try again.\n`;
            response += listAuctions(result, currentPage, itemsPerPage);
        }
    }

    res.set('content-type', 'text/plain');
    res.send(response);
});

function listAuctions(auctions, page, itemsPerPage) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedAuctions = auctions.slice(start, end);

    let response = "Bid on our live auctions:\n";
    paginatedAuctions.forEach((auction, index) => {
        response += `${index + 1}. ${auction.auctionName}\n`;
    });

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
