import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDirtyForm } from "../useDirtyForm";
import type { PreferencesFormData } from "@/lib/viewmodels/preferences.viewmodel";

describe("useDirtyForm", () => {
  // Test data fixtures
  const createMockFormData = (overrides: Partial<PreferencesFormData> = {}): PreferencesFormData => ({
    health_goal: "LOSE_WEIGHT",
    diet_type: "STANDARD",
    activity_level: 3,
    allergies: [],
    disliked_products: [],
    ...overrides,
  });

  describe("Initial state handling", () => {
    it("should return false when initialData is null", () => {
      const currentData = createMockFormData();
      const { result } = renderHook(() => useDirtyForm(null, currentData));

      expect(result.current).toBe(false);
    });

    it("should return false when initialData is undefined", () => {
      const currentData = createMockFormData();
      const { result } = renderHook(() => useDirtyForm(undefined, currentData));

      expect(result.current).toBe(false);
    });

    it("should return false for identical data", () => {
      const initialData = createMockFormData();
      const currentData = createMockFormData();
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });
  });

  describe("Primitive field changes", () => {
    it("should detect health_goal changes", () => {
      const initialData = createMockFormData({ health_goal: "LOSE_WEIGHT" });
      const currentData = createMockFormData({ health_goal: "GAIN_WEIGHT" });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should detect diet_type changes", () => {
      const initialData = createMockFormData({ diet_type: "STANDARD" });
      const currentData = createMockFormData({ diet_type: "VEGAN" });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should detect activity_level changes", () => {
      const initialData = createMockFormData({ activity_level: 3 });
      const currentData = createMockFormData({ activity_level: 4 });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });
  });

  describe("Array field changes - allergies", () => {
    it("should detect when allergies array is added", () => {
      const initialData = createMockFormData({ allergies: [] });
      const currentData = createMockFormData({ allergies: ["nuts"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should detect when allergies array is removed", () => {
      const initialData = createMockFormData({ allergies: ["nuts"] });
      const currentData = createMockFormData({ allergies: [] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should detect when allergies items change", () => {
      const initialData = createMockFormData({ allergies: ["nuts"] });
      const currentData = createMockFormData({ allergies: ["dairy"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should return false for identical allergies arrays", () => {
      const initialData = createMockFormData({ allergies: ["nuts", "dairy"] });
      const currentData = createMockFormData({ allergies: ["nuts", "dairy"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });

    it("should handle allergies array sorting (business rule)", () => {
      const initialData = createMockFormData({ allergies: ["nuts", "dairy", "eggs"] });
      const currentData = createMockFormData({ allergies: ["eggs", "dairy", "nuts"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      // Should be false because arrays are sorted before comparison
      expect(result.current).toBe(false);
    });

    it("should handle undefined allergies arrays", () => {
      const initialData = createMockFormData({ allergies: undefined });
      const currentData = createMockFormData({ allergies: [] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });

    it("should handle undefined allergies arrays", () => {
      const initialData = createMockFormData({ allergies: undefined });
      const currentData = createMockFormData({ allergies: [] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });
  });

  describe("Array field changes - disliked_products", () => {
    it("should detect when disliked_products array is added", () => {
      const initialData = createMockFormData({ disliked_products: [] });
      const currentData = createMockFormData({ disliked_products: ["broccoli"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should detect when disliked_products array is removed", () => {
      const initialData = createMockFormData({ disliked_products: ["broccoli"] });
      const currentData = createMockFormData({ disliked_products: [] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should detect when disliked_products items change", () => {
      const initialData = createMockFormData({ disliked_products: ["broccoli"] });
      const currentData = createMockFormData({ disliked_products: ["spinach"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should return false for identical disliked_products arrays", () => {
      const initialData = createMockFormData({ disliked_products: ["broccoli", "spinach"] });
      const currentData = createMockFormData({ disliked_products: ["broccoli", "spinach"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });

    it("should handle disliked_products array sorting (business rule)", () => {
      const initialData = createMockFormData({ disliked_products: ["broccoli", "spinach", "kale"] });
      const currentData = createMockFormData({ disliked_products: ["kale", "spinach", "broccoli"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      // Should be false because arrays are sorted before comparison
      expect(result.current).toBe(false);
    });

    it("should handle undefined disliked_products arrays", () => {
      const initialData = createMockFormData({ disliked_products: undefined });
      const currentData = createMockFormData({ disliked_products: [] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });

    it("should handle undefined disliked_products arrays", () => {
      const initialData = createMockFormData({ disliked_products: undefined });
      const currentData = createMockFormData({ disliked_products: [] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });
  });

  describe("Complex changes - multiple fields", () => {
    it("should detect changes in multiple fields", () => {
      const initialData = createMockFormData({
        health_goal: "LOSE_WEIGHT",
        allergies: ["nuts"],
      });
      const currentData = createMockFormData({
        health_goal: "GAIN_WEIGHT",
        allergies: ["nuts", "dairy"],
      });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should return false when multiple fields change back to original values", () => {
      const initialData = createMockFormData({
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        allergies: ["nuts"],
      });
      const currentData = createMockFormData({
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        allergies: ["nuts"],
      });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty strings in arrays", () => {
      const initialData = createMockFormData({ allergies: [""] });
      const currentData = createMockFormData({ allergies: [] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should handle duplicate items in arrays", () => {
      const initialData = createMockFormData({ allergies: ["nuts", "nuts"] });
      const currentData = createMockFormData({ allergies: ["nuts"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(true);
    });

    it("should handle special characters in array items", () => {
      const initialData = createMockFormData({ allergies: ["café", "naïve"] });
      const currentData = createMockFormData({ allergies: ["café", "naïve"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });

    it("should handle numbers and strings in arrays", () => {
      const initialData = createMockFormData({ allergies: ["nuts", "1", "test"] });
      const currentData = createMockFormData({ allergies: ["nuts", "1", "test"] });
      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });
  });

  describe("Business logic validation", () => {
    it("should correctly implement array sorting before comparison", () => {
      // This test validates the business rule about sorting arrays
      const initialData = createMockFormData({
        allergies: ["zebra", "alpha", "beta"],
        disliked_products: ["zebra", "alpha", "beta"],
      });
      const currentData = createMockFormData({
        allergies: ["beta", "alpha", "zebra"],
        disliked_products: ["beta", "alpha", "zebra"],
      });

      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      // Should be false because sorting ensures consistent comparison
      expect(result.current).toBe(false);
    });

    it("should use JSON.stringify for deep array comparison", () => {
      // Validate that the comparison method handles complex objects correctly
      const initialData = createMockFormData({
        allergies: ["a", "b"],
        disliked_products: ["x", "y"],
      });
      const currentData = createMockFormData({
        allergies: ["a", "b"],
        disliked_products: ["x", "y"],
      });

      const { result } = renderHook(() => useDirtyForm(initialData, currentData));

      expect(result.current).toBe(false);
    });
  });
});
