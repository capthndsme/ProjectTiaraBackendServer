module.exports = function (Username, dbConnection) {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute("SELECT * FROM Accounts WHERE Username = ?", [Username])
            .then(([rows, fields]) => {
                resolve(rows.length !== 0)
            })
            .catch((e) => {
                reject(e);
            })
    });
}