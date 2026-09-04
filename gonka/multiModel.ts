export interface ModelExecutionResult<T> {
  success: boolean;
  model: string;
  result?: T;
  error?: string;
}

export interface MultiModelResult<T> {
  results: ModelExecutionResult<T>[];
}

export type ModelExecutor<T> = (
  model: string,
) => Promise<T>;

export async function runAcrossModels<T>(
  models: string[],
  executor: ModelExecutor<T>,
): Promise<MultiModelResult<T>> {
  console.log("\n=== MULTI-MODEL VERIFICATION ===");

  console.log(
    `Running ${models.length} models in parallel...\n`,
  );

  const executionPromises = models.map(
    async (
      model,
    ): Promise<ModelExecutionResult<T>> => {
      console.log(`Running ${model}...`);

      try {
        const result = await executor(model);

        console.log(
          `Received response from ${model}`,
        );

        return {
          success: true,
          model,
          result,
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          `Model ${model} failed: ${message}`,
        );

        return {
          success: false,
          model,
          error: message,
        };
      }
    },
  );

  const results =
    await Promise.all(executionPromises);

  return {
    results,
  };
}