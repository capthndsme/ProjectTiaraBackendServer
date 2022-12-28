module.exports = function (obj, dbConnection) {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute(
            "INSERT INTO Accounts(Email, Username, Password, DisplayName, DisplayImage) Values (?, ?, ?, ?, ?)",
            [
                obj.email,
                obj.username,
                obj.passwordHash,
                obj.name,
                obj.image
            ]
        )
        .then((result) => {
            resolve(result);
        })
        .catch((e) => reject(e));
    });
}