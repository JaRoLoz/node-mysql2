/**
 * The types are explicity for learning purpose
 * By extending the `RowDataPacket`, you can use your Interface in `query` and `execute`
 */

import mysql, {
  ConnectionOptions,
  ProcedureCallPacket,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';

interface User extends RowDataPacket {
  /** id */
  0: number;
  /** name */
  1: string;
}

const isResultSetHeader = (data: unknown): data is ResultSetHeader => {
  if (!data || typeof data !== 'object') return false;

  const keys = [
    'fieldCount',
    'affectedRows',
    'insertId',
    'info',
    'serverStatus',
    'warningStatus',
    'changedRows',
  ];

  return keys.every((key) => key in data);
};

(async () => {
  const access: ConnectionOptions = {
    host: '',
    user: '',
    password: '',
    database: '',
    rowsAsArray: true,
  };

  const conn = await mysql.createConnection(access);

  /** Deleting the `users` table, if it exists */
  await conn.query<ResultSetHeader>('DROP TABLE IF EXISTS `users`;');

  /** Creating a minimal user table */
  await conn.query<ResultSetHeader>(
    'CREATE TABLE `users` (`id` INT(11) AUTO_INCREMENT, `name` VARCHAR(50), PRIMARY KEY (`id`));',
  );

  /** Inserting some users */
  const [inserted] = await conn.execute<ResultSetHeader>(
    'INSERT INTO `users`(`name`) VALUES(?), (?), (?), (?);',
    ['Josh', 'John', 'Marie', 'Gween'],
  );

  console.log('Inserted:', inserted.affectedRows);

  /** Deleting the `getUsers` procedure, if it exists */
  await conn.query<ResultSetHeader>('DROP PROCEDURE IF EXISTS getUsers');

  /** Creating a procedure to get the users */
  await conn.query<ResultSetHeader>(`
    CREATE PROCEDURE getUsers()
    BEGIN
      SELECT * FROM users ORDER BY name ASC;
    END
  `);

  /** Getting users */
  const [procedureResult] = await conn.query<ProcedureCallPacket<User[]>>(
    'CALL getUsers()',
  );

  procedureResult.forEach((users) => {
    /** By perform a `SELECT` or `SHOW`, The last item of `procedureResult` always be a `ResultSetHeader` */
    if (isResultSetHeader(users)) {
      console.log('----------------');
      console.log('Affected Rows:', users.affectedRows);
    } else {
      users.forEach((user) => {
        console.log('----------------');
        console.log('id:  ', user[0]);
        console.log('name:', user[1]);
      });
    }
  });

  await conn.end();
})();

/** Output
 *
 * Inserted: 4
 * ----------------
 * id:   4
 * name: Gween
 * ----------------
 * id:   2
 * name: John
 * ----------------
 * id:   1
 * name: Josh
 * ----------------
 * id:   3
 * name: Marie
 * ----------------
 * Affected Rows: 0
 */
