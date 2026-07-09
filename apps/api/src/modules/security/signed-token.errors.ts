export class InvalidTokenError extends Error {
  constructor(message = 'Signature verification failed') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

export class ExpiredTokenError extends Error {
  constructor(message = 'Token has expired') {
    super(message);
    this.name = 'ExpiredTokenError';
  }
}
