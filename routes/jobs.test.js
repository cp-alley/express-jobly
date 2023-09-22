"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/********************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New",
    salary: 45000,
    equity: 0,
    companyHandle: "c1"
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "New",
        salary: 45000,
        equity: "0",
        companyHandle: "c1"
      }
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 100000,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "New",
        salary: "35k",
        equity: "1%",
        companyHandle: "c1"
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/****************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
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
          },
        ],
    });
  });

  test("works with search filter", async function () {
    const resp = await request(app).get("/jobs?title=j&minSalary=20000");
    expect(resp.body).toEqual({
      jobs:
        [
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
          },
        ],
    });
  });

  test("bad request for incorrect search filter", async function () {
    const resp = await request(app).get("/jobs?hasEquity=0.5");
    expect(resp.statusCode).toEqual(400);
  });
});

/********************************* GET /jobs/:id */

describe("GET /jobs/:id", function () {
  let testId;
  beforeEach(async function () {
    const idResp = await request(app).get("/jobs");
    testId = idResp.body.jobs[0].id;
  });

  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testId}`);
    expect(resp.body).toEqual({
      job: {
        id: testId,
        title: "j1",
        salary: 10000,
        equity: "0",
        company: {
          handle: "c1",
          name: "C1"
        }
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/11111111`);
    expect(resp.statusCode).toEqual(404);
  });
});

/*************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  let testId;
  beforeEach(async function () {
    const idResp = await request(app).get("/jobs");
    testId = idResp.body.jobs[0].id;
  });

  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testId}`)
      .send({
        title: "j1-update",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: testId,
        title: "j1-update",
        salary: 10000,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testId}`)
      .send({
        title: "j1-update",
      })
      .set("authorization", `Bearer ${u1Token}`);;
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testId}`)
      .send({
        title: "j1-update",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/jobs/11111111`)
      .send({
        title: "nope nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testId}`)
      .send({
        companyHandle: "j1-new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testId}`)
      .send({
        salary: "350k",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/**************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:handle", function () {
  let testId;
  beforeEach(async function () {
    const idResp = await request(app).get("/jobs");
    testId = idResp.body.jobs[0].id;
  });

  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testId}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${testId}` });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testId}`)
      .set("authorization", `Bearer ${u1Token}`);;
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testId}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/1111111`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});