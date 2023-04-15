import { getConnection } from "../database/Connection";
import { verifyPassword } from "../shared/LoginVerification";
let dbConnection = getConnection();

export function CheckPassword (Username: string, Password: string): Promise<{ status: boolean, accountId?: number }> {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute("SELECT * FROM Accounts WHERE Username = ?", [Username])
            .then(([rows, fields]) => {
                if (Array.isArray(rows)) {
                    if (rows.length === 0) {
                        resolve({status: false});
                    } else {
                        const pass = rows[0]["Password"];;
                        verifyPassword(Password, pass.toString()).then((passwordVerifyStatus) => {
                            if (passwordVerifyStatus) {
                                resolve({
                                    status: passwordVerifyStatus,
                                    accountId: rows[0]["AccountID"]
                                })
                            } else {
                                resolve({
                                    status: passwordVerifyStatus
                                })
                            }
                        })
                    }
                } else {
                    resolve({status: false});
                }

            })
            .catch((e) => {
                reject(e);
            })
    });
}