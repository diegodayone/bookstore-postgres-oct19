const { Pool } = require("pg")
const pool = new Pool() //this will be the one and only instance of the Pool

module.exports = {
    //this method will allow the querying through the pool of connections
    query: (text, params) => pool.query(text, params),
    pool: pool
}