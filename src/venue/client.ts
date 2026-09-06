// Signed GET client for technocore.chat. Reads are anonymous; writes go through the
// signed lane (`/say-signed/`, `/set-signed/`) and never through a POST body. The client
// takes a Signer (airlock) and a Transport (replayable), so every test runs on a recording.
import { assertName } from "../identity/canonical.js";
import { didTail } from "../identity/did.js";
import type { Signer } from "../identity/signer.js";
import { signMessage, signNote } from "../identity/signer.js";
import { DuplicateGuard } from "./dedupe.js";
import { BadResponseError, DuplicateTextError, WriteBudgetError } from "./errors.js";
import { assertTextBudget, assertUrlBudget, singleLine } from "./line.js";
import { readAllForward, readForward, type ForwardOptions } from "./paging.js";
import { parseWriteReply, stripBanner } from "./reply.js";
import {
  RoomViewSchema,
  type ReadOptions,
  type RoomView,
  type Transport,
  type VenueMessage,
  type WriteResult,
} from "./types.js";
import {
  DEFAULT_BASE,
  noteUrl,
  normalizeBase,
  readUrl,
  saySignedUrl,
  setSignedUrl,
} from "./urls.js";
import { WriteBudget } from "./write-budget.js";

export interface VenueClientOptions {
  transport: Transport;
  base?: string;
  signer?: Signer;
  writeBudget?: WriteBudget;
  duplicateGuard?: DuplicateGuard;
}

export class VenueClient {
  readonly base: string;
  private readonly transport: Transport;
  private readonly signer: Signer | undefined;
  private readonly budget: WriteBudget;
  private readonly dupes: DuplicateGuard;

  constructor(opts: VenueClientOptions) {
    this.base = normalizeBase(opts.base ?? DEFAULT_BASE);
    this.transport = opts.transport;
    this.signer = opts.signer;
    this.budget = opts.writeBudget ?? new WriteBudget();
    this.dupes = opts.duplicateGuard ?? new DuplicateGuard();
  }

  get did(): string | undefined {
    return this.signer?.did;
  }

  /** One page, exactly as the venue serves it. Throws on a non-2xx status. */
  async read(room: string, opts: ReadOptions = {}): Promise<RoomView> {
    const res = await this.transport({ method: "GET", url: readUrl(this.base, room, opts) });
    if (res.status < 200 || res.status >= 300)
      throw new BadResponseError(res.status, firstLine(res.body));
    return RoomViewSchema.parse(JSON.parse(res.body));
  }

  /** Every message after `since`, oldest first, paged so no seq is skipped. */
  readForward(room: string, opts: ForwardOptions): AsyncGenerator<VenueMessage, number, void> {
    return readForward(this, room, opts);
  }

  async readAll(
    room: string,
    opts: ForwardOptions,
  ): Promise<{ messages: VenueMessage[]; cursor: number }> {
    return readAllForward(this, room, opts);
  }

  /** Signed room write. The text is folded to one line and swept before signing. */
  async say(room: string, nonce: string | number, text: string): Promise<WriteResult> {
    const signer = this.requireSigner();
    assertName(room, "room");
    const line = assertTextBudget(singleLine(text));
    this.guardWrite(line);
    const signed = signMessage(signer, room, nonce, line);
    const url = assertUrlBudget(
      saySignedUrl(this.base, room, signer.did, signed.sig, signed.nonce, signed.text),
    );
    const res = await this.transport({ method: "GET", url });
    const result = toWriteResult(
      res.status,
      res.body,
      signed.text,
      signed.sig,
      signed.nonce,
      signer.did,
    );
    if (result.ok) this.dupes.note(line);
    return result;
  }

  /** Signed note write (`set-signed`). Same sweep, budget and url rules as `say`. */
  async setNote(
    ns: string,
    key: string,
    nonce: string | number,
    value: string,
  ): Promise<WriteResult> {
    const signer = this.requireSigner();
    const line = assertTextBudget(singleLine(value));
    this.guardWrite(line);
    const signed = signNote(signer, ns, key, nonce, line);
    const url = assertUrlBudget(
      setSignedUrl(this.base, ns, key, signer.did, signed.sig, signed.nonce, signed.text),
    );
    const res = await this.transport({ method: "GET", url });
    return toWriteResult(res.status, res.body, signed.text, signed.sig, signed.nonce, signer.did);
  }

  /** A note's value without the venue banner; null when absent. Throws on other errors. */
  async getNote(ns: string, key: string): Promise<string | null> {
    const res = await this.transport({ method: "GET", url: noteUrl(this.base, ns, key) });
    if (res.status === 404) return null;
    if (res.status < 200 || res.status >= 300)
      throw new BadResponseError(res.status, firstLine(res.body));
    const value = stripBanner(res.body);
    return value === "" ? null : value;
  }

  private requireSigner(): Signer {
    if (this.signer === undefined)
      throw new Error("venue: this client has no signer; writes need one");
    return this.signer;
  }

  private guardWrite(line: string): void {
    const dupe = this.dupes.check(line);
    if (!dupe.ok) throw new DuplicateTextError(dupe.copies, this.dupes.windowMs);
    const budget = this.budget.take();
    if (!budget.ok) throw new WriteBudgetError(budget.retryAfterMs);
  }
}

function firstLine(body: string): string {
  return body.split("\n")[0] ?? "";
}

function toWriteResult(
  status: number,
  body: string,
  text: string,
  sig: string,
  nonce: string,
  did: string,
): WriteResult {
  const reply = parseWriteReply(body, `${didTail(did, 4)}>`);
  const out: WriteResult = { ok: status >= 200 && status < 300, status, body, text, sig, nonce };
  if (reply.seq !== undefined) out.seq = reply.seq;
  if (reply.ts !== undefined) out.ts = reply.ts;
  if (reply.budget !== undefined) out.budget = reply.budget;
  return out;
}
