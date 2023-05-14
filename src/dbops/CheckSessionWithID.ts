import { getConnection } from "../database/Connection";
const dbConnection = getConnection();

export function CheckSessionWithID (Username:string, Session:string, noReject = false): Promise<{ success: boolean, accountId?: number }> {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute("SELECT * FROM Sessions WHERE Username = ? AND Session = ? ", [Username, Session])
            .then(([rows, fields]) => {
                if (Array.isArray(rows)) {
                    if (rows.length === 0) {
                        // No rows = no sessions
                        resolve({
                            success: false
                        });
                    } else {
                        // Has rows = sessin exists
                        // Mark session as active
                        dbConnection.promise().execute("UPDATE Sessions SET LastActive = ? WHERE Username = ? AND Session = ?", [Date.now(), Username, Session])
                        .then(() => {
                            resolve({
                                success: true,
                                accountId: rows[0]["AccountID"]
                            });
                        })
                      
                    }
                } else {
                    resolve({
                        success: false
                    });
                }
            })
            .catch((e) => {
                if (!noReject) {
                    reject({
                        success: false
                    });
                }

            })
    });
}