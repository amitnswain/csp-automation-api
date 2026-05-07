class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, "Route not found"));
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    message: err.message || "Internal server error",
  };

  if (err.details !== undefined) {
    payload.details = err.details;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
};
