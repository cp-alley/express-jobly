"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
// const jobFilterSchema = require("../schemas/jobFilter.json");
// const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } => { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { job: { id, title, salary, equity, companyHandle }}
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body)
  return res.status(201).json({ job })
});

module.exports = router;