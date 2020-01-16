const express = require("express")
const dotenv = require("dotenv")
const db = require("./db")
const bookRouter = require("./src/routes/books")
const cartRouter = require("./src/routes/cart")
dotenv.config()
const server = express();

server.use(express.json())
server.use("/books", bookRouter)
server.use("/cart", cartRouter)
server.get("/", async (req, res)=>{
   const response = await db.query("SELECT * FROM Books")
   res.send(response.rows)
})

server.post("/moneytransfer", async (req, res)=>{
   const client = await db.pool.connect() //get a reference to a single connection
   try{
      await client.query("BEGIN") //begins the transaction, if rollback, goes to this state.
      //{ from: 1, to: 2, amount: 1000 }

      const withdraw = await client.query("UPDATE BankAccounts SET Balance = Balance - $1 WHERE _id = $2 RETURNING Balance", [ req.body.amount, req.body.from])
      if (withdraw.rowCount !== 1)
         throw new Error("Cannot withdraw from  id " + req.body.from)

      const deposit = await client.query("UPDATE BankAccounts SET Balance = Balance + $1 WHERE _id = $2 RETURNING Balance", [ req.body.amount, req.body.to])
      if (deposit.rowCount !== 1)
         throw new Error("Cannot deposit to id " + req.body.to)

      await client.query("COMMIT") //if everything is successful => save to the database

      res.send({
         from: {
            sender: req.body.from,
            balance: withdraw.rows[0].balance
         },
         to: {
            to: req.body.to,
            balance: deposit.rows[0].balance
         }
      })
   }
   catch(e){
      console.log(e)
      await client.query("ROLLBACK") //in case of error, goes back to the state before the BEGIN
      res.status(500).send(e)
   }
   finally {
      client.release() //will make the client available again for the pool
   }
})

server.listen(process.env.PORT, () => console.log(`SERVER IS LISTENING ON ${process.env.PORT}`))