import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module before importing activity-log
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  activityLog: { id: "id" },
}));

describe("writeActivityLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is an exported async function", async () => {
    const mod = await import("../activity-log");
    expect(typeof mod.writeActivityLog).toBe("function");
  });

  it("accepts required fields: requestType, description, status", async () => {
    const { db } = await import("@/db");
    const mockInsert = vi.mocked(db.insert);
    const mockValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "test-id-123" }]),
    });
    mockInsert.mockReturnValue({ values: mockValues } as any);

    const { writeActivityLog } = await import("../activity-log");
    const id = await writeActivityLog({
      requestType: "connectivity_check",
      description: "Testing AppFolio API connectivity",
      status: "completed",
    });

    expect(id).toBe("test-id-123");
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "connectivity_check",
        description: "Testing AppFolio API connectivity",
        status: "completed",
      })
    );
  });

  it("accepts all optional fields without throwing", async () => {
    const { db } = await import("@/db");
    const mockInsert = vi.mocked(db.insert);
    const mockValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "opt-id" }]),
    });
    mockInsert.mockReturnValue({ values: mockValues } as any);

    const { writeActivityLog } = await import("../activity-log");
    const id = await writeActivityLog({
      requestType: "unit_turn",
      description: "Creating work orders for unit turn",
      status: "pending",
      inputs: { unitId: "u-123", scopes: ["paint", "cleaning"] },
      plannedActions: { steps: ["create_work_order_paint"] },
      expectedOutputs: { workOrders: 1 },
      outcomeNotes: "Work order created successfully",
      unitId: "u-123",
      scopeId: "scope-456",
    });

    expect(id).toBe("opt-id");
  });
});
