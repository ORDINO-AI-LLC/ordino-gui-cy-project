/**
 * Generic JSON data loader.
 * Reads a JSON file from src/data/ and returns typed data.
 * Uses in-memory cache to avoid re-reading files.
 *
 * In Cypress, test code runs in the browser where Node fs is unavailable.
 * We use require() which webpack resolves at bundle time.
 */
export class DataLoader {
  private static cache = new Map<string, unknown>();

  /**
   * Load a JSON file relative to src/data/ and cast to T.
   * @param featurePath - e.g., 'login/users' resolves to src/data/login/users.json
   */
  static load<T>(featurePath: string): T {
    if (this.cache.has(featurePath)) {
      return this.cache.get(featurePath) as T;
    }

    let data: T;
    try {
      // Webpack resolves require() at bundle time — no Node fs needed at runtime.
      // The path is relative from this file (src/config/data/loaders/) to src/data/.
      data = require(`../../../data/${featurePath}.json`) as T;
    } catch {
      throw new Error(
        `Test data file not found: src/data/${featurePath}.json. ` +
        `Create the JSON file at src/data/${featurePath}.json`
      );
    }

    this.cache.set(featurePath, data);
    return data;
  }

  /** Clear cache — useful if tests modify data files at runtime. */
  static clearCache(): void {
    this.cache.clear();
  }
}
