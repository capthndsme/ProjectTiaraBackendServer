import { getConnection } from "../database/Connection";
let dbConnection = getConnection();
export function CheckAccountExists(Username: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute("SELECT * FROM Accounts WHERE Username = ?", [Username])
            .then(([rows]) => {
                if (Array.isArray(rows)) {
                    resolve(rows.length !== 0)
                } else {
                    resolve(false);
                }
            })
            .catch((e) => {
                reject(e);
            })
    });
}