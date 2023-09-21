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

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const idResult = await db.query(`
    SELECT id FROM jobs WHERE title = 'j1'`);
    const id = idResult.rows[0].id;

    let job = await Job.get(id);
    expect(job).toEqual({
      id: id,
      title: "j1",
      salary: 10000,
      equity: "0",
      company: {
        handle: "c1",
        name: "C1"
      }
    });
  });

  test("not found if job id doesn't exist", async function () {
    try {
      await Job.get(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.message).toEqual("No job with id -1");
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "Updated",
    salary: 50000,
    equity: 0.001
  };

  test("works", async function () {
    const idResult = await db.query(`
    SELECT id FROM jobs WHERE title = 'j1'`);
    const id = idResult.rows[0].id;

    let job = await Job.update(id, updateData);
    expect(job).toEqual({
      id: id,
      companyHandle: "c1",
      title: "Updated",
      salary: 50000,
      equity: "0.001",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,
      [id]);
    expect(result.rows).toEqual([{
      id: id,
      title: "Updated",
      salary: 50000,
      equity: "0.001",
      company_handle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const idResult = await db.query(`
    SELECT id FROM jobs WHERE title = 'j1'`);
    const id = idResult.rows[0].id;

    let job = await Job.update(id, {
      title: "Updated",
      salary: null,
      equity: null
    });
    expect(job).toEqual({
      id: id,
      companyHandle: "c1",
      title: "Updated",
      salary: null,
      equity: null,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,
      [id]);
    expect(result.rows).toEqual([{
      id: id,
      title: "Updated",
      salary: null,
      equity: null,
      company_handle: "c1"
    }]);
  });

  test("not found if no such job id", async function () {
    try {
      await Job.update(-1, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy;
      expect(err.message).toEqual("No job with id -1");
    }
  });

  test("bad request with no data", async function () {
    const idResult = await db.query(`
    SELECT id FROM jobs WHERE title = 'j1'`);
    const id = idResult.rows[0].id;

    try {
      await Job.update(id, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy;
    }
  });
});

/************************************************ remove */

describe("remove", function () {
  test("works", async function () {
    const idResult = await db.query(`
    SELECT id FROM jobs WHERE title = 'j1'`);
    const id = idResult.rows[0].id;

    await Job.remove(id);
    const res = await db.query(
      `SELECT title FROM jobs WHERE id = $1`, [id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.message).toEqual("No job with id -1");
    }
  });
});