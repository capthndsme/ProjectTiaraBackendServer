const crypto = require("node:crypto")

module.exports = function (len=32) {

    return new Promise((resolve, reject) => {
        crypto.randomBytes(len, (err, buf) => {
            resolve(buf.toString('hex'));
        })
    });
}