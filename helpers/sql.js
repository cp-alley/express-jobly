"use strict";

const { BadRequestError } = require("../expressError");

/**
 * Accepts: dataToUpdate, object like { columnName: dataToUpdate,...} and
 *
 * jsToSql, object like { jsColName: SQL_column_name,...}
 *
 * Returns: { setCols, values } where
 *
 * setCols is a comma separated string of SQL column names and
 * parameterized query values like '"first_name"=$1, ...'
 *
 * values is an array of values for each of those columns
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Accepts filter object with any or all properties:
 * nameLike, minEmployees, maxEmployees
 *
 * Returns SQL WHERE clause to filter those properties
 * with parameterized query placeholders.
 */
function sqlForFilter(filter) {
  let whereClause = []
  const keys = Object.keys(filter);
  keys.map((key, index) => {
    if (key==="nameLike") {
      whereClause.push(`name ILIKE '%' || $${index+1} || '%'`)
    } else if (key==="minEmployees") {
      whereClause.push(`num_employees >= $${index+1}`)
    } else {
      whereClause.push(`num_employees <= $${index+1}`)
    }
  });

  return `WHERE ${whereClause.join(' AND ')}`
}

module.exports = { sqlForPartialUpdate, sqlForFilter };
