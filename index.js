const express = require("express")
const cors = require("cors")
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;




app.use(express.json())
app.use(cors({
  origin: 'https://earnest-cactus-351358.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // If you're sending cookies or authorization headers
}));



console.log(process.env.MONGO_user);
console.log(process.env.MONGO_pass);





const uri = `mongodb+srv://${process.env.MONGO_user}:${process.env.MONGO_pass}@cluster0.ubtwufv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    
    const card = client.db("gutigutipa").collection("cardCollection");
    const cardMix = client.db("gutigutipa").collection("cardCollectionMix");
    const addToCart = client.db("gutigutipa").collection("addToCart");


  app.get("/card", async(req, res) =>{
    const result =  await card.find().toArray()
    res.send(result)
  })

  app.get("/cardMix", async(req, res) =>{
    const result =  await cardMix.find().toArray()
    res.send(result)
  })

  app.post("/addToCart", async (req, res) => {
    const ToCart = req.body;
    const result = await addToCart.insertOne(ToCart);
    res.send(result);
  });
  


  app.get("/card/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const  options = {
        projection:{ 
          imageFront:1, name:1, item:1, title:1,category:1,description:1,images:1,ingredients:1,size:1, count:1, price:1, usage:1, age:1}
      }
      const result = await card.findOne(query, options);
     
      res.send(result)
    } catch (error) {
      console.error("Error fetching slider data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  })

  app.get("/cardMix/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const  options = {
        projection:{ 
          imageFront:1, name:1, item:1, title:1,category:1,description:1,images:1,size:1, count:1, price:1,  age:1}
      }
      const result = await cardMix.findOne(query, options);
     
      res.send(result)
    } catch (error) {
      console.error("Error fetching slider data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  })





    


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
  }
}
run().catch(console.dir);




app.get("/", (req, res) => {
  res.send("the server is running on 5000")
})

app.listen(port, () => {
  console.log("hey the server is alright")
})