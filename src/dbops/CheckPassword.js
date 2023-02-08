const { verifyPassword } = require("../shared/LoginVerification");

module.exports = function (Username, Password, dbConnection) {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute("SELECT * FROM Accounts WHERE Username = ?", [Username])
            .then(([rows, fields]) => {
                if (rows.length === 0) {
                    resolve({status: false});
                } else {
                    const pass = rows[0].Password;
                    verifyPassword(Password, pass.toString()).then((passwordVerifyStatus) => {
                        if (passwordVerifyStatus) {
                            resolve({
                                status: passwordVerifyStatus,
                                accountId: rows[0].AccountID
                            })
                        } else {
                            resolve({
                                status: passwordVerifyStatus
                            })
                        }
                    })
                }
            })
            .catch((e) => {
                reject(e);
            })
    });
}