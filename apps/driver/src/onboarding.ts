export const ONBOARDING_STORAGE_KEY = "driveproof:onboarding:v1";

export const onboardingTaskIds = [
  "connect-wallet",
  "privacy-boundary",
  "create-proof",
  "insurer-result"
] as const;

export type OnboardingTaskId = (typeof onboardingTaskIds)[number];

export type OnboardingState = {
  completed: Record<OnboardingTaskId, boolean>;
  dismissed: boolean;
};

function emptyCompletion(): Record<OnboardingTaskId, boolean> {
  return {
    "connect-wallet": false,
    "privacy-boundary": false,
    "create-proof": false,
    "insurer-result": false
  };
}

export function defaultOnboardingState(): OnboardingState {
  return { completed: emptyCompletion(), dismissed: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function loadOnboardingState(storage?: Pick<Storage, "getItem">): OnboardingState {
  if (!storage) return defaultOnboardingState();

  try {
    const raw = storage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return defaultOnboardingState();

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaultOnboardingState();

    const storedCompletion = isRecord(parsed.completed) ? parsed.completed : {};
    const completed = emptyCompletion();
    for (const taskId of onboardingTaskIds) {
      completed[taskId] = storedCompletion[taskId] === true;
    }

    return {
      completed,
      dismissed: parsed.dismissed === true
    };
  } catch {
    return defaultOnboardingState();
  }
}

export function saveOnboardingState(storage: Pick<Storage, "setItem"> | undefined, state: OnboardingState): void {
  if (!storage) return;
  try {
    storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local onboarding is an enhancement. A storage failure must not affect the product flow.
  }
}

export function completeOnboardingTask(state: OnboardingState, taskId: OnboardingTaskId): OnboardingState {
  return {
    ...state,
    completed: { ...state.completed, [taskId]: true }
  };
}

export function resetOnboardingState(): OnboardingState {
  return defaultOnboardingState();
}

export function onboardingProgress(state: OnboardingState): { completed: number; total: number } {
  return {
    completed: onboardingTaskIds.filter((taskId) => state.completed[taskId]).length,
    total: onboardingTaskIds.length
  };
}
