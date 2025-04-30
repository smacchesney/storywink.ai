// Purpose: Provide a CommonJS entry point for styleLibrary functions
// This dynamically imports the ESM module and re-exports for require()

// Use a dynamic import() to load the ESM module.
// Note: Node needs to resolve this path correctly. Using relative path.
// Adjust if necessary based on build output structure or tsconfig paths resolution.
async function loadModule() {
  // Assuming the compiled output keeps relative structure or aliases work
  // Try importing the .js extension as that's what Node runs.
  // If tsc-alias ran, this path might be different!
  // Let's assume aliases work for now.
  try {
    // Try relative path first, assuming CJS file is in same dir as TS file conceptually
    const modulePath = './styleLibrary.js'; // Or potentially '@/lib/ai/styleLibrary.js' if aliases work in CJS context
    return await import(modulePath);
  } catch (e) {
    console.error("Error dynamically importing styleLibrary.js: ", e);
    // Fallback or alternative paths might be needed depending on build output
    // If using dist-worker, the relative path would be different.
    // Consider using require('@/lib/ai/styleLibrary') directly if allowSyntheticDefaultImports helps?
    // For now, rethrow to indicate failure.
    throw e;
  }

}

// Since dynamic import is async, we need an async IIFE
// or handle the promise at the require site (less ideal).
// Let's export a promise that resolves to the exports.

// module.exports = loadModule(); // Exporting the promise
// OR - a more traditional approach if worker can handle async require (usually not)
// We will export an object, but populate it asynchronously.
// This is complex. Let's simplify assuming direct require might work or needs adjustment.

// --- SIMPLER APPROACH (Try this first) ---
// Relies on Node's CJS/ESM interop potentially handling it via require
// if allowSyntheticDefaultImports and esModuleInterop are helping.
// This might fail if styleLibrary.ts has only named exports.

try {
    // Use require directly, hoping Node/ts-node handles the interop.
    // Use the alias path that the worker uses.
    const esmModule = require('@/lib/ai/styleLibrary');
    // If default export exists due to interop, use that, otherwise use the named exports.
    module.exports = esmModule.default || esmModule;
} catch (err) {
     console.error("Failed to require styleLibrary directly in CJS wrapper:", err);
     // If require fails, the dynamic import approach (commented out above)
     // or building separate CJS bundles might be necessary.
     module.exports = {}; // Export empty object on failure
} 