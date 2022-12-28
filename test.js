const bcrypt = require('bcrypt');
const TestPassword = (Math.random() * 10000000000).toFixed(0).toString(36) + "P@$5W0RD@@" + (Math.random() * 10000000000).toFixed(0).toString(36); 
async function hashPassword(password) {
  const saltRounds = 10; // increase this for stronger hashes
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

 

async function verifyPassword(password, hashedPassword) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
}
async function main() {
    console.log("PASSWORD RUN: ", TestPassword)
    let HASHLOCAL = await hashPassword(TestPassword);
    console.log("HASHED PASSWORD", HASHLOCAL);
    console.log("HASH LEGNTH", HASHLOCAL.length)
    console.log("TEST MATCH", await verifyPassword(TestPassword, HASHLOCAL))
    console.log("SHOULD NOT MATCH", await verifyPassword(TestPassword + "BOLD", HASHLOCAL))
}
for (let i = 0 ; i < 100; i++) {
    main()
}