const bcrypt = require('bcrypt');

module.exports.createPasswordHash = function(password, callback) {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(11)
        .then((salt) => {
            bcrypt.hash(password, salt)
            .then((hash) => resolve(hash))
        })
    })
}

module.exports.verifyPassword = function(password, hashedPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hashedPassword)
        .then((result) => resolve(result))
    })
}