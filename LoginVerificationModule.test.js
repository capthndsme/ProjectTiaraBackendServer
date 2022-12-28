const bcrypt = require('bcrypt');
const { createPasswordHash, verifyPassword } = require('./src/shared/LoginVerification');
const TestPassword = (Math.random() * 10000000000).toFixed(0).toString(36) + "P@$5W0RD@@" + (Math.random() * 10000000000).toFixed(0).toString(36); 

createPasswordHash(TestPassword).then((re) => {
    console.log("Hash: ", re)
    console.log("Random password: ", TestPassword)
    verifyPassword(TestPassword, re).then((res) => {
        console.log("Test log in with password, should return true: ", res)
    })
    verifyPassword(TestPassword + "B", re).then((res) => {
        console.log("Test log in with password + string B, should return false: ", res)
    })
})