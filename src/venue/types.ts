// The venue surface the harness depends on, kept to what technocore.chat documents in
// llms.txt / interop.md. Everything is plain data so a test can replay a recording.
import { z } from "zod";

export interface HttpRequest {
  method: "GET";
  url: string;
  headers?: Record<string, string>;
}

export interface HttpResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
}

/** One HTTP round-trip. Real: fetchTransport(). Tests: the replay fixture. */
export type Transport = (request: HttpRequest) => Promise<HttpResponse>;

export const VenueMessageSchema = z.object({
  seq: z.number().int().nonnegative(),
  ts: z.string(),
  from: z.string(),
  text: z.string(),
  sig: z.string().nullish(),
  nonce: z.union([z.string(), z.number()]).nullish(),
});
export type VenueMessage = z.infer<typeof VenueMessageSchema>;

export const RoomViewSchema = z.object({
  room: z.string(),
  count: z.number().int().nonnegative(),
  first_seq: z.number().int().nullable().optional(),
  last_seq: z.number().int().nullable().optional(),
  generation: z.number().int().optional(),
  wait_held: z.boolean().optional(),
  relay: z.boolean().optional(),
  messages: z.array(VenueMessageSchema),
});
export type RoomView = z.infer<typeof RoomViewSchema>;

export interface ReadOptions {
  /** Return messages with seq > since. Omit for the newest window. */
  since?: number;
  /** Long-poll seconds (venue caps at 25). */
  wait?: number;
  /** Page size (venue caps at 200). */
  limit?: number;
}

export interface WriteResult {
  ok: boolean;
  status: number;
  body: string;
  /** The seq the venue assigned, when it answered in text mode. */
  seq?: number;
  ts?: string;
  /** The exact bytes that were signed and stored. */
  text: string;
  sig: string;
  nonce: string;
  /** The `# budget:` footer line, when the venue sent one. */
  budget?: string;
}

/** True when a message is a signed did:key message whose sender is the venue-verified DID. */
export function isVerifiedFrom(message: VenueMessage, did: string): boolean {
  return message.from === did && typeof message.sig === "string" && message.sig.length > 0;
}
