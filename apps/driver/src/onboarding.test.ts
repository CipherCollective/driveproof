import { describe, expect, it } from "vitest";
import {
  completeOnboardingTask,
  defaultOnboardingState,
  loadOnboardingState,
  onboardingProgress,
  resetOnboardingState,
  saveOnboardingState
} from "./onboarding";

function memoryStorage() {
  let value: string | null = null;
  return {
    getItem: () => value,
    setItem: (_key: string, nextValue: string) => { value = nextValue; }
  };
}

describe("onboarding state", () => {
  it("starts empty and persists local completion", () => {
    const storage = memoryStorage();
    const initial = defaultOnboardingState();
    expect(onboardingProgress(initial)).toEqual({ completed: 0, total: 4 });

    const next = completeOnboardingTask(initial, "privacy-boundary");
    saveOnboardingState(storage, { ...next, dismissed: true });

    expect(loadOnboardingState(storage)).toEqual({
      completed: {
        "connect-wallet": false,
        "privacy-boundary": true,
        "create-proof": false,
        "insurer-result": false
      },
      dismissed: true
    });
  });

  it("resets the walkthrough without touching any product client", () => {
    const reset = resetOnboardingState();
    expect(reset).toEqual(defaultOnboardingState());
    expect(onboardingProgress(reset)).toEqual({ completed: 0, total: 4 });
  });

  it("ignores malformed browser storage", () => {
    const storage = { getItem: () => "not-json" };
    expect(loadOnboardingState(storage)).toEqual(defaultOnboardingState());
  });
});
