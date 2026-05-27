const express = require("express");
const ticketRoutes = require("./routes/tickets");
const mcpRoutes = require("../../mcp-server/routes");
const { errorHandler, notFoundHandler } = require("./errors");

const app = express();

app.use(express.json());
app.use("/tickets", ticketRoutes);
app.use("/mcp", mcpRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
