const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jm9b2up.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
   
   // await client.connect();

   const classCollections = client.db('classesDB').collection('classes');
   const usersCollections = client.db('classesDB').collection('users');
   const teacherCollections = client.db('classesDB').collection('teacher');
   const selectCollections = client.db('classesDB').collection('select');


    // user related api
    app.post('/users',async(req,res)=>{
      const user = req.body;
      const query = {email : user.email};
      const existingUser = await usersCollections.findOne(query);
      if(existingUser) {
        return res.send({messsage :'user already exist!'});
      }
      const result = await usersCollections.insertOne(user);
      res.send(result)
    })


    // all classes data get 
    app.get('/classes',async(req,res)=>{
        const result = await classCollections.find().toArray();
        res.send(result);
    })
    app.get('/teacher',async(req,res)=>{
        const result = await teacherCollections .find().toArray();
        res.send(result);
    })

    // select or cart collections

    app.get('/selects',async(req,res)=>{
      const email = req.query.email;
      console.log(email);
      if(!email) res.send([])
      const query = {email : email};
      const result = await selectCollections.find(query).toArray();
      res.send(result);
    })
    app.post('/selects',async(req,res)=>{
      const item = req.body;
      console.log(item);
      const result = await selectCollections.insertOne(item);
      res.send(result); 
    })

    app.delete('/selects/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await selectCollections.deleteOne(query);
      res.send(result);

    })


   
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("sports server is running on port 5000");
});

app.listen(port,()=>{
    console.log(`Running on port ${port}`);
})