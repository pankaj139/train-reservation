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
  let count = 1;
  for (let row = 0; row < 12; row++) {
    for (let seat = 1; seat <= (row === 11 ? 3 : 7); seat++) {
      const seatNumber = count++;
      await Seat.create({
        seatNumber,
        row,
        isAvailable: true,
      });
    }
  }

}

// async function reserveSeats(numSeats) {
//     const seats = await Seat.find({ isAvailable: true });
//     let bestCombination = [];
//     let minRowsInvolved = Number.MAX_VALUE;
  
//     // Function to find available seats in a row
//     const findAvailableSeatsInRow = (row) => {
//       return seats.filter(seat => seat.row === row && seat.isAvailable);
//     };
  
//     // Check each combination of rows
//     for (let startRow = 0; startRow < 12; startRow++) {
//       let currentCombination = [];
//       let seatsCount = 0;
//       let rowsInvolved = 0;
  
//       for (let row = startRow; row < 12 && seatsCount < numSeats; row++) {
//         const availableSeats = findAvailableSeatsInRow(row);
//         if (availableSeats.length > 0) {
//           rowsInvolved++;
//           seatsCount += availableSeats.length;
//           currentCombination.push(...availableSeats);
//         }
//       }
  
//       // Check if this combination is better than the previous best
//       if (seatsCount >= numSeats && rowsInvolved < minRowsInvolved) {
//         bestCombination = currentCombination.slice(0, numSeats);
//         minRowsInvolved = rowsInvolved;
//       }
//     }
  
//     // Reserve the best combination of seats found
//     if (bestCombination.length >= numSeats) {
//       for (const seat of bestCombination) {
//         seat.isAvailable = false;
//       }
  
//       await Seat.updateMany(
//         { seatNumber: { $in: bestCombination.map(seat => seat.seatNumber) } },
//         { $set: { isAvailable: false } }
//       );
  
//       return bestCombination.map(seat => seat.seatNumber);
//     } else {
//       return []; // No available combination found
//     }
//   }
  

// async function reserveSeats(numSeats) {
//     const seats = await Seat.find({ isAvailable: true });
//     let bestCombination = [];
//     let minRowSpan = Number.MAX_VALUE;

//     // Function to find available seats in a row
//     const findAvailableSeatsInRow = (row) => {
//         return seats.filter(seat => seat.row === row && seat.isAvailable);
//     };

//     // Iterate through all rows to find the best combination
//     for (let startRow = 0; startRow < 12; startRow++) {
//         for (let endRow = startRow; endRow < 12; endRow++) {
//             let currentCombination = [];
//             let seatsCount = 0;

//             for (let row = startRow; row <= endRow; row++) {
//                 const availableSeats = findAvailableSeatsInRow(row);
//                 seatsCount += availableSeats.length;
//                 currentCombination.push(...availableSeats);

//                 if (seatsCount >= numSeats) {
//                     let rowSpan = endRow - startRow + 1;
//                     if (rowSpan < minRowSpan) {
//                         bestCombination = currentCombination.slice(0, numSeats);
//                         minRowSpan = rowSpan;
//                     }
//                     break; // Stop adding seats as we have enough
//                 }
//             }
//         }
//     }

//     // Reserve the best combination of seats found
//     if (bestCombination.length >= numSeats) {
        
//         for (const seat of bestCombination) {
//             seat.isAvailable = false;
//         }

//         await Seat.updateMany(
//             { seatNumber: { $in: bestCombination.map(seat => seat.seatNumber) } },
//             { $set: { isAvailable: false } }
//         );

//         return bestCombination.map(seat => seat.seatNumber);
//     } else {
//         return []; // No available combination found
//     }
// }

async function reserveSeats(numSeats) {
    const seats = await Seat.find({ isAvailable: true });
    let bestCombination = [];
    let minRowSpan = Number.MAX_VALUE;
    let foundCompleteRow = false;

    // Function to find available seats in a row
    const findAvailableSeatsInRow = (row) => {
        return seats.filter(seat => seat.row === row && seat.isAvailable);
    };

    // First, try to find a row that can be completely filled
    for (let row = 0; row < 12; row++) {
        const availableSeats = findAvailableSeatsInRow(row);
        if (availableSeats.length === numSeats) {
            bestCombination = availableSeats;
            foundCompleteRow = true;
            break;
        }
    }

    // If no complete row can be filled, find the best combination
    if (!foundCompleteRow) {
        for (let startRow = 0; startRow < 12; startRow++) {
            for (let endRow = startRow; endRow < 12; endRow++) {
                let currentCombination = [];
                let seatsCount = 0;

                for (let row = startRow; row <= endRow; row++) {
                    const availableSeats = findAvailableSeatsInRow(row);
                    seatsCount += availableSeats.length;
                    currentCombination.push(...availableSeats);

                    if (seatsCount >= numSeats) {
                        let rowSpan = endRow - startRow + 1;
                        if (rowSpan < minRowSpan) {
                            bestCombination = currentCombination.slice(0, numSeats);
                            minRowSpan = rowSpan;
                        }
                        break; // Stop adding seats as we have enough
                    }
                }
            }
        }
    }

    // Reserve the best combination of seats found
    if (bestCombination.length >= numSeats) {
        
        for (const seat of bestCombination) {
            seat.isAvailable = false;
        }

        await Seat.updateMany(
            { seatNumber: { $in: bestCombination.map(seat => seat.seatNumber) } },
            { $set: { isAvailable: false  } }
        );

        return bestCombination.map(seat => seat.seatNumber);
    } else {
        return []; // No available combination found
    }
}



// Routes
app.get('/', async (req, res) => {
    const seats = await Seat.find();
    res.render('index', { seats , success:"", error: ""});
  });
app.get('/reset', async (req, res) => {
    await Seat.deleteMany({});
    await generateSeats(); // Recreate seats after deletion
    res.redirect('/');
  });

  app.post('/reserve', async (req, res) => {
    const numSeats = parseInt(req.body.numSeats, 10);
    if (isNaN(numSeats) || numSeats <= 0 || numSeats > 7) {
      return res.status(400).send('Invalid number of seats requested');
    }
  
    let result = await reserveSeats(numSeats)
    console.log(result);
    const allSeats = await Seat.find();
    
    if(result.length){
        res.render('index', {  seats: allSeats, success:`Reserved seats: ${result.map(seat => seat).join(', ')}` , error: "" });
    }
    else{
        res.render('index', {  seats: allSeats, success:"", error: "Not enough seats are available" });
    }
  });
  
  
  
  
  // Export the app instance
  module.exports = app;


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
