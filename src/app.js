const express = require("express");
const ticketRoutes = require("./routes/tickets");
const { errorHandler, notFoundHandler } = require("./errors");

const app = express();

app.use(express.json());
app.use("/tickets", ticketRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
