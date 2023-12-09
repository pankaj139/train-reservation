const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Adjust the path based on your project structure
const Seat = require('../models/seat'); // Adjust the path based on your project structure

chai.use(chaiHttp);
const expect = chai.expect;
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

describe('Seat Reservation API', () => {
  beforeEach(async () => {
    // Clear the database and recreate seats before each test
    await Seat.deleteMany({});
    await generateSeats(); // Assuming you have a function to generate seats
  });

  it('should reserve seats in one row', async () => {
    const response = await chai.request(app)
      .post('/reserve')
      .send({ numSeats: 3 }); // Adjust the number of seats based on your logic

    expect(response).to.have.status(200);
    expect(response.body.reservedSeats).to.be.an('array').that.is.not.empty;
  });

  it('should reserve nearby seats if not available in one row', async () => {
    // Reserve some seats in one row to make them unavailable
    // Then try to reserve more seats than available in that row
    const initialResponse = await chai.request(app)
      .post('/reserve')
      .send({ numSeats: 4 }); // Adjust the number of seats based on your logic

    expect(initialResponse).to.have.status(200);

    const response = await chai.request(app)
      .post('/reserve')
      .send({ numSeats: 3 }); // Adjust the number of seats based on your logic

    expect(response).to.have.status(200);
    expect(response.body.reservedSeats).to.be.an('array').that.is.not.empty;
  });

  it('should handle invalid number of seats', async () => {
    const response = await chai.request(app)
      .post('/reserve')
      .send({ numSeats: 0 });

    expect(response).to.have.status(400);
    expect(response.text).to.equal('Invalid number of seats requested');
  });

  it('should handle not enough available seats', async () => {
    // Reserve all available seats
    const reserveAllResponse = await chai.request(app)
      .post('/reserve')
      .send({ numSeats: 80 }); // Assuming you have 80 seats in your test environment

    expect(reserveAllResponse).to.have.status(200);

    // Try to reserve more seats than available
    const response = await chai.request(app)
      .post('/reserve')
      .send({ numSeats: 2 });

    expect(response).to.have.status(400);
    expect(response.text).to.equal('Not enough available seats');
  });
});
