# Custom Hooks Unit Tests

Kompleksowy zestaw testów jednostkowych dla custom hooks aplikacji AI Meal Planner.

## Testowana Funkcjonalność

### 🎯 `useDirtyForm`
**Hook do wykrywania zmian w formularzach**

**Testowane scenariusze:**
- ✅ Porównywanie prostych pól (health_goal, diet_type, activity_level)
- ✅ Obsługa tablic z sortowaniem (allergies, disliked_products)
- ✅ Obsługa wartości null/undefined
- ✅ Walidacja reguły biznesowej (sortowanie przed porównaniem)
- ✅ Edge cases (puste tablice, specjalne znaki)

**Dlaczego testować:**
- Krytyczny dla UX - zapobiega utracie danych
- Złożona logika porównywania deep equality
- Używany w kluczowych formularzach

---

### ⏱️ `useAutoSave`
**Hook do automatycznego zapisywania danych**

**Testowane scenariusze:**
- ✅ Debouncing (2-sekundowe opóźnienie)
- ✅ localStorage integracja
- ✅ Cleanup przy zmianach danych
- ✅ Obsługa błędów localStorage
- ✅ Włączanie/wyłączanie auto-save
- ✅ Anulowanie debounce przy nowych zmianach

**Dlaczego testować:**
- Async behavior trudne do przetestowania manualnie
- localStorage może być niedostępny
- Krytyczny dla user experience

---

### 📝 `useDraftRestore`
**Hook do przywracania szkiców formularzy**

**Testowane scenariusze:**
- ✅ Ładowanie danych przy mount
- ✅ Obsługa błędów JSON.parse
- ✅ Zarządzanie stanem modala
- ✅ Funkcje loadDraft/clearDraft
- ✅ Walidacja integralności danych
- ✅ Obsługa corrupted data

**Dlaczego testować:**
- localStorage może zawierać błędne dane
- Krytyczny dla recovery po crashes
- Złożona logika error handling

---

### ⏰ `useElapsedTime`
**Hook do śledzenia czasu generowania**

**Testowane scenariusze:**
- ✅ Timer behavior (1-sekundowe interwały)
- ✅ Start/stop funkcjonalność
- ✅ Cleanup przy unmount
- ✅ Reset przy zmianie stanu
- ✅ Wielokrotne cykle start/stop
- ✅ Długie czasy trwania

**Dlaczego testować:**
- Timer logic podatna na błędy
- Używana w UI feedback (modal generowania)
- Cleanup critical dla performance

## Architektura Testów

### 🧩 Test Structure Pattern
```typescript
describe("HookName", () => {
  describe("Specific Feature", () => {
    it("should handle normal case", () => { ... });
    it("should handle edge case", () => { ... });
    it("should handle error case", () => { ... });
  });
});
```

### 🛠️ Testing Stack
- **Vitest** - nowoczesny test runner
- **React Testing Library** - testowanie hooks
- **jsdom** - DOM environment
- **Custom mocks** - localStorage, lodash debounce

### 🎭 Mock Strategy
```typescript
// localStorage mock
vi.stubGlobal("localStorage", {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

// lodash debounce mock
vi.mock("lodash-es", () => ({
  debounce: vi.fn((fn) => {
    // Custom debounce implementation for testing
  }),
}));
```

## Uruchamianie Testów

```bash
# Wszystkie testy
npm test

# Tryb watch
npm run test:watch

# UI mode (wizualny interfejs)
npm run test:ui
```

## Pokrycie Testami

```
✅ 100 testów przechodzi
✅ Wszystkie warunki brzegowe pokryte
✅ Business logic zwalidowana
✅ Error handling przetestowany
```

## Zasady Testowania

### 📋 Arrange-Act-Assert Pattern
```typescript
it("should handle scenario", () => {
  // Arrange - setup
  const mockData = createTestData();

  // Act - execute
  const { result } = renderHook(() => useHook(mockData));

  // Assert - verify
  expect(result.current).toBe(expected);
});
```

### 🎯 Test Categories
1. **Happy Path** - normalne przypadki użycia
2. **Edge Cases** - graniczne wartości
3. **Error Cases** - obsługa błędów
4. **Business Rules** - walidacja logiki biznesowej

### 🔧 Mock Best Practices
- **Minimal mocks** - tylko niezbędne zależności
- **Typed mocks** - zachowaj oryginalne typy
- **Cleanup** - przywracaj oryginalne implementacje

## Przykład Test Case

```typescript
describe("useDirtyForm", () => {
  it("should detect health_goal changes", () => {
    const initialData = createMockFormData({ health_goal: "WEIGHT_LOSS" });
    const currentData = createMockFormData({ health_goal: "MUSCLE_GAIN" });

    const { result } = renderHook(() =>
      useDirtyForm(initialData, currentData)
    );

    expect(result.current).toBe(true);
  });
});
```

## Zalecenia Rozwojowe

1. **Dodaj coverage reporting** - skonfiguruj `@vitest/coverage-v8`
2. **Testy integracyjne** - testuj hooks z komponentami
3. **Visual testing** - dla hooków wpływających na UI
4. **Performance testing** - dla hooks z timerami

---

*Testy zapewniają niezawodność krytycznej logiki biznesowej aplikacji.*
