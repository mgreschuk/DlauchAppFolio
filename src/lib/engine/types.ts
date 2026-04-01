export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";
export type AutomationStatus = "pending" | "running" | "completed" | "failed";

export interface StepDefinition {
  name: string;
  /** Plain-language description for non-technical users (D-08) */
  description: string;
  execute: (context: StepContext) => Promise<StepResult>;
}

export interface StepContext {
  /** Accumulated data from previous steps — passes state forward without coupling */
  data: Record<string, unknown>;
  /** Log a message for the activity log — plain language per D-08 */
  log: (message: string) => void;
}

export interface StepResult {
  success: boolean;
  /** Data to merge into the shared context for downstream steps */
  data?: Record<string, unknown>;
  /** Human-readable error message — no stack traces per D-08 */
  error?: string;
}

export interface StepState {
  name: string;
  description: string;
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface AutomationState {
  status: AutomationStatus;
  currentStep: number;
  steps: StepState[];
  startedAt?: Date;
  completedAt?: Date;
}
