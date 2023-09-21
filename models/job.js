"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company handle doesn't exist
   *
   * */
  static async create({ title, salary, equity, companyHandle }) {

    const handleCheck = await db.query(`
      SELECT handle
      FROM companies
      WHERE handle = $1`,
      [companyHandle]);

    if (handleCheck.rows.length === 0)
      throw new BadRequestError(`No such handle: ${companyHandle}`);

    const result = await db.query(`
      INSERT INTO jobs (title, salary, equity, company_handle)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }
}

module.exports = Job;
