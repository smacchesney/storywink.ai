// Purpose: Provide a CommonJS entry point for styleLibrary functions using dynamic import

// Use a dynamic import() to load the ESM module.
async function loadStyleLibrary() {
  try {
    // Dynamically import the ESM module using the alias
    // Ensure your runtime environment (Node/ts-node/bundler) can resolve '@/'
    const esmModule = await import('@/lib/ai/styleLibrary');
    // The imported module namespace object contains all named exports
    return esmModule;
  } catch (err) {
    console.error("Failed to dynamically import styleLibrary in CJS wrapper:", err);
    // Decide how to handle failure: re-throw, return empty, etc.
    // Returning {} might match the previous behavior on failure.
    return {};
  }
}

// Export a promise that resolves with the module's exports
module.exports = loadStyleLibrary(); 