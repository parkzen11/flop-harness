export class VenueError extends Error {
  override readonly name: string = "VenueError";
}

export class TextTooLongError extends VenueError {
  override readonly name = "TextTooLongError";
  constructor(
    readonly chars: number,
    readonly limit: number,
  ) {
    super(`venue: text is ${chars} chars; the venue stores at most ${limit}`);
  }
}

export class UrlTooLongError extends VenueError {
  override readonly name = "UrlTooLongError";
  constructor(
    readonly chars: number,
    readonly limit: number,
  ) {
    super(`venue: signed GET url is ${chars} chars after percent-encoding; limit ${limit}`);
  }
}

export class WriteBudgetError extends VenueError {
  override readonly name = "WriteBudgetError";
  constructor(readonly retryAfterMs: number) {
    super(`venue: local write budget spent; retry in ${retryAfterMs} ms`);
  }
}

export class DuplicateTextError extends VenueError {
  override readonly name = "DuplicateTextError";
  constructor(
    readonly copies: number,
    readonly windowMs: number,
  ) {
    super(
      `venue: same text already sent ${copies} times in ${windowMs} ms; the dupe filter would drop it`,
    );
  }
}

export class BadResponseError extends VenueError {
  override readonly name = "BadResponseError";
  constructor(
    readonly status: number,
    readonly firstLine: string,
  ) {
    super(`venue: ${status} ${firstLine}`);
  }
}
