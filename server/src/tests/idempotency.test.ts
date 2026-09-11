import { describe, it, expect, vi, beforeEach } from "vitest";
import { IdempotencyManager } from "../lib/jobs/idempotency.js";
import { db } from "../db/index.js";

// Mock the database
vi.mock("../db/index.js", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe("IdempotencyManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true on first execution (successful insert)", async () => {
    // Mock insert to succeed
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue(true),
    });

    const result = await IdempotencyManager.checkAndRecord("test-key-1", "test_job");
    expect(result).toBe(true);
  });

  it("should return false on second execution (unique_violation)", async () => {
    // Mock insert to throw unique constraint error (code 23505)
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockRejectedValue({ code: "23505" }),
    });

    const result = await IdempotencyManager.checkAndRecord("test-key-2", "test_job");
    expect(result).toBe(false);
  });

  it("should throw on other database errors", async () => {
    // Mock insert to throw generic error
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error("Database down")),
    });

    await expect(IdempotencyManager.checkAndRecord("test-key-3", "test_job"))
      .rejects.toThrow("Database down");
  });

  it("should handle failed job marking", async () => {
    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    const whereMock = vi.fn().mockResolvedValue(true);
    
    (db.update as any).mockReturnValue({
      set: setMock,
    });
    setMock.mockReturnValue({
      where: whereMock
    });

    await IdempotencyManager.markFailed("test-key-4");
    expect(db.update).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
  });
});
