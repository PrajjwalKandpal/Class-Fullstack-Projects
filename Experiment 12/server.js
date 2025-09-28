// server.js

const express = require('express');
const app = express();
const port = 3000;

// Set the lock expiration time to 1 minute (60 seconds)
const LOCK_EXPIRATION_MS = 60000;

// Middleware to parse JSON request bodies
app.use(express.json());

// -----------------------------------------------------------------------------
// In-Memory Data Store (Seats)
// -----------------------------------------------------------------------------

/*
* Each seat object stores:
* - status: 'available', 'locked', or 'booked'
* - lock_timestamp: The time (in milliseconds) the seat was locked.
* - locked_by_user: A simple string to identify the user (for simplicity).
*/
const seats = {
    "1": { "status": "available", "lock_timestamp": null, "locked_by_user": null },
    "2": { "status": "available", "lock_timestamp": null, "locked_by_user": null },
    "3": { "status": "available", "lock_timestamp": null, "locked_by_user": null },
    "4": { "status": "available", "lock_timestamp": null, "locked_by_user": null },
    "5": { "status": "available", "lock_timestamp": null, "locked_by_user": null }
};

// -----------------------------------------------------------------------------
// Core Seat Management Functions
// -----------------------------------------------------------------------------

/**
 * Checks if a seat is currently locked and if that lock has expired.
 * If the lock has expired, it resets the seat status to 'available'.
 * @param {string} seatId - The ID of the seat.
 */
function refreshLockStatus(seatId) {
    const seat = seats[seatId];
    if (seat && seat.status === 'locked' && seat.lock_timestamp) {
        // Check if current time is past the expiration time
        const now = Date.now();
        if (now > seat.lock_timestamp + LOCK_EXPIRATION_MS) {
            console.log(`Lock for seat ${seatId} expired. Resetting status.`);
            seat.status = 'available';
            seat.lock_timestamp = null;
            seat.locked_by_user = null;
            return true; // Lock was refreshed
        }
    }
    return false; // Lock is still valid or seat is not locked
}

// Helper to transform the seats object into the expected array format for GET
function getSeatsArray() {
    return Object.entries(seats).map(([id, data]) => ({
        id,
        status: data.status
    }));
}

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

// Root Route (for testing status)
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Ticket Booking API is running.' });
});

// 1. GET /seats - View available seats
app.get('/seats', (req, res) => {
    // Before returning, refresh the status of all currently locked seats
    Object.keys(seats).forEach(refreshLockStatus);
    
    // Return the formatted array of seats
    res.status(200).json(getSeatsArray());
});

// 2. POST /seats/lock/:id - Temporarily lock a seat
app.post('/seats/lock/:id', (req, res) => {
    const seatId = req.params.id;
    const seat = seats[seatId];
    const userId = req.body.user || 'anonymous'; // Use user ID from body or default

    if (!seat) {
        return res.status(404).json({ message: "Seat not found." });
    }

    // Always check for expired lock before attempting to lock
    refreshLockStatus(seatId); 
    
    if (seat.status === 'available') {
        // Lock the seat
        seat.status = 'locked';
        seat.lock_timestamp = Date.now();
        seat.locked_by_user = userId;
        
        // Schedule an automatic release if confirmation doesn't happen
        setTimeout(() => {
            if (seat.status === 'locked' && seat.lock_timestamp === Date.now() - LOCK_EXPIRATION_MS) {
                // Double-check the status to ensure it hasn't been confirmed/booked
                refreshLockStatus(seatId); 
            }
        }, LOCK_EXPIRATION_MS + 100); 

        // 200 OK: Seat locked successfully
        res.status(200).json({ 
            message: `Seat ${seatId} locked successfully. Confirm within ${LOCK_EXPIRATION_MS / 1000} seconds.`,
            seat: { id: seatId, status: seat.status }
        });
    } else if (seat.status === 'locked') {
        // 409 Conflict: Seat is already locked
        res.status(409).json({ message: `Seat ${seatId} is already locked by user ${seat.locked_by_user}.` });
    } else { // seat.status === 'booked'
        // 409 Conflict: Seat is already booked
        res.status(409).json({ message: `Seat ${seatId} is already booked.` });
    }
});

// 3. POST /seats/confirm/:id - Confirm the booking
app.post('/seats/confirm/:id', (req, res) => {
    const seatId = req.params.id;
    const seat = seats[seatId];
    const userId = req.body.user || 'anonymous';

    if (!seat) {
        return res.status(404).json({ message: "Seat not found." });
    }

    // Always check for expired lock
    refreshLockStatus(seatId);

    if (seat.status === 'locked' && seat.locked_by_user === userId) {
        // Only the user who locked it can confirm it, and only if the lock is valid.
        seat.status = 'booked';
        seat.lock_timestamp = null; // Clear lock data
        seat.locked_by_user = userId;
        
        // 200 OK: Booking successful
        res.status(200).json({ 
            message: `Seat ${seatId} booked successfully!`,
            seat: { id: seatId, status: seat.status }
        });
    } else if (seat.status === 'available') {
        // 400 Bad Request: Cannot book an available seat without locking first
        res.status(400).json({ message: "Seat is not locked and cannot be booked. Lock it first." });
    } else if (seat.status === 'booked') {
         // 409 Conflict: Already booked
        res.status(409).json({ message: `Seat ${seatId} is already booked.` });
    } else { // status is 'locked' but locked_by_user != userId (locked by someone else)
         // 403 Forbidden: Locked by another user
        res.status(403).json({ message: `Seat ${seatId} is locked by another user and cannot be confirmed.` });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Lock expiration set to ${LOCK_EXPIRATION_MS / 1000} seconds.`);
});