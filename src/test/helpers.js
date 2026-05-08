/**
 * Returns a unique name string for test entities.
 * Avoids collisions when tests run concurrently or are repeated.
 *
 * @param {string} prefix - Short label to identify the entity type (e.g. 'movie', 'actor')
 * @returns {string}
 */
export function uniqueName(prefix = 'test') {
    const rand = Math.random().toString(36).slice(2, 7);
    return `${prefix}_${Date.now()}_${rand}`;
}

/**
 * Simple assertion helper that logs pass/fail and throws on failure.
 *
 * @param {boolean} condition
 * @param {string}  message
 */
export function assert(condition, message) {
    if (!condition) {
        throw new Error(`FAIL: ${message}`);
    }
    console.log(`  ✓ ${message}`);
}

/**
 * Runs a named test block and catches/reports errors without aborting the suite.
 *
 * @param {string}            name
 * @param {() => Promise<void>} fn
 */
export async function test(name, fn) {
    try {
        await fn();
        console.log(`[PASS] ${name}`);
    } catch (err) {
        console.error(`[FAIL] ${name}: ${err.message}`);
        process.exitCode = 1;
    }
}
