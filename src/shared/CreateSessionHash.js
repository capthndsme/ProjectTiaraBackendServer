const crypto = require("node:crypto")

module.exports = function () {

    return new Promise((resolve, reject) => {
        crypto.randomBytes(32, (err, buf) => {
            resolve(buf.toString('hex'));
        })
    });
}