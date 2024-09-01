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
    const itemsPerPage = 5;  // Number of items per page
    let currentPage = 1;

    // Determine the current page based on user input
    if (textArray.length > 1) {
        const lastInput = textArray[textArray.length - 1];
        if (lastInput === "#") {
            currentPage = parseInt(textArray[textArray.length - 2], 10) + 1;
        } else {
            currentPage = parseInt(textArray[0], 10);
        }
    }

    if (text === "") {
        // Initial welcome message and first page of auctions
        response = `CON Welcome to Laisi Reverse Auctions \n\n`;
        response += listAuctions(result, 1, itemsPerPage);
    } else if (textArray.length === 1 && textArray[0] === "#") {
        // Move to the next page
        response = `CON ${listAuctions(result, currentPage, itemsPerPage)}`;
    } else if (textArray.length === 1) {
        const input = textArray[0];
        const selectedOption = parseInt(input);
        const selectedAuctionIndex = (currentPage - 1) * itemsPerPage + selectedOption - 1;

        if (selectedAuctionIndex >= 0 && selectedAuctionIndex < result.length) {
            const selectedAuction = result[selectedAuctionIndex];
            response = `CON You selected ${selectedAuction.auctionName}\n`;
            response += `Please enter your bid amount:`;
        } else {
            response = `END Invalid selection. Please try again.\n`;
        }
    }

    res.set('content-type', 'text/plain');
    res.send(response);
});

// Function to list auctions with pagination
function listAuctions(auctions, page, itemsPerPage) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedAuctions = auctions.slice(start, end);

    let response = "Bid on our live auctions:\n";
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
