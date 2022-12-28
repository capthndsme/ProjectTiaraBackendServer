const CreateSessionHash = require('../shared/CreateSessionHash')

module.exports = function (accountId, username, IP, dbConnection) {
    return new Promise((resolve, reject) => {
        CreateSessionHash().then((hash) => {
            dbConnection.promise().execute(
                "INSERT INTO Sessions (AccountID, Username, Session, IPAddress) VALUES (?, ?, ?, ?)",
                [accountId, username, hash, IP]
            ).then(() => {
                resolve(hash)
            })
        })
    });

}