"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");
const Company = require("./company");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************ create */

describe("create", function () {
  const newJob = {
    title: "New",
    salary: 60000,
    equity: 0,
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New",
      salary: 60000,
      equity: "0",
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'New'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "New",
        salary: 60000,
        equity: "0",
        company_handle: "c1"
      }
    ]);
  });

  test("bad request with company handle not in db", async function () {
    let amazingJob = {
      title: "Underwater basket weaver",
      salary: 1000000000,
      equity: 0.10,
      companyHandle: "mega-corp"
    };

    try {
      await Job.create(amazingJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(err.message).toEqual("No such handle: mega-corp");
    }
  });
});

/***************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 10000,
        equity: "0",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: "0",
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 30000,
        equity: "0",
        companyHandle: "c3"
      }
    ]);
  });
});