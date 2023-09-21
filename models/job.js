"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Related functions for jobs. */
//TODO: create, findAll, get, update, delete

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

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   */

  static async findAll() {
    const jobsRes = await db.query(`
    SELECT id, title, salary, equity, company_handle AS "companyHandle"
    FROM jobs
    ORDER BY title`);

    return jobsRes.rows;
  }

  /** Given a job id, return data about that job.
   *
   * Returns { id, title, salary, equity, company }
   *   where company is { handle, name }
   *
   * Throws NotFoundError if not found.
   */

  static async get(id) {
    const jobRes = await db.query(`
    SELECT j.id, j.title, j.salary, j.equity, c.handle, c.name
        FROM jobs AS j
            JOIN companies AS c ON j.company_handle = c.handle
        WHERE j.id = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id ${id}`);

    return {
      id: job.id,
      title: job.title,
      salary: job.salary,
      equity: job.equity,
      company: {
        handle: job.handle,
        name: job.name
      }
    };
  }
}

module.exports = Job;
