const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@carsrus.9w4iz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyRequest = (req, res, next) => {
    const tokenInfo = req.headers.accesstoken;
    if (tokenInfo) {
        const [email, token] = tokenInfo.split(" ")
        if (email && token) {
            jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
                if (err) {
                    res.send({ error: 'Error Occured!!Unathurozied access' })
                }
                else {
                    if (decoded === email) {
                        next()
                    }
                    else {
                        res.send({ error: 'Sorry Unathurozied access' })
                    }
                }
            });
        }
    }
    else {
        res.send({ error: 'Sorry Unathurozied access' })
    }


}

async function run() {
    try {
        await client.connect();
        const database = client.db("CarsRUs");
        const carsdata = database.collection("carsdata");
        console.log('Db connected')


        // auth
        app.post('/login', async (req, res) => {
            const email = req.body.email
            const token = jwt.sign(email, process.env.ACCESS_TOKEN);
            res.send({ token })
        })


        app.post('/addCarsData', async (req, res) => {
            const newcar = req.body;
            // console.log(newcar);
            const result = await carsdata.insertOne(newcar)
            // console.log("add user :" + user);
            res.send(result)
        })

        app.get('/readCarsData', async (req, res) => {
            const limit = req.query.limit
            const email = req.query.email
            console.log(req.query);
            let result;
            if (limit) {
                result = await carsdata.find({}).limit(parseInt(limit))
            }
            else if (email) {
                result = await carsdata.find({email:email})
            }
            else {
                result = await carsdata.find({})

            }
            res.send(await result.toArray())
        })

        app.get('/readmyCarsData', async (req, res) => {
            const email = req.query.email
            let result;
            if (email) {
                result = await carsdata.find({email:email})
                
            }
            res.send(await result.toArray())
          
        })
       

        app.get('/readSingleCarsData/:id', async (req, res) => {

            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await carsdata.findOne(query)
            res.send(result)
        })

        app.put('/deliverCarData/:id',verifyRequest, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const singleCar = await carsdata.findOne(filter)
            const options = { upsert: true };
            const updateDoc = {
                $set: {quantity:parseInt(singleCar.quantity)-1},
            };
            const result = await carsdata.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        app.delete('/deleteCarData/:id',verifyRequest, async (req, res) => {
            const id=req.params.id
            const query={_id:ObjectId(id)}
            const result=await carsdata.deleteOne(query)
            res.send(result)
         })

        app.post('/updateStock',verifyRequest, async (req, res) => {
            const id = req.body._id
            const newQuantity = req.body.stock
            console.log(req.body);
            const filter = { _id: ObjectId(id) }
            const singleCar = await carsdata.findOne(filter)
            const options = { upsert: true };
            const updateDoc = {
                $set: {quantity:parseInt(singleCar?.quantity)+newQuantity},
            };
            const result = await carsdata.updateOne(filter, updateDoc, options);
            res.send(result)
        })
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hey i am from server');
})

app.listen(port, () => {
    console.log('Server running')

})
