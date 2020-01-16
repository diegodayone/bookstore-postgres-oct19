const express = require("express")
const db = require("../../../db")

const router = express.Router()

router.get("/", async (req, res) => {
    let query = "SELECT * FROM Books"; //creating the first part of the query
    const limit = req.query.limit; //saving limit and offset
    const offset = req.query.offset;
    const sort = req.query.sort;
    
    delete req.query.limit //removing them from the query
    delete req.query.offset
    delete req.query.sort

    const params = [ limit, offset ]  //initializing the parameters array

    let i = 0;
    for (var propName in req.query) { //for each extra query string parameter
        query += i === 0 ?  " WHERE " : " AND " //if it's the first, set the WHERE, else put the AND to join them
        query += propName + " = $" + (i + 3) // Add a property name followed by = $ number of the current param.
        //Since I already have $1 and $2 i must start from $3
        params.push(req.query[propName]) //I add the value of the query string param into the params array
        i++; //increment the index
    }

    if (sort)
        query += ' ORDER BY Title ' + ((sort === "desc") ? "DESC" : "ASC");
    
    query += ' LIMIT $1 OFFSET $2' //closing up my query with limit and offset

    try {
        const books = await db.query(query, params)
        res.send({
            books: books.rows,
            total: books.rowCount
        })
    }
    catch (ex) {
        res.status(500).send(ex)
    }
})

router.get('/search/:title', async (req,res)=>{ 
    const result = await db.query("SELECT * FROM Books WHERE Title LIKE $1", [ '%' + req.params.title + '%'])

    res.send(result.rows)
})

router.get("/:asin", async (req, res) => {
    try {
        //$1 will be replaced with the first element into the array passed as second parameter, in this case Asin = req.params.asin
        const books = await db.query(`SELECT * FROM Books WHERE Asin = $1`, [req.params.asin])
        //If we get not row back, it means that we have no book which matches the condition
        if (books.rowCount === 0)
            return res.status(404).send("Not found")
        else
            return res.send(books.rows[0])
    }
    catch (ex) {
        res.status(500).send(ex)
    }
})



router.post("/", async (req, res) => {
    try {
        const result = await db.query(`INSERT INTO Books (Asin, Title, Image, Category, Price) 
                                       VALUES ($1,$2,$3,$4,$5) 
                                       RETURNING *`,
                                      [req.body.asin, req.body.title, req.body.image, req.body.category, req.body.price ])

        // let query = "INSERT INTO BOOKS ("
        // const params = []
        // for (let param in req.body) {
        //     query += param + ","
        // }
        // query =  query.substring(0, query.length-1) + ") VALUES ("

        // let i = 1;
        // for (let param in req.body) {
        //     query += '$'+i+","
        //     params.push(req.body[param])
        //     i++
        // }
        // query =  query.substring(0, query.length-1) + ") RETURNING * "
        // console.log(query)
        // console.log(params)
        // const result = await db.query(query, params)

        res.send(result.rows[0])
    }
    catch (ex) {
        res.status(500).send(ex)
    }
})

router.put("/:asin", async (req, res) => {
    try {
        const result = await db.query(`UPDATE BOOKS 
                                       SET Title = $1,
                                       Image = $2,
                                       Category= $3,
                                       Price= $4 
                                       WHERE Asin = $5`,
            [req.body.title, req.body.image, req.body.category, req.body.price, req.params.asin]);

        if (result.rowCount === 0)
            res.status(404).send("not found")
        else
            res.send("OK")
    }
    catch (ex) {
        res.status(500).send(ex)
    }
})


router.delete("/:asin", async (req, res) => {
    try {
        const result = await db.query(`DELETE FROM Books WHERE asin = $1`, [req.params.asin])

        if (result.rowCount === 0)
            res.status(404).send("not found")
        else
            res.send("OK")
    }
    catch (ex) {
        res.status(500).send(ex)
    }
})


router.get("/:asin/reviews", async (req, res)=>{
    try{
        const reviews = await db.query(`SELECT * FROM Reviews
                                        WHERE BookID = $1`, 
                                        [ req.params.asin])

        res.send(reviews.rows)
    }
    catch (ex) {
        res.status(500).send(ex)
    }
})

router.post("/:asin/reviews", async (req, res)=>{
    try{
        const newReview = await db.query(`INSERT INTO Reviews (BookID, UserID, Rate, Comment)
                                        VALUES ($1,$2,$3,$4)
                                        RETURNING *`, 
                                        [ req.params.asin, req.body.user, req.body.rate, req.body.comment])

        res.send(newReview.rows[0])
    }
    catch (ex) {
        res.status(500).send(ex)
    }
})

router.put("/:asin/reviews/:reviewId", async (req, res)=>{
    try{
        const updatedReview = await db.query(`UPDATE Reviews 
                                        SET Rate = $1,
                                        Comment = $2,
                                        UpdatedAt = $3
                                        WHERE _id = $4`,
                                        [ req.body.rate, req.body.comment, new Date(), req.params.reviewId])

        if (updatedReview.rowCount === 0)
            return res.status(404).send("NOT FOUND!")
        else
            res.send("OK")
    }
    catch(ex){
        res.status(500).send(ex)
    }
})

router.delete("/:asin/reviews/:reviewId", async(req,res)=>{
    try{
        const deleteQuery = await db.query("DELETE FROM Reviews WHERE _id = $1", [req.params.reviewId])

        if (deleteQuery.rowCount === 0)
            return res.status(404).send("NOT FOUND!")
        else 
            res.send("OK")
    }
    catch(ex){
        res.status(500).send(ex)
    }
})

module.exports = router