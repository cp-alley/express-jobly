"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

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

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   */

  static async findAll(filter = {}) {
    const { whereClause, values } = Job.sqlForFilter(filter);

    const querySql = `
        SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            ${whereClause}
            ORDER BY title`;

    const jobsRes = await db.query(querySql, values);
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

  /** Update job
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data);
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id ${id}`);
  }

  /** Accepts filter object with any or all properties:
 * title, salary, hasEquity.
 *
 * If filter object is empty, returns empty string.
 *
 * Returns { whereClause, values }
 *
 *  SQL WHERE clause to filter those properties
 *  with parameterized query placeholders and
 *  array of values to be passed in
 */

  static sqlForFilter(filter) {
    const keys = Object.keys(filter);
    if (keys.length === 0) return '';

    const whereClause = keys.map((key, index) => {
      if (key === "title") {
        return `title ILIKE '%' || $${index + 1} || '%'`;
      } else if (key === "minSalary") {
        return `salary >= $${index + 1}`;
      } else if (key === "hasEquity" && filter.hasEquity) {
        return `equity > 0`;
      }
    });

    //remove hasEquity key if present
    const { hasEquity, ...values } = filter;
    const filterVals = Object.values(values);
    //filter out undefined before joining
    return {
      whereClause: `WHERE ${whereClause.filter(Boolean).join(' AND ')}`,
      values: filterVals
    }
  }
}

module.exports = Job;
