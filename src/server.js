const app = require("./app");
const { seedSampleTickets } = require("./store/ticketStore");

const PORT = process.env.PORT || 3000;

seedSampleTickets();

app.listen(PORT, () => {
  console.log(`IT Support Ticket API is running on port ${PORT}`);
});
