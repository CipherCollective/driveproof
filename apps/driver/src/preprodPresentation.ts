/**
 * A confirmed deployment is the source of truth for the user-facing stage.
 * Runtime instrumentation may report an intermediate indexer stage after the
 * transaction has already been returned; it must not make the UI look stale.
 */
export function deploymentStageLabel(
  confirmed: boolean,
  failureStage: string | undefined,
  currentStage: string
): string {
  if (failureStage) return `FAILED AT: ${failureStage}`;
  if (confirmed) return "CONFIRMED ON PREPROD";
  return currentStage;
}
