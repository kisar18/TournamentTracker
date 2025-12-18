/**
 * Database helper utilities for SQL result parsing
 */

/**
 * Convert SQL result to array of objects
 * @param {Object} result - SQL.js exec() result
 * @returns {Array} Array of objects with column names as keys
 */
export function rowsToObjects(result) {
  if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
}

/**
 * Convert SQL result to single object
 * @param {Object} result - SQL.js exec() result
 * @returns {Object|null} Single object or null if not found
 */
export function rowToObject(result) {
  if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const obj = {};
  columns.forEach((col, index) => {
    obj[col] = values[index];
  });
  return obj;
}

/**
 * Get single value from SQL result
 * @param {Object} result - SQL.js exec() result
 * @param {*} defaultValue - Default value if not found
 * @returns {*} The first column of first row or default value
 */
export function getSingleValue(result, defaultValue = null) {
  if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) {
    return defaultValue;
  }
  return result[0].values[0][0];
}
