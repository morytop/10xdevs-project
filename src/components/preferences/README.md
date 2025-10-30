# Preferences Components

Komponenty React dla formularza preferencji użytkownika (onboarding).

## Struktura

```
preferences/
├── PreferencesForm.tsx          # Główny komponent formularza
├── FormSection.tsx              # Wrapper dla sekcji formularza
├── HealthGoalSelect.tsx         # Dropdown - cel zdrowotny
├── DietTypeSelect.tsx           # Dropdown - typ diety
├── ActivityLevelSelect.tsx      # Dropdown - poziom aktywności
├── AllergyCheckboxGroup.tsx     # Checkboxy - alergie (max 10)
├── ProductCombobox.tsx          # Autocomplete - produkty (max 20)
├── ProductBadge.tsx             # Badge dla wybranego produktu
├── StickyFormFooter.tsx         # Sticky footer z przyciskiem submit
└── DraftRestoreModal.tsx        # Modal dla draft restoration
```

## Użycie

```astro
---
import { PreferencesForm } from "@/components/preferences/PreferencesForm";
---

<PreferencesForm client:load />
```

## Funkcje

- ✅ Walidacja w czasie rzeczywistym (Zod + React Hook Form)
- ✅ Auto-save do localStorage (debounce 2s)
- ✅ Draft restoration z modalem
- ✅ Fuzzy search dla produktów (Fuse.js)
- ✅ Limity: 10 alergii, 20 produktów
- ✅ Accessibility (ARIA attributes)
- ✅ Toast notifications (Sonner)
- ✅ Responsive design

## Dependencies

- react-hook-form
- @hookform/resolvers
- zod
- fuse.js
- lodash-es
- sonner
- lucide-react
- @radix-ui (via shadcn/ui)

