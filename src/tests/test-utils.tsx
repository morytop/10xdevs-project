import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { vi } from "vitest";
import { ToasterProvider } from "@/components/ToasterProvider";

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ToasterProvider>{children}</ToasterProvider>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };

// Custom test utilities
export const createMockFunction = <T extends (...args: unknown[]) => unknown>(implementation?: T) => {
  return implementation ? vi.fn(implementation) : vi.fn();
};

export const createMockObject = <T extends Record<string, unknown>>(overrides: Partial<T> = {}): T => {
  return overrides as T;
};
