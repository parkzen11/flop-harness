export interface SpecNote {
ns: string;
key: string;
value: string;
}
export interface BuildOfferResult {
offer: {
id: string;
from: string;
amount: string;
asset: string;
rails: string[];
job?: { proto: string; id: string; context?: string };
claimByMs: number;
refundAfterMs: number;
expiresMs: number;
};
specNote: SpecNote;
}
