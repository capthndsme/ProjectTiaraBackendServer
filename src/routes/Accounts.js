const { createPasswordHash } = require("../shared/LoginVerification");

let dbInstance;
module.exports = function (app, dbi) {
    dbInstance = dbi;
    app.post("/accounts/register", RegisterAccount)
}

function RegisterAccount(req, res) {
    let json = req.body
    if (json &&
        json.username   &&
        json.password   &&
        json.email      &&
        json.name
    ) {
        // Step 1: Check if username exists
        dbInstance.execute("SELECT * FROM Accounts WHERE Username = ?", [json.username])
        .then(([rows,fields]) => {
            if (rows.length === 0) {
                // Create Account 
                let image = "https://static.projecttiara.capthndsme.xyz/uimg/default.png"
                if (!(json.picImage) && json.picImage === "") {
                    userImage = json.picImage
                }
                dbInstance.execute(
                    "INSERT INTO Accounts(Email, Username, Password, DisplayName, DisplayImage) Values (?, ?, ?, ?, ?)",
                    [
                        json.email,
                        json.username,
                        createPasswordHash(json.password), 
                        json.name, 
                        image
                    ])
            } else {
                res.send({
                    "state": "error",
                    "error": "Username is already taken."
                })
            }
        })
        .catch(error => {
            console.error("[Error RegisterAccount]", error)
            res.status(500).send({
                "state": "error",
                "error": "Internal Server Error"
            })
        });
    } else {
        res.status(400).send({
            "state": "error",
            "error": "Missing account parameters."
        });
    }
}