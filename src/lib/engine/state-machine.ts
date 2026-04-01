import type { StepDefinition, StepContext, AutomationState } from "./types";

/**
 * Step-level state machine for automation sequences (ENGINE-04).
 *
 * Executes steps sequentially. When a step fails (either by returning
 * { success: false } or throwing), the machine records the failure state,
 * marks all remaining steps as "skipped", and returns. The state is always
 * inspectable after run() — callers can determine exactly which step failed
 * and why, enabling partial failure recovery.
 */
export class StateMachine {
  private state: AutomationState;
  private steps: StepDefinition[];
  private logs: string[] = [];

  constructor(steps: StepDefinition[]) {
    this.steps = steps;
    this.state = {
      status: "pending",
      currentStep: 0,
      steps: steps.map((s) => ({
        name: s.name,
        description: s.description,
        status: "pending" as const,
      })),
    };
  }

  /**
   * Returns a deep copy of the current automation state.
   * Mutation of the returned object does not affect the machine's internal state.
   */
  getState(): AutomationState {
    return structuredClone(this.state);
  }

  /** Returns all messages logged via context.log() during execution. */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Execute all steps sequentially from the current position.
   * Returns the final automation state.
   */
  async run(): Promise<AutomationState> {
    this.state.status = "running";
    this.state.startedAt = new Date();

    const context: StepContext = {
      data: {},
      log: (message: string) => this.logs.push(message),
    };

    for (let i = this.state.currentStep; i < this.steps.length; i++) {
      this.state.currentStep = i;
      const stepState = this.state.steps[i];
      stepState.status = "running";
      stepState.startedAt = new Date();

      try {
        const result = await this.steps[i].execute(context);

        if (result.success) {
          stepState.status = "completed";
          stepState.completedAt = new Date();
          // Merge step output into shared context for downstream steps
          if (result.data) {
            Object.assign(context.data, result.data);
          }
        } else {
          // Step returned failure — record and stop
          stepState.status = "failed";
          stepState.error = result.error ?? "Step failed without error message";
          stepState.completedAt = new Date();
          this.markRemainingSkipped(i + 1);
          this.state.status = "failed";
          this.state.completedAt = new Date();
          return this.getState();
        }
      } catch (error) {
        // Step threw — treat as failure
        stepState.status = "failed";
        stepState.error =
          error instanceof Error ? error.message : "Unknown error";
        stepState.completedAt = new Date();
        this.markRemainingSkipped(i + 1);
        this.state.status = "failed";
        this.state.completedAt = new Date();
        return this.getState();
      }
    }

    this.state.status = "completed";
    this.state.completedAt = new Date();
    return this.getState();
  }

  private markRemainingSkipped(fromIndex: number): void {
    for (let j = fromIndex; j < this.state.steps.length; j++) {
      this.state.steps[j].status = "skipped";
    }
  }
}
