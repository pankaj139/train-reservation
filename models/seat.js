const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, unique: true, required: true },
  isAvailable: { type: Boolean, default: true },
  row: { type: Number, default: true }
});

const Seat = mongoose.model('Seat', seatSchema);

module.exports = Seat;
