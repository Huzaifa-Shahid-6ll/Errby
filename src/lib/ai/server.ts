import "server-only";

export type AiRole = "preparation" | "evaluation" | "errby";

// Deliberately fail closed until schema validation, grounding and cost reservation
// are implemented together. A credential alone must never enable paid requests.
export async function requestModel(role: AiRole): Promise<never> {
  throw new Error(
    `Live ${role} provider is not implemented. No model request was sent.`,
  );
}
