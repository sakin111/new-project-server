const express = require("express")
const cors = require("cors")
const jwt = require('jsonwebtoken');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;




app.use(express.json())
app.use(cors({
  origin: ['https://earnest-cactus-351358.netlify.app','http://localhost:5173/' ],
  credentials:true, 
}));





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
    const usersAll = client.db("gutigutipa").collection("Users");




    // jwt post

    app.post('/jwt', async (req, res) => {
      try {
        const user = req.body;
        const token = await jwt.sign(user, process.env.JWT_access_TOKEN, { expiresIn: '360d' });
        res.send({ token });
      } catch (error) {
        console.error('Error generating JWT token:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).send({ message: 'Unauthorized access: No token provided' });
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.JWT_access_TOKEN, (err, decoded) => {
      if (err) {
        console.error('Error verifying JWT token:', err);
        return res.status(401).send({ message: 'Unauthorized access: Invalid token' });
      }
      req.decoded = decoded;
      next();
    });
  } catch (error) {
    console.error('Error in verifyToken middleware:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
};

    // jwt admin

    const AdminVerify = async (req, res, next) => {
      try {
        if (!req.decoded || !req.decoded.email) {
          return res.status(401).send({ message: "Unauthorized access: No user information found" })
        }
        const email = req.decoded.email;
        const user = await usersAll.findOne({email:email})
        if (!user) {
          return res.status(401).send({ message: 'Unauthorized access: User not found' });
        }
        if (user.role !== 'admin') {
          return res.status(403).send({ message: 'Forbidden access: User is not an admin' });
        }
        next()
      } catch (error) {
        console.error('Error verifying admin:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    }

    // card items


    app.get("/card", async (req, res) => {
      const result = await card.find().toArray()
      res.send(result)
    })

    app.get("/cardMix", async (req, res) => {
      const result = await cardMix.find().toArray()
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
        const query = { _id: new ObjectId(id) }
        const options = {
          projection: {
            imageFront: 1, name: 1, item: 1, title: 1, category: 1, description: 1, images: 1, ingredients: 1, size: 1, count: 1, price: 1, usage: 1, age: 1
          }
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
        const query = { _id: new ObjectId(id) }
        const options = {
          projection: {
            imageFront: 1, name: 1, item: 1, title: 1, category: 1, description: 1, images: 1, size: 1, count: 1, price: 1, age: 1
          }
        }
        const result = await cardMix.findOne(query, options);

        res.send(result)
      } catch (error) {
        console.error("Error fetching slider data:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    })


    app.get("/users" ,verifyToken, AdminVerify, async(req,res) =>{
      try {
          const result = await usersAll.find().toArray();
          res.send(result);
        } catch (error) {
          console.error("Error fetching slider data:", error);
          res.status(500).json({ error: "Internal Server Error" }); // Handle errors gracefully
        }
    })

    app.get('/users/admin/:email', verifyToken, AdminVerify, async (req, res) => {
      try {
        // Check for authentication
        if (!req.decoded || !req.decoded.email) {
          return res.status(401).send({ message: 'Unauthorized access' });
        }
        
        // Check if the provided email matches the decoded email
        const email = req.params.email;
        if (email !== req.decoded.email) {
          return res.status(401).send({ message: 'Unauthorized access' });
        }
        
        // Query the database for the user's admin status
        const user = await usersAll.findOne({ email });
        let admin = false;
        if (user) {
          admin = user.role === 'admin';
        }
        
        // Send the admin status in the response
        res.send({ admin });
      } catch (error) {
        console.error('Error fetching admin status:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });







    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
    
      try {
        // Check if the user already exists
        const existUser = await usersAll.findOne(query);
        if (existUser) {
          return res.status(400).send({ message: 'User already exists', insertedId: null });
        }
    
        // Insert the new user into the database
        const result = await usersAll.insertOne(user);
        res.status(201).send(result); // Respond with 201 Created status
      } catch (error) {
        console.error("Error inserting user:", error); // Log the error for debugging
        res.status(500).send({ message: 'Internal server error', error: error.message });
      }
    });
    

// users patch

app.patch('/users/admin/:id', verifyToken, AdminVerify, async (req, res) => {
  try {
    const id = req.params.id;

    const filter = { _id: new ObjectId(id) };
    const updatedDoc = {
      $set: {
        role: 'admin'
      }
    }
    const result = await usersAll.updateOne(filter, updatedDoc);
    res.send(result);
  } catch (error) {
    console.error('Error updating user role to admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.delete('/users/:id', verifyToken, AdminVerify, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await usersAll.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



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