"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilter } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("returns object of cols and values", function () {
    const sql = sqlForPartialUpdate({
      firstName: 'Test',
      lastName: 'Tester',
      password: 'password',
      email: 'test@test.com'
    },
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      });
    expect(sql).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2, "password"=$3, "email"=$4',
      values: ['Test', 'Tester', 'password', 'test@test.com']
    });
  });

  test("returns error if data is empty", function () {
    expect(() => sqlForPartialUpdate({})).toThrow(BadRequestError);

  });
});

describe("sqlForFilter", function () {
  test("returns WHERE clause for nameLike", function () {
    const clause = sqlForFilter({ nameLike: "c1" });
    expect(clause).toEqual(`WHERE name ILIKE '%' $1 '%'`);
  });

  test("returns WHERE clause for minEmployees", function () {
    const clause = sqlForFilter({ minEmployees: 1 });
    expect(clause).toEqual(`WHERE num_employees >= $1`);
  });

  test("returns WHERE clause for maxEmployees", function () {
    const clause = sqlForFilter({ maxEmployees: 1 });
    expect(clause).toEqual(`WHERE num_employees <= $1`);
  });

  test("returns WHERE clause for multiple filters", function () {
    const clause = sqlForFilter({
      nameLike: "c1",
      minEmployees: "1",
      maxEmployees: "5"
    });
    expect(clause).toEqual(
      `WHERE name ILIKE '%' $1 '%' AND num_employees >= $2 AND num_employees <= $3`);
  });



});
