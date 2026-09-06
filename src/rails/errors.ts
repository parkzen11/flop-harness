export class NotImplementedError extends Error {
  override readonly name = "NotImplementedError";
  constructor(
    readonly rail: string,
    readonly operation: string,
    readonly unit: string,
  ) {
    super(`rails: ${rail}.${operation} is not implemented; it is unit ${unit} for the swarm`);
  }
}
