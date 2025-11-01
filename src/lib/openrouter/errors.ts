export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

export class OpenRouterAuthError extends OpenRouterError {
  constructor(message = "Authentication failed. Check your API key.") {
    super(message, 401);
    this.name = "OpenRouterAuthError";
    Object.setPrototypeOf(this, OpenRouterAuthError.prototype);
  }
}

export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message = "Rate limit exceeded.",
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = "OpenRouterRateLimitError";
    Object.setPrototypeOf(this, OpenRouterRateLimitError.prototype);
  }
}

export class OpenRouterValidationError extends OpenRouterError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 400);
    this.name = "OpenRouterValidationError";
    Object.setPrototypeOf(this, OpenRouterValidationError.prototype);
  }
}

export class OpenRouterModelError extends OpenRouterError {
  constructor(message: string) {
    super(message, 500);
    this.name = "OpenRouterModelError";
    Object.setPrototypeOf(this, OpenRouterModelError.prototype);
  }
}

export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(message = "Request timeout.") {
    super(message);
    this.name = "OpenRouterTimeoutError";
    Object.setPrototypeOf(this, OpenRouterTimeoutError.prototype);
  }
}

export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message = "Network error occurred.") {
    super(message);
    this.name = "OpenRouterNetworkError";
    Object.setPrototypeOf(this, OpenRouterNetworkError.prototype);
  }
}
