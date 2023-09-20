"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

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
