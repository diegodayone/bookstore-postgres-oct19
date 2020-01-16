const express = require("express")
const db = require("../../../db")

const router = express.Router()

//1) Add to the cart in which we need to specify the current user and the Book ASIN
router.post("/:userId/:asin", async (req, res) =>{
    try{
        const resp = await db.query('INSERT INTO ShoppingCart (BookID, UserID) VALUES ($1, $2) RETURNING ShoppingCartId', [ req.params.asin, req.params.userId])
        res.send(resp.rows[0])
    }
    catch(exx)
    {
        console.log(exx)
        res.status(500).send(exx)
    }
})

//2) We want to remove from the cart a specified product
router.delete("/:userId/:asin", async (req, res)=>{
    try{
        const toDelete = req.body.count || 1
        const resp = await db.query(`DELETE FROM ShoppingCart WHERE
                                    ShoppingCartId IN 
                                        (SELECT ShoppingCartId 
                                        FROM ShoppingCart 
                                        WHERE UserID = $1 AND BookID = $2 
                                        LIMIT $3)`, 
                                        [ req.params.userId, req.params.asin, toDelete])
        if (resp.rowCount === 0)
            res.status(404).send("Not found")
        else 
            res.send("OK")
    }
    catch(exx)
    {
        console.log(exx)
        res.status(500).send(exx)
    }
})

//3) Have a fancy showing for my cart (with product names, prices, total etc)
router.get("/:userId", async (req, res) =>{
    try{
        const resp = await db.query(`SELECT ASIN, Title, Image, COUNT(*) as Copies, COUNT(*) * Price as Total 
                                    FROM ShoppingCart JOIN Books ON BookID = asin
                                    WHERE UserID = $1
                                    GROUP BY ASIN, Title, Image`, [ req.params.userId])

        res.send(resp.rows)
    }
    catch(exx)
    {
        console.log(exx)
        res.status(500).send(exx)
    }
})


module.exports = router;