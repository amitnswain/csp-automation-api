const express = require("express");
const {
  createTicket,
  listTickets,
  getTicketById,
  updateTicketStatus,
} = require("../store/ticketStore");
const {
  validateCreateTicketBody,
  validateListFilters,
  validateStatusUpdateBody,
} = require("../validation");
const { ApiError } = require("../errors");

const router = express.Router();

router.post("/", (req, res, next) => {
  try {
    validateCreateTicketBody(req.body);
    const ticket = createTicket(req.body);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

router.get("/", (req, res, next) => {
  try {
    validateListFilters(req.query);
    const tickets = listTickets({
      status: req.query.status,
      search: req.query.search,
    });
    res.json(tickets);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    const ticket = getTicketById(req.params.id);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", (req, res, next) => {
  try {
    const existingTicket = getTicketById(req.params.id);
    if (!existingTicket) {
      throw new ApiError(404, "Ticket not found");
    }

    validateStatusUpdateBody(req.body, existingTicket.status);
    const updatedTicket = updateTicketStatus(req.params.id, req.body.status);
    res.json(updatedTicket);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
