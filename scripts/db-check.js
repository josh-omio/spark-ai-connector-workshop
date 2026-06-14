import { closeDatabase, query } from "../db.js";

async function main() {
  await query(`
    CREATE TABLE IF NOT EXISTS workshop_db_check (
      id INTEGER PRIMARY KEY,
      checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    INSERT INTO workshop_db_check (id)
    VALUES (1)
    ON CONFLICT (id) DO UPDATE SET checked_at = NOW()
  `);

  const result = await query(`
    SELECT
      current_database() AS database,
      current_user AS user,
      checked_at
    FROM workshop_db_check
    WHERE id = 1
  `);

  console.log(JSON.stringify({ ok: true, ...result.rows[0] }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
