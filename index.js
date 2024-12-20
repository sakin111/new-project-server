const express = require("express")
const cors = require("cors")
const jwt = require('jsonwebtoken');
const SSLCommerzPayment = require('sslcommerz-lts');
const cookieParser = require('cookie-parser');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { default: axios } = require("axios");
require('dotenv').config();
const port = process.env.PORT || 5000;




const corsOptions = {
  origin: ['http://localhost:5173', 'https://earnest-cactus-351358.netlify.app'],
  credentials: true,
};


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors(corsOptions));
app.use(cookieParser())












const uri = `mongodb+srv://${process.env.MONGO_user}:${process.env.MONGO_pass}@cluster0.ubtwufv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const store_id = process.env.store_Id;
const store_passwd = process.env.store_Passwd;






// making cookies







async function run() {
  try {

    const card = client.db("gutigutipa").collection("cardCollection");
    const cardMix = client.db("gutigutipa").collection("cardCollectionMix");
    const addToCart = client.db("gutigutipa").collection("addToCart");
    const usersAll = client.db("gutigutipa").collection("Users");
    const myOrder = client.db("gutigutipa").collection("myOrder");
    const guestCarts = client.db("gutigutipa").collection("myGuest");
    const guestCartsApprove = client.db("gutigutipa").collection("myGuestApprove");













    app.post("/addToCartCookies", async (req, res) => {
      const { addInfo } = req.body;
      let sessionId = req.cookies.guestSessionId;



      // If no session ID is present, create a new one and set the cookie
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2);
        res.cookie("guestSessionId", sessionId, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 1 month
          sameSite: "lax",
          secure: false,  // Set to true only in production
        });
        console.log("New session ID created and set in cookie:", sessionId);
      } else {
        console.log("Existing session ID found in cookie:", sessionId);
      }

      // Validate addInfo presence
      if (!addInfo) {
        return res.status(400).json({ error: "Missing addInfo in request body" });
      }

      try {
        // Insert or update the cart data in the database
        await guestCarts.updateOne(
          { sessionId },
          { $push: { cart: { _id: new ObjectId(), ...addInfo } } },
          { upsert: true }
        );

        console.log("Item added to cart for session:", sessionId);
        res.status(200).json({ message: "Item added to cart" });
      } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });





    // get item from cookie

    app.get("/addToCartCookies", async (req, res) => {
      const sessionId = req.cookies.guestSessionId;

      if (!sessionId) {
        return res.status(400).json({ error: "No session ID found" });
      }

      const cart = await guestCarts.findOne({ sessionId });
      res.status(200).json(cart ? cart.cart : []);
    });


    // destructure the addInfo

    app.get("/addToCartCookies/:id", async (req, res) => {


      try {
        const id = req.params
        const query = {_id: new ObjectId(id)}
        const options = {
          projection: {
            _id: 1, price: 1, quantity: 1, image: 1, category: 1, name: 1
          }
        }
        const result = await addToCart.findOne(query, options);

        res.send(result)

      } catch (error) {
        console.error('Error deleting cart item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    })



    app.get("/OrderCookies", async (req, res) => {


      try {
        const {cookiesItem} = req.body

        const result = await guestCartsApprove.findOne({cookiesItem});

        res.send(result)

      } catch (error) {
        console.error('Error deleting cart item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    })



// cookies checked   


app.patch('/addToCartCookies/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { check } = req.body;

    // Validate that the ID is provided
    if (!id) {
      return res.status(400).json({ error: 'Cart item ID is required.' });
    }

    // Prepare the update document based on the provided fields
    const updateDoc = { $set: {} };

    // Add fields to the update document if they are provided
    if (check) updateDoc.$set.check = check;


    // If no fields are provided, return an error
    if (Object.keys(updateDoc.$set).length === 0) {
      return res.status(400).json({ error: 'At least one field to update is required.' });
    }

    // Find the cart item by ID and update the provided fields
    const filter = { _id: new ObjectId(id) };
    const result = await guestCarts.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    // If the item was found and updated, send success response
    res.json({ success: true, modifiedCount: result.modifiedCount });

  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});









    // jwt post

    app.post('/jwt', async (req, res) => {
      try {
        const user = req.body;
        const token = await jwt.sign(user, process.env.JWT_access_TOKEN, { expiresIn: '365d' });
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
        const user = await usersAll.findOne({ email: email })
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


    // payment getWay

    app.post("/create-payment", async (req, res) => {
      try {
        const paymentInfo = req.body;
        const initiateData = {
          store_id: store_id,
          store_passwd: store_passwd,
          total_amount: paymentInfo.totalPrice,
          currency: 'BDT',
          tran_id: 'REF123',
          success_url: "http://localhost:5000/success-payment",
          fail_url: "http://yoursite.com/fail.php",
          cancel_url: "http://yoursite.com/cancel.php",
          cus_name: "Customer Name",
          cus_email: "cust@yahoo.com",
          cus_add1: 'Dhaka',
          cus_add2: "Dhaka",
          cus_city: "Dhaka",
          cus_state: "Dhaka",
          product_name: paymentInfo.productName,
          product_category: paymentInfo.productCategory,
          product_profile: "Baby food",
          cus_postcode: paymentInfo.postCode,
          cus_country: "Bangladesh",
          cus_phone: paymentInfo.phoneNumber,
          cus_fax: "01711111111",
          shipping_method: "NO",
          multi_card_name: "mastercard,visacard,amexcard",
          value_a: "ref001_A",
          value_b: "ref002_B",
          value_c: 'ref003_C',
          value_d: "ref004_D"
        };

        // Send the POST request to SSLCommerz
        const response = await axios({
          method: "POST",
          url: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
          data: initiateData,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        console.log(response, "this is response")
        // Send back the response from SSLCommerz
        res.send(response.data);
      } catch (error) {
        console.error("Error during payment initiation:", error);
        res.status(500).send("Error initiating payment");
      }
    });

    // success url

    app.post("/success-payment", async (req, res) => {

      const successData = req.body
      console.log(successData, "successData")
    })



    // card items

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


    app.get("/users", verifyToken, AdminVerify, async (req, res) => {
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



    app.get('/users/email/:email', verifyToken, async (req, res) => {
      const email = decodeURIComponent(req.params.email); // Get email from URL params

      try {
        // Find user in MongoDB by email
        const user = await usersAll.findOne({ email: email });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json(user); // Return the user data if found
      } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: 'Internal Server Error' });
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


    // user patch to add address



    app.patch('/users/:email', verifyToken, async (req, res) => {
      try {
        const { email } = req.params;
        const { address, phoneNumber, postCode } = req.body;

        // Define the filter to locate the user
        const filter = { email: email };

        const updatedDoc = {
          $set: {
            address: address,
            phone: phoneNumber,
            postCode: postCode,
          },
        };

        const result = await usersAll.updateOne(filter, updatedDoc);
        res.send(result);
      } catch (error) {
        console.error('Error updating user role to admin:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });



    // add to cart related  routes 



    // add to cart 
    app.post("/addToCart", async (req, res) => {
      const { email, addInfo } = req.body;

      try {
        // **Case 1**: Check if the email is provided and not null
        (email)
        // If the email exists, proceed to save to MongoDB
        const result = await addToCart.insertOne({ email, ...addInfo });
        return res.status(200).send({ message: "Item added to MongoDB cart", insertedId: result.insertedId });

      } catch (error) {
        console.error("Error saving to MongoDB:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });







    // add to cart single  item get method 


    app.get("/addToCart/:id/:email", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const email = decodeURIComponent(req.params.email)
        const query = { _id: new ObjectId(id), email: email }
        const options = {
          projection: {
            _id: 1, price: 1, quantity: 1, image: 1, category: 1, name: 1, email: 1
          }
        }
        const result = await addToCart.findOne(query, options);

        res.send(result)
      } catch (error) {
        console.error("Error fetching slider data:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    })


    // all addToCart item

    app.get("/addToCart", verifyToken, async (req, res) => {
      try {
        const { email } = req.params;
        const result = await addToCart.find({ email }).toArray(); // Fetch items for this specific email
        res.send(result);

      } catch (error) {
        console.error("Error fetching cart data:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });





    // GET /addToCart - Retrieve the current user's cart
    app.get("/addToCart/:email", verifyToken, async (req, res) => {
      try {
        const userEmail = decodeURIComponent(req.params.email);

        if (!userEmail) {
          return res.status(400).json({ message: "User email is missing." });
        }

        // Fetch all cart items matching the email
        const cart = await addToCart.find({ email: userEmail }).toArray();

        // If no cart is found, return default empty cart response
        if (!cart || cart.length === 0) {
          return res.status(200).json([{
            address: null,
            postCode: null,
            phoneNumber: null,
            paymentMethod: "",
            shippingZone: "",

          }]);
        }

        // Return all matching cart items
        res.status(200).json(cart);
      } catch (error) {
        console.error("Error fetching cart data:", error);
        res.status(500).json({
          message: "An error occurred while fetching cart data",
          error: error.message
        });
      }
    });

    // DELETE - Remove a product from the cart


    app.delete('/addToCart/:id', verifyToken, async (req, res) => {
      try {

        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await addToCart.deleteOne(query)

        if (result.modifiedCount === 0) {
          console.error("Product not found in cart.");
          return res.status(404).json({ error: 'Product not found in cart' });
        }

        res.json({ message: 'Product successfully removed from cart', result });
      } catch (error) {
        console.error('Error deleting cart item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // get the checkout specific data




    // PATCH /addToCart - Update cart details
    app.patch('/addToCart/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const { check } = req.body;

        // Validate that the ID is provided
        if (!id) {
          return res.status(400).json({ error: 'Cart item ID is required.' });
        }

        // Prepare the update document based on the provided fields
        const updateDoc = { $set: {} };

        // Add fields to the update document if they are provided
        if (check) updateDoc.$set.check = check;


        // If no fields are provided, return an error
        if (Object.keys(updateDoc.$set).length === 0) {
          return res.status(400).json({ error: 'At least one field to update is required.' });
        }

        // Find the cart item by ID and update the provided fields
        const filter = { _id: new ObjectId(id) };
        const result = await addToCart.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Cart item not found.' });
        }

        // If the item was found and updated, send success response
        res.json({ success: true, modifiedCount: result.modifiedCount });

      } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });


    // my orders   

    // POST /myOrder - Place an order
    app.post("/myOrder", verifyToken, async (req, res) => {
      try {
        const order = req.body;
        console.log("this is  my order data", req.body)


        // Insert the order into the "myOrder" collection
        const result = await myOrder.insertOne(order);

        // Respond with success, sending back the order ID
        res.status(201).send({
          success: true,
          message: "Order received successfully",
          orderId: result.insertedId, // Order ID from MongoDB
        });
      } catch (error) {
        // Handle any errors during the order creation process
        console.error("Error creating order:", error);
        res.status(500).send({
          success: false,
          message: "Failed to create the order. Please try again.",
        });
      }
    });


    // my order get

    app.get("/myOrder", verifyToken, AdminVerify, async (req, res) => {
      const result = await myOrder.find().toArray();
      res.status(200).json(result);
    });

    // approve patch myOrder

    app.patch('/myOrder/:id', verifyToken, AdminVerify, async (req, res) => {
      try {
        const id = req.params.id;

        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            approve: 'approved'
          }
        }
        const result = await myOrder.updateOne(filter, updatedDoc);
        res.send(result);
      } catch (error) {
        console.error('Error updating user role to admin:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // delete approved item from the database 



    app.delete('/myOrder/:id', verifyToken, AdminVerify, async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid ID format' });
        }
        const query = { _id: new ObjectId(id) };
        const result = await myOrder.deleteOne(query);
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ message: 'Item successfully deleted', result });
      } catch (error) {
        console.error('Error deleting cart item:', error);
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