const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

// verify jwt
const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization) return res.status(401).send({error:true,messsage:'unauthorized access'});

  //berer token
  const token = authorization.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({error:true,messsage:'unauthorized access'});
    }
    req.decoded = decoded;
    next();
  })
}

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

   // jwt
   app.post('/jwt',(req,res)=>{
    const user = req.body;
    const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'});
    res.send({token});
   })

    // user related api
    app.get('/users',async(req,res)=>{
      const result = await usersCollections.find().toArray();
      res.send(result);
    })
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
    //get admin
    app.get('/users/admin/:email',verifyJWT,async(req,res)=>{
      const email = req.params.email;

      if(req.decoded.email !== email){
        res.send({admin:false})
      }
      const query = {email: email};
      const user = await usersCollections.findOne(query);     
      const result = {admin:user?.role ==='admin'}
      res.send(result);
    })
    // make admin
    app.patch('/users/admin/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updatedDoc ={
        $set:{
          role:"admin"
        }
      }
      const result = await usersCollections.updateOne(filter,updatedDoc);
      res.send(result);
    })
    // make instructor
    
    app.patch('/users/instructor/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updatedDoc ={
        $set:{
          role:"instructor"
        }
      }
      const result = await usersCollections.updateOne(filter,updatedDoc);
      res.send(result);
    })

    // all classes data get 
    app.get('/classes',async(req,res)=>{
        const result = await classCollections.find().toArray();
        res.send(result);
    })

    app.post('/classes',verifyJWT,async(req,res)=>{
      const newClass = req.body;
      const result = await classCollections.insertOne(newClass);
      res.send(result);
    })
    app.get('/teacher',async(req,res)=>{
        const result = await teacherCollections .find().toArray();
        res.send(result);
    })

    // select or cart collections

    app.get('/selects',verifyJWT,async(req,res)=>{
      const email = req.query.email;
      if(!email) res.send([])

      const decodedEmail = req.decoded.email;
      if(email != decodedEmail){
        return res.status(403).send({error:true,messsage:'porbidden access'});
      }
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
    // create payment intent
    app.post('/create-payment-intent',async(req,res)=>{
      const {price} = req.body;
      const amount = price * 100;
      console.log(price,amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency :'usd',
        payment_method_types:[
          'card'
        ]
      })

      res.send({
        clientSecret: paymentIntent.client_secret
      })

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