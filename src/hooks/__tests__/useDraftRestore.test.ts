import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraftRestore } from "../useDraftRestore";
import type { PreferencesFormData } from "@/lib/viewmodels/preferences.viewmodel";

describe("useDraftRestore", () => {
  const DRAFT_KEY = "preferences-draft";

  let mockLocalStorage: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        mockLocalStorage[key] = undefined;
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial state", () => {
    it("should return correct initial state when no draft exists", () => {
      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toBeNull();
      expect(result.current.showModal).toBe(false);
      expect(typeof result.current.loadDraft).toBe("function");
      expect(typeof result.current.clearDraft).toBe("function");
    });

    it("should load draft from localStorage on mount", () => {
      const mockDraft: PreferencesFormData = {
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        activity_level: 3,
        allergies: ["nuts"],
        disliked_products: ["broccoli"],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(mockDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toEqual(mockDraft);
      expect(result.current.showModal).toBe(true);
    });

    it("should handle invalid JSON in localStorage gracefully", () => {
      mockLocalStorage[DRAFT_KEY] = "invalid json";

      // Should not throw
      expect(() => {
        renderHook(() => useDraftRestore());
      }).not.toThrow();
    });

    it("should handle corrupted JSON data gracefully", () => {
      mockLocalStorage[DRAFT_KEY] = '{"invalid": json}';

      expect(() => {
        renderHook(() => useDraftRestore());
      }).not.toThrow();
    });

    it("should handle localStorage errors gracefully", () => {
      const mockGetItem = vi.fn(() => {
        throw new Error("Storage access denied");
      });
      vi.stubGlobal("localStorage", {
        ...localStorage,
        getItem: mockGetItem,
      });

      expect(() => {
        renderHook(() => useDraftRestore());
      }).not.toThrow();

      expect(mockGetItem).toHaveBeenCalledWith(DRAFT_KEY);
    });
  });

  describe("loadDraft function", () => {
    it("should hide modal and return draft data", () => {
      const mockDraft: PreferencesFormData = {
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        activity_level: 3,
        allergies: [],
        disliked_products: [],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(mockDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.showModal).toBe(true);

      let returnedDraft: PreferencesFormData | null = null;
      act(() => {
        returnedDraft = result.current.loadDraft();
      });

      expect(result.current.showModal).toBe(false);
      expect(returnedDraft).toEqual(mockDraft);
    });

    it("should return null when no draft exists", () => {
      const { result } = renderHook(() => useDraftRestore());

      let returnedDraft: PreferencesFormData | null = null;
      act(() => {
        returnedDraft = result.current.loadDraft();
      });

      expect(returnedDraft).toBeNull();
    });

    it("should keep draft data after loading", () => {
      const mockDraft: PreferencesFormData = {
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        activity_level: 3,
        allergies: [],
        disliked_products: [],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(mockDraft);

      const { result } = renderHook(() => useDraftRestore());

      act(() => {
        result.current.loadDraft();
      });

      // Draft should still be available
      expect(result.current.draft).toEqual(mockDraft);
    });
  });

  describe("clearDraft function", () => {
    it("should remove draft from localStorage", () => {
      mockLocalStorage[DRAFT_KEY] = JSON.stringify({ test: "data" });

      const { result } = renderHook(() => useDraftRestore());

      act(() => {
        result.current.clearDraft();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith(DRAFT_KEY);
    });

    it("should reset hook state", () => {
      const mockDraft: PreferencesFormData = {
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        activity_level: 3,
        allergies: [],
        disliked_products: [],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(mockDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toEqual(mockDraft);
      expect(result.current.showModal).toBe(true);

      act(() => {
        result.current.clearDraft();
      });

      expect(result.current.draft).toBeNull();
      expect(result.current.showModal).toBe(false);
    });

    it("should handle localStorage removeItem errors gracefully", () => {
      const mockRemoveItem = vi.fn(() => {
        throw new Error("Storage error");
      });
      vi.stubGlobal("localStorage", {
        ...localStorage,
        removeItem: mockRemoveItem,
      });

      const { result } = renderHook(() => useDraftRestore());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.clearDraft();
        });
      }).not.toThrow();

      expect(mockRemoveItem).toHaveBeenCalledWith(DRAFT_KEY);
    });
  });

  describe("Modal state management", () => {
    it("should show modal when draft exists on mount", () => {
      const mockDraft: PreferencesFormData = {
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        activity_level: 3,
        allergies: [],
        disliked_products: [],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(mockDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.showModal).toBe(true);
    });

    it("should not show modal when no draft exists", () => {
      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.showModal).toBe(false);
    });

    it("should not show modal when draft loading fails", () => {
      mockLocalStorage[DRAFT_KEY] = "invalid json";

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.showModal).toBe(false);
      expect(result.current.draft).toBeNull();
    });

    it("should hide modal after loadDraft", () => {
      const mockDraft: PreferencesFormData = {
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        activity_level: 3,
        allergies: [],
        disliked_products: [],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(mockDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.showModal).toBe(true);

      act(() => {
        result.current.loadDraft();
      });

      expect(result.current.showModal).toBe(false);
    });

    it("should hide modal after clearDraft", () => {
      const mockDraft: PreferencesFormData = {
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        activity_level: 3,
        allergies: [],
        disliked_products: [],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(mockDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.showModal).toBe(true);

      act(() => {
        result.current.clearDraft();
      });

      expect(result.current.showModal).toBe(false);
    });
  });

  describe("Data integrity", () => {
    it("should handle valid PreferencesFormData structure", () => {
      const validDraft: PreferencesFormData = {
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        activity_level: 3,
        allergies: ["nuts", "dairy"],
        disliked_products: ["broccoli", "spinach"],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(validDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toEqual(validDraft);
      expect(result.current.showModal).toBe(true);
    });

    it("should handle partial data", () => {
      const partialDraft = {
        health_goal: "LOSE_WEIGHT",
        // Missing other required fields
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(partialDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toEqual(partialDraft);
      expect(result.current.showModal).toBe(true);
    });

    it("should handle empty object", () => {
      const emptyDraft = {};

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(emptyDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toEqual(emptyDraft);
      expect(result.current.showModal).toBe(true);
    });

    it("should handle null values in draft", () => {
      const draftWithNulls = {
        health_goal: "LOSE_WEIGHT",
        diet_type: null,
        activity_level: 3,
        allergies: null,
        disliked_products: [],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(draftWithNulls);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toEqual(draftWithNulls);
    });

    it("should handle arrays with special characters", () => {
      const draftWithSpecialChars = {
        health_goal: "LOSE_WEIGHT",
        diet_type: "STANDARD",
        activity_level: 3,
        allergies: ["café", "naïve", "测试"],
        disliked_products: ["brócolis", "espinacas"],
      };

      mockLocalStorage[DRAFT_KEY] = JSON.stringify(draftWithSpecialChars);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toEqual(draftWithSpecialChars);
    });
  });

  describe("Error resilience", () => {
    it("should handle JSON parse errors without crashing", () => {
      const invalidJsonStrings = ["{invalid json}", '{"unclosed": "string}', "null pointer", "", "undefined", "NaN"];

      invalidJsonStrings.forEach((invalidJson) => {
        mockLocalStorage[DRAFT_KEY] = invalidJson;

        expect(() => {
          renderHook(() => useDraftRestore());
        }).not.toThrow();
      });
    });

    it("should handle localStorage quota exceeded on read", () => {
      const mockGetItem = vi.fn(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });
      vi.stubGlobal("localStorage", {
        ...localStorage,
        getItem: mockGetItem,
      });

      expect(() => {
        renderHook(() => useDraftRestore());
      }).not.toThrow();
    });

    it("should handle localStorage access denied", () => {
      const mockGetItem = vi.fn(() => {
        throw new DOMException("Access denied", "SecurityError");
      });
      vi.stubGlobal("localStorage", {
        ...localStorage,
        getItem: mockGetItem,
      });

      expect(() => {
        renderHook(() => useDraftRestore());
      }).not.toThrow();
    });

    it("should recover from corrupted data by not showing modal", () => {
      mockLocalStorage[DRAFT_KEY] = "corrupted data";

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toBeNull();
      expect(result.current.showModal).toBe(false);
    });
  });

  describe("Business logic validation", () => {
    it("should use correct localStorage key", () => {
      mockLocalStorage[DRAFT_KEY] = JSON.stringify({ test: "data" });

      renderHook(() => useDraftRestore());

      expect(localStorage.getItem).toHaveBeenCalledWith("preferences-draft");
    });

    it("should only attempt to load draft once on mount", () => {
      mockLocalStorage[DRAFT_KEY] = JSON.stringify({ test: "data" });

      const { rerender } = renderHook(() => useDraftRestore());

      // Re-render should not call getItem again
      rerender();

      expect(localStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it("should preserve draft data until explicitly cleared", () => {
      const mockDraft = { test: "data" };
      mockLocalStorage[DRAFT_KEY] = JSON.stringify(mockDraft);

      const { result } = renderHook(() => useDraftRestore());

      expect(result.current.draft).toEqual(mockDraft);

      // Load draft (hides modal but keeps data)
      act(() => {
        result.current.loadDraft();
      });

      expect(result.current.draft).toEqual(mockDraft);
      expect(result.current.showModal).toBe(false);

      // Only clearDraft should remove the data
      act(() => {
        result.current.clearDraft();
      });

      expect(result.current.draft).toBeNull();
    });
  });
});
