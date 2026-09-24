/** An error with an HTTP status; the API wrapper turns it into a JSON response. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
