export type GonkaModel =
  | "moonshotai/Kimi-K2.6"
  | "MiniMaxAI/MiniMax-M2.7"
  | "deepseek-ai/DeepSeek-V4-Flash-0731";

export type VerificationVerdict =
  | "TRUE"
  | "FALSE"
  | "UNCERTAIN";

export type Confidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export interface ModelVerificationResult {
  model: GonkaModel;
  requestId: string;

  verdict: VerificationVerdict;
  score: number;
  confidence: Confidence;

  reasoning: string;
}

export interface ConsensusResult {
  verdict: VerificationVerdict;
  score: number;
  confidence: Confidence;

  agreementCount: number;
  totalModels: number;

  reasoning: string;

  modelResults: ModelVerificationResult[];
}