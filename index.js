const express = require('express');
const apps = require('./firebase');
const cors = require('cors');
const { getFirestore, collection, getDocs, addDoc, setDoc, doc } = require('firebase/firestore');
const bodyParser = require('body-parser');

// Initialize your app
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const fireStoreDb = getFirestore(apps);
const fireStoreCollection = collection(fireStoreDb, "Auctions");

// Firestore collection to store bids
const bidCollection = collection(fireStoreDb, "Bids");

// Endpoint to test server
app.get('/', (req, res) => {
  res.send('hello world');
});

// Endpoint for USSD application
app.post('/ussd', async (req, res) => {
  let response = "";
  const {
    sessionId,
    phoneNumber,
    serviceCode,
    text
  } = req.body;

  // Split the user input by '*'
  const textArray = text.split('*');

  // Fetch all auctions from Firestore
  const auctions = await getAuctions();
  const pageSize = 5;  // Define the number of auctions per page
  const pageCount = Math.ceil(auctions.length / pageSize);  // Calculate the number of pages needed
  const currentPageIndex = textArray[0] === "" ? 0 : parseInt(textArray[0]) - 1;

  if (text === "") {
    // First request: display the first page of auctions
    response = "CON Welcome to Bid Laisi Reverse Auctions \n\n";
    response += listAuctions(auctions, 0, pageSize);
    response += "\nEnter auction number to bid or enter 1 for next page:";
  } else if (currentPageIndex >= 0 && currentPageIndex < pageCount) {
    // Show next page
    const start = currentPageIndex * pageSize;
    const end = start + pageSize;
    if (start < auctions.length) {
      response = `CON Page ${currentPageIndex + 1} Auctions: \n\n`;
      response += listAuctions(auctions, start, end);
      response += "\nEnter auction number to bid or enter " + (currentPageIndex + 2) + " for next page:";
    } else {
      response = "END No more auctions.";
    }
  } else if (textArray.length === 2) {
    // If user selects an auction, prompt them to enter a bid amount
    const auctionIndex = parseInt(textArray[0]) - 1;
    const bidAmount = textArray[1];
    if (auctionIndex >= 0 && auctionIndex < auctions.length && !isNaN(bidAmount)) {
      const selectedAuction = auctions[auctionIndex];
      await addBid(phoneNumber, selectedAuction.id, bidAmount);
      response = `END Your bid of ${bidAmount} has been placed on ${selectedAuction.auctionName}. Thank you for participating!`;
    } else {
      response = "CON Invalid bid. Please enter a valid amount.";
    }
  } else if (text.startsWith("3*")) {
    // Handle input like "3*2" to select an item from a list
    const choice = text.split("*")[1]; // Extract the user's choice
    const result = await getAuctions(); // Fetch records again

    if (choice && result[choice - 1]) {
      const selectedItem = result[choice - 1];
      // Save the selected item to Firestore with the phone number as the ID
      const saveMessage = await saveSelectedItem(phoneNumber, selectedItem);
      response = `END ${saveMessage}`;
    } else {
      response = "END Invalid choice.";
    }
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

// Function to list auctions with pagination
function listAuctions(auctions, start, end) {
  let response = "";
  for (let i = start; i < Math.min(end, auctions.length); i++) {
    response += `${i + 1}. ${auctions[i].auctionName} \n`;
  }
  return response;
}

// Function to fetch all auctions from Firestore
async function getAuctions() {
  const data = [];
  const result = await getDocs(fireStoreCollection);
  result.docs.forEach((doc) => {
    data.push({ ...doc.data(), id: doc.id });
  });
  return data;
}

// Function to add a bid to Firestore
async function addBid(phoneNumber, auctionId, bidAmount) {
  try {
    await addDoc(bidCollection, {
      phoneNumber: phoneNumber,
      auctionId: auctionId,
      bidAmount: parseFloat(bidAmount),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding bid: ", error);
  }
}

// Function to save selected item to Firestore
async function saveSelectedItem(phoneNumber, selectedItem) {
  try {
    await setDoc(doc(fireStoreDb, "SelectedItems", phoneNumber), {
      selectedItem,
      timestamp: new Date().toISOString()
    });
    return `You have successfully selected ${selectedItem.auctionName}.`;
  } catch (error) {
    console.error("Error saving selected item: ", error);
    return "Failed to save selected item.";
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening at port ${port}`));
