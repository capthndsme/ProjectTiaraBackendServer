const CheckAccountExists = require("../dbops/CheckAccountExists");
const CheckPassword = require("../dbops/CheckPassword");
const CheckSession = require("../dbops/CheckSession");
const CreateAccount = require("../dbops/CreateAccount");
const CreateSession = require("../dbops/CreateSession");
const { createPasswordHash } = require("../shared/LoginVerification");
 

let dbInstance, deviceManager, eventBus;
module.exports = function (app, dbi, devMgr, evBus) {
    dbInstance = dbi;
    deviceManager = devMgr;
    evBus = evBus;
    app.post("/accounts/register", RegisterAccount)
    app.post("/accounts/login", LoginAccount)
    app.post("/accounts/verifyToken", VerifyToken)
}

function VerifyToken(req, res) {
    let json = req.body;
    if (json &&
        json.username &&
        json.session
    ) {
        CheckSession(json.username, json.session, dbInstance)
        .then((checkResult) => {
            if (checkResult) {
                res.send({
                    "state": "success"
                });
            } else {
                res.send({
                    "state": "error"
                });
            }
        })
        .catch((e) => {
            console.error("[Error DatabaseLayer]", e)
            res.status(500).send({
                "state": "error",
                "error": "Database Error"
            });
        })
    }
}

function LoginAccount(req, res) {
    let json = req.body
    if (json &&
        json.username &&
        json.password
    ) {
        CheckPassword(json.username, json.password, dbInstance)
        .then((loginResult) => {
            if (loginResult.status) {
                CreateSession(loginResult.accountId, 
                    json.username, 
                    req.ip,
                    dbInstance
                ).then((hash) => {
                    res.send({
                        "state": "success",
                        "session": hash
                    });
                })
            } else {
                res.send({
                    "state": "error",
                    "error": "Incorrect username or password."
                });
            }
        })
    }

}


function RegisterAccount(req, res) {
    let json = req.body
    if (json &&
        json.username &&
        json.password &&
        json.email &&
        json.name
    ) {
        let userImage = "https://static.projecttiara.capthndsme.xyz/uimg/default.png"
        if (!(json.picImage) && json.picImage === "") {
            userImage = json.picImage
        }
        // Step 1: Check if username exists
        CheckAccountExists(json.username, dbInstance)
        .then((exists) => {
            if (exists) {
                res.send({
                    "state": "error",
                    "error": "Account exists."
                });
            } else {
                createPasswordHash(json.password)
                .then((PasswordHash) => {
                    CreateAccount({
                        email: json.email,
                        username: json.username,
                        passwordHash: PasswordHash,
                        name: json.name,
                        image: userImage
                    }, dbInstance)
                    .then((status) => {
                        res.send({
                            state: "success"
                        })
                    })
                    .catch((e) => {
                        console.error("[Error DatabaseLayer]", e)
                        res.status(500).send({
                            "state": "error",
                            "error": "Database Error"
                        });
                    })
                })
                
            }
        })
        .catch((e) => {
            console.error("[Error DatabaseLayer]", e)
            res.status(500).send({
                "state": "error",
                "error": "Database Error"
            });
        })

    } else {
        res.status(400).send({
            "state": "error",
            "error": "Missing account parameters."
        });
    }
}


