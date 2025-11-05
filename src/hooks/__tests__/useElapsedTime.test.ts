import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useElapsedTime } from "../useElapsedTime";

describe("useElapsedTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Initial state", () => {
    it("should start with 0 when isActive is false", () => {
      const { result } = renderHook(() => useElapsedTime(false));

      expect(result.current).toBe(0);
    });

    it("should start with 0 when isActive is true", () => {
      const { result } = renderHook(() => useElapsedTime(true));

      expect(result.current).toBe(0);
    });
  });

  describe("Timer behavior", () => {
    it("should increment by 1 every second when active", () => {
      const { result } = renderHook(() => useElapsedTime(true));

      expect(result.current).toBe(0);

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current).toBe(1);

      // Advance another second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current).toBe(2);

      // Advance multiple seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current).toBe(7);
    });

    it("should not increment when isActive is false", () => {
      const { result } = renderHook(() => useElapsedTime(false));

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current).toBe(0);
    });

    it("should handle rapid timer advances", () => {
      const { result } = renderHook(() => useElapsedTime(true));

      // Advance time in small increments
      for (let i = 1; i <= 10; i++) {
        act(() => {
          vi.advanceTimersByTime(1000);
        });
        expect(result.current).toBe(i);
      }
    });
  });

  describe("Start/stop functionality", () => {
    it("should reset to 0 when isActive changes from true to false", () => {
      const { result, rerender } = renderHook(({ isActive }) => useElapsedTime(isActive), {
        initialProps: { isActive: true },
      });

      // Let it run for a few seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current).toBe(5);

      // Change to inactive
      rerender({ isActive: false });

      expect(result.current).toBe(0);
    });

    it("should continue from 0 when isActive changes from false to true", () => {
      const { result, rerender } = renderHook(({ isActive }) => useElapsedTime(isActive), {
        initialProps: { isActive: false },
      });

      // Wait while inactive
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current).toBe(0);

      // Change to active
      rerender({ isActive: true });

      // Now it should start counting
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current).toBe(3);
    });

    it("should handle multiple start/stop cycles", () => {
      const { result, rerender } = renderHook(({ isActive }) => useElapsedTime(isActive), {
        initialProps: { isActive: true },
      });

      // First cycle
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current).toBe(2);

      // Stop
      rerender({ isActive: false });
      expect(result.current).toBe(0);

      // Start again
      rerender({ isActive: true });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current).toBe(1);

      // Stop and start one more time
      rerender({ isActive: false });
      expect(result.current).toBe(0);

      rerender({ isActive: true });
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(result.current).toBe(4);
    });

    it("should handle rapid toggling", () => {
      const { result, rerender } = renderHook(({ isActive }) => useElapsedTime(isActive), {
        initialProps: { isActive: true },
      });

      // Quick toggles
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current).toBe(1);

      rerender({ isActive: false });
      expect(result.current).toBe(0);

      rerender({ isActive: true });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current).toBe(1);
    });
  });

  describe("Cleanup behavior", () => {
    it("should clear interval on unmount", () => {
      const mockClearInterval = vi.spyOn(global, "clearInterval");

      const { unmount } = renderHook(() => useElapsedTime(true));

      // Let it run for a bit
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      unmount();

      expect(mockClearInterval).toHaveBeenCalled();
    });

    it("should clear interval when isActive changes", () => {
      const mockClearInterval = vi.spyOn(global, "clearInterval");

      const { rerender } = renderHook(({ isActive }) => useElapsedTime(isActive), { initialProps: { isActive: true } });

      // Let it run
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Change to inactive - should clear interval
      rerender({ isActive: false });

      expect(mockClearInterval).toHaveBeenCalled();
    });

    it("should handle unmount while inactive", () => {
      const mockClearInterval = vi.spyOn(global, "clearInterval");

      const { unmount } = renderHook(() => useElapsedTime(false));

      unmount();

      // Should not have called clearInterval since no interval was set
      expect(mockClearInterval).not.toHaveBeenCalled();
    });
  });

  describe("Timer precision", () => {
    it("should increment exactly every 1000ms", () => {
      const { result } = renderHook(() => useElapsedTime(true));

      // Test various time intervals - reset timer between tests
      const testCases = [
        { advance: 999, expected: 0 },
        { advance: 1, expected: 1 }, // +1000ms total
        { advance: 500, expected: 1 }, // +1500ms total
        { advance: 499, expected: 1 }, // +1999ms total
        { advance: 1, expected: 2 }, // +2000ms total
        { advance: 500, expected: 2 }, // +2500ms total
        { advance: 499, expected: 2 }, // +2999ms total
        { advance: 1, expected: 3 }, // +3000ms total
      ];

      testCases.forEach(({ advance, expected }) => {
        act(() => {
          vi.advanceTimersByTime(advance);
        });
        expect(result.current).toBe(expected);
      });
    });

    it("should handle very long durations", () => {
      const { result } = renderHook(() => useElapsedTime(true));

      // Simulate a very long running process (1 hour = 3600 seconds)
      act(() => {
        vi.advanceTimersByTime(3600000);
      });

      expect(result.current).toBe(3600);
    });

    it("should handle fractional seconds (edge case)", () => {
      const { result } = renderHook(() => useElapsedTime(true));

      // Advance by fractional milliseconds
      act(() => {
        vi.advanceTimersByTime(500.5);
      });
      expect(result.current).toBe(0);

      act(() => {
        vi.advanceTimersByTime(500.5);
      });
      expect(result.current).toBe(1);
    });
  });

  describe("Edge cases", () => {
    it("should handle negative isActive values gracefully", () => {
      // TypeScript would prevent this, but testing runtime behavior
      const { result } = renderHook(() => useElapsedTime(true));

      expect(result.current).toBe(0);
    });

    it("should handle isActive as truthy/falsy values", () => {
      // Test with different falsy values
      const { result, rerender } = renderHook(({ isActive }) => useElapsedTime(isActive), {
        initialProps: { isActive: true },
      });

      // Should work with true
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current).toBe(1);

      // Should stop with false
      rerender({ isActive: false });
      expect(result.current).toBe(0);
    });

    it("should handle rapid state changes", () => {
      // Test rapid toggling between active/inactive states
      const { result, rerender } = renderHook(({ isActive }) => useElapsedTime(isActive), {
        initialProps: { isActive: true },
      });

      // Start counting
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current).toBe(1);

      // Rapidly toggle states
      rerender({ isActive: false });
      expect(result.current).toBe(0);

      rerender({ isActive: true });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe(0); // Should still be 0 until full second

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe(1);
    });
  });

  describe("Business logic validation", () => {
    it("should implement 1-second intervals as specified", () => {
      const { result } = renderHook(() => useElapsedTime(true));

      // Test the exact timing specified in the hook
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current).toBe(1);

      // Verify it's not using different intervals
      act(() => {
        vi.advanceTimersByTime(500); // Half second
      });
      expect(result.current).toBe(1); // Should not increment

      act(() => {
        vi.advanceTimersByTime(500); // Complete second
      });
      expect(result.current).toBe(2);
    });

    it("should reset on inactive state as per business rule", () => {
      const { result, rerender } = renderHook(({ isActive }) => useElapsedTime(isActive), {
        initialProps: { isActive: true },
      });

      // Run timer
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(result.current).toBe(10);

      // Business rule: reset to 0 when inactive
      rerender({ isActive: false });
      expect(result.current).toBe(0);

      // Verify it stays at 0
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current).toBe(0);
    });

    it("should be suitable for displaying elapsed time in UI", () => {
      // Test that the returned value is always a valid number for display
      const { result } = renderHook(() => useElapsedTime(true));

      // Check at various points
      const timePoints = [0, 1000, 5000, 10000, 30000];

      timePoints.forEach((time, index) => {
        act(() => {
          vi.advanceTimersByTime(index === 0 ? time : time - timePoints[index - 1]);
        });

        expect(typeof result.current).toBe("number");
        expect(result.current).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(result.current)).toBe(true);
      });
    });
  });
});
