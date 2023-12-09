const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/train_reservation', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Seat Schema
const Seat = require('./models/seat');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Generate Seats and Save to Database
async function generateSeats() {
  await Seat.deleteMany({});

  for (let row = 0; row < 10; row++) {
    for (let seat = 1; seat <= (row === 9 ? 3 : 7); seat++) {
      const seatNumber = row * 10 + seat;
      await Seat.create({
        seatNumber,
        row,
        isAvailable: true,
      });
    }
  }
}

// Routes
app.get('/', async (req, res) => {
    const seats = await Seat.find();
    res.render('index', { seats });
  });
app.get('/reset', async (req, res) => {
    await Seat.deleteMany({});
    await generateSeats(); // Recreate seats after deletion
    res.redirect('/');
  });

  app.post('/reserve', async (req, res) => {
    const numSeats = parseInt(req.body.numSeats, 10);
    if (isNaN(numSeats) || numSeats <= 0 || numSeats > 7) {
        console.log('Invalid number of');
      return res.status(400).send('Invalid number of seats requested');
    }
  
    const seats = await Seat.find({ isAvailable: true });
    let reservedSeats = [];
  
    // Function to find consecutive available seats
    const findConsecutiveSeats = (allSeats, startIndex, numSeats) => {
      const consecutiveSeats = [];
      for (let i = startIndex; i < allSeats.length && consecutiveSeats.length < numSeats; i++) {
        if (allSeats[i].isAvailable) {
          consecutiveSeats.push(allSeats[i]);
        } else {
          // Reset if a booked seat is encountered
          consecutiveSeats.length = 0;
        }
      }
      return consecutiveSeats.length === numSeats ? consecutiveSeats : null;
    };
  
    // Attempt to reserve seats in one row
    for (let row = 0; row < 10; row++) {
      const rowSeats = seats.filter((seat) => seat.row === row && seat.isAvailable);
      const consecutiveSeatsInRow = findConsecutiveSeats(rowSeats, 0, numSeats);
  
      if (consecutiveSeatsInRow) {
        reservedSeats = consecutiveSeatsInRow;
        break;
      }
    }
  
    // If not enough consecutive seats in one row, reserve nearby available seats
    if (reservedSeats.length < numSeats) {
      const allConsecutiveSeats = findConsecutiveSeats(seats, 0, numSeats);
      if (allConsecutiveSeats) {
        reservedSeats = allConsecutiveSeats;
      } else {
        return res.status(400).send('Not enough available seats');
      }
    }
  
    // Mark seats as reserved
    const reservedBy = 'John Doe'; // Replace with actual user info
    const reservedAt = new Date();
    for (const seat of reservedSeats) {
      seat.isAvailable = false;
      seat.reservation = { reservedBy, reservedAt };
    }
  
    await Seat.updateMany(
      { seatNumber: { $in: reservedSeats.map((seat) => seat.seatNumber) } },
      { $set: { isAvailable: false, reservation: { reservedBy, reservedAt } } }
    );
  
    const allSeats = await Seat.find();
    res.render('index', { reservedSeats, seats: allSeats });
  });
  
  
  
  
  // Export the app instance
  module.exports = app;


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
