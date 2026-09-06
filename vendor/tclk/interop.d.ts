import type { JobRef } from "./frames.js";
import type { TclkStatus } from "./machine.js";
/** The A2A task states, as the A2A spec defines them. */
export type A2ATaskState = "submitted" | "working" | "input-required" | "completed" | "canceled" | "failed" | "rejected" | "auth-required" | "unknown";
/** Total mapping onto the A2A task state machine. */
export declare function tclkStatusToA2A(status: TclkStatus): A2ATaskState;
/** Virtuals ACP job phases (request → negotiation → transaction → evaluation → done). */
export type AcpPhase = "request" | "negotiation" | "transaction" | "evaluation" | "completed" | "rejected";
/**
 * Total mapping onto ACP phases. ACP's evaluation sits inside `locked`: the evaluator
 * accepting delivery is the payee's cue to reveal — an ACP state transition is never
 * itself treated as execution proof (same stance as the Virtuals ACP bridge).
 */
export declare function tclkStatusToAcpPhase(status: TclkStatus): AcpPhase;
/** Bind an offer to an A2A task. */
export declare function a2aJob(taskId: string, contextId?: string): JobRef;
/** Bind an offer to a Virtuals ACP job. */
export declare function acpJob(jobId: string | number): JobRef;
