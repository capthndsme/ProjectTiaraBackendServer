module.exports = function (Username, Session, dbConnection, noReject = false) {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute("SELECT * FROM Sessions WHERE Username = ? AND Session = ? ", [Username, Session])
            .then(([rows, fields]) => {
                if (rows.length === 0) {
                    // No rows = no sessions
                    resolve(false);
                } else {
                    // Has rows = sessin exists
                    resolve(true);
                }
            })
            .catch((e) => {
                if (!noReject) {
                    reject(e);
                }

            })
    });
}