const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, unique: true, required: true },
  isAvailable: { type: Boolean, default: true },
  reservation: {
    reservedBy: String,
    reservedAt: Date,
  },
  // Add other seat-related properties as needed
});

const Seat = mongoose.model('Seat', seatSchema);

module.exports = Seat;
