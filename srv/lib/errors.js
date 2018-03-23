
export default class PermissionError extends Error {
  constructor(message) {
    super(message);
    this.isUserError = true;
  }
}
