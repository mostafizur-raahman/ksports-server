const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


app.get('/',(req,res)=>{
    res.send("sports server is running on port 5000");
});

app.listen(port,()=>{
    console.log(`Running on port ${port}`);
})