// server.js

const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies from incoming requests
app.use(express.json());

// -----------------------------------------------------------------------------
// In-Memory Data Store
// -----------------------------------------------------------------------------

// Initial array of cards
let cards = [
    { "id": 1, "suit": "Hearts", "value": "Ace" },
    { "id": 2, "suit": "Spades", "value": "King" },
    { "id": 3, "suit": "Diamonds", "value": "Queen" }
];
// Counter to ensure unique IDs for new cards
let nextId = 4;

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

// Root Route (A good practice for API status)
app.get('/', (req, res) => {
    res.status(200).json({ message: "Card Collection API is running. Use /cards to access resources." });
});

// 1. GET /cards - List all cards (Expected Output fulfilled)
app.get('/cards', (req, res) => {
    // 200 OK: Return the entire collection
    res.status(200).json(cards);
});

// 2. GET /cards/:id - Retrieve a specific card by ID (Expected Output fulfilled)
app.get('/cards/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const card = cards.find(c => c.id === id);

    if (card) {
        res.status(200).json(card);
    } else {
        // 404 Not Found
        res.status(404).json({ message: `Card with ID ${id} not found.` });
    }
});

// 3. POST /cards - Add a new card
app.post('/cards', (req, res) => {
    const { suit, value } = req.body;

    if (!suit || !value) {
        // 400 Bad Request
        return res.status(400).json({ message: "Missing 'suit' or 'value'. Both are required." });
    }

    const newCard = {
        id: nextId++,
        suit: suit,
        value: value
    };

    cards.push(newCard);
    // 201 Created
    res.status(201).json(newCard); 
});

// 4. DELETE /cards/:id - Delete a card by ID
app.delete('/cards/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const cardIndex = cards.findIndex(c => c.id === id);

    if (cardIndex !== -1) {
        const [deletedCard] = cards.splice(cardIndex, 1);

        // 200 OK
        res.status(200).json({
            message: `Card with ID ${id} removed.`,
            card: deletedCard 
        });
    } else {
        // 404 Not Found
        res.status(404).json({ message: `Card with ID ${id} not found.` });
    }
});


// -----------------------------------------------------------------------------
// Start Server
// -----------------------------------------------------------------------------
app.listen(port, () => {
    console.log(`Card API server running at http://localhost:${port}`);
});