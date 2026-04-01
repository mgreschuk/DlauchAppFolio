import { describe, it, expect } from "vitest";
import { StateMachine } from "../state-machine";
import type { StepDefinition } from "../types";

describe("StateMachine", () => {
  it("completes all steps with status 'completed' when all succeed", async () => {
    const steps: StepDefinition[] = [
      {
        name: "step-1",
        description: "First step",
        execute: async () => ({ success: true }),
      },
      {
        name: "step-2",
        description: "Second step",
        execute: async () => ({ success: true }),
      },
      {
        name: "step-3",
        description: "Third step",
        execute: async () => ({ success: true }),
      },
    ];

    const machine = new StateMachine(steps);
    const result = await machine.run();

    expect(result.status).toBe("completed");
    expect(result.steps).toHaveLength(3);
    result.steps.forEach((step) => {
      expect(step.status).toBe("completed");
    });
  });

  it("stops at failed step and marks remaining steps as 'skipped'", async () => {
    const steps: StepDefinition[] = [
      {
        name: "step-1",
        description: "First step",
        execute: async () => ({ success: true }),
      },
      {
        name: "step-2",
        description: "Failing step",
        execute: async () => ({ success: false, error: "Something broke" }),
      },
      {
        name: "step-3",
        description: "Should be skipped",
        execute: async () => ({ success: true }),
      },
    ];

    const machine = new StateMachine(steps);
    const result = await machine.run();

    expect(result.status).toBe("failed");
    expect(result.steps[0].status).toBe("completed");
    expect(result.steps[1].status).toBe("failed");
    expect(result.steps[1].error).toBe("Something broke");
    expect(result.steps[2].status).toBe("skipped");
  });

  it("marks remaining steps as 'skipped' when a step throws", async () => {
    const steps: StepDefinition[] = [
      {
        name: "step-1",
        description: "First step",
        execute: async () => {
          throw new Error("Unexpected exception");
        },
      },
      {
        name: "step-2",
        description: "Should be skipped",
        execute: async () => ({ success: true }),
      },
    ];

    const machine = new StateMachine(steps);
    const result = await machine.run();

    expect(result.status).toBe("failed");
    expect(result.steps[0].status).toBe("failed");
    expect(result.steps[0].error).toBe("Unexpected exception");
    expect(result.steps[1].status).toBe("skipped");
  });

  it("getState() returns a copy, not a mutable reference", async () => {
    const steps: StepDefinition[] = [
      {
        name: "step-1",
        description: "First step",
        execute: async () => ({ success: true }),
      },
    ];

    const machine = new StateMachine(steps);
    const state1 = machine.getState();
    const state2 = machine.getState();

    // Mutating the returned state should not affect machine's internal state
    state1.status = "failed";
    expect(state2.status).toBe("pending");
    expect(machine.getState().status).toBe("pending");
  });

  it("context.data accumulates across steps", async () => {
    const captured: Record<string, unknown>[] = [];

    const steps: StepDefinition[] = [
      {
        name: "step-1",
        description: "Sets foo",
        execute: async (ctx) => ({
          success: true,
          data: { foo: "bar" },
        }),
      },
      {
        name: "step-2",
        description: "Reads foo, sets baz",
        execute: async (ctx) => {
          captured.push({ ...ctx.data });
          return { success: true, data: { baz: "qux" } };
        },
      },
      {
        name: "step-3",
        description: "Reads both",
        execute: async (ctx) => {
          captured.push({ ...ctx.data });
          return { success: true };
        },
      },
    ];

    const machine = new StateMachine(steps);
    await machine.run();

    // Step 2 should see foo from step 1
    expect(captured[0]).toMatchObject({ foo: "bar" });
    // Step 3 should see both foo and baz
    expect(captured[1]).toMatchObject({ foo: "bar", baz: "qux" });
  });

  it("getLogs() returns messages from context.log()", async () => {
    const steps: StepDefinition[] = [
      {
        name: "step-1",
        description: "Logs messages",
        execute: async (ctx) => {
          ctx.log("First message");
          ctx.log("Second message");
          return { success: true };
        },
      },
    ];

    const machine = new StateMachine(steps);
    await machine.run();
    const logs = machine.getLogs();

    expect(logs).toEqual(["First message", "Second message"]);
  });

  it("initializes all steps with 'pending' status", () => {
    const steps: StepDefinition[] = [
      {
        name: "step-1",
        description: "A step",
        execute: async () => ({ success: true }),
      },
    ];

    const machine = new StateMachine(steps);
    const state = machine.getState();

    expect(state.status).toBe("pending");
    expect(state.steps[0].status).toBe("pending");
  });
});
