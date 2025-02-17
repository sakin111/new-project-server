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
    const newOne = client.db("gutigutipa").collection("newOne");









    app.post("/addToCartCookies", async (req, res) => {
      const { addInfo } = req.body;

      // Retrieve or initialize sessionId
      let sessionId = req.cookies.guestSessionId;
    
      // If no session ID is present, create a new one and set the cookie
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2);
        res.cookie("guestSessionId", sessionId, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 1 month
          sameSite: "lax",
          secure: true, // Set to true in production
        });
       
      } else {
        
      }
    
      // Validate addInfo presence
      if (!addInfo) {
        return res.status(400).json({ error: "Missing addInfo in request body" });
      }
    
      try {
        // Insert or update the cart data in the database with a timestamp
        const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month from now
    
        await guestCarts.updateOne(
          { sessionId },
          {
            $push: { cart: { _id: new ObjectId(), ...addInfo } },
            $set: { expirationDate }, // Use $set to update or add expirationDate
          },
          { upsert: true }
        );
    
        console.log("Item added to cart for session:", sessionId);
        res.status(200).json({ message: "Item added to cart" });
      } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    
    // Cleanup expired sessions (example: run this on a scheduled job or a cron job)
    const cleanupExpiredSessions = async () => {
      try {
        const result = await guestCarts.deleteMany({ expirationDate: { $lt: new Date() } });
        console.log(`${result.deletedCount} expired sessions removed.`);
      } catch (error) {
        console.error("Error cleaning up expired sessions:", error);
      }
    };
    
    // Call the cleanup function periodically (e.g., once a day)
    setInterval(cleanupExpiredSessions, 24 * 60 * 60 * 1000); // Run once every 24 hours
    




    




    // get item from cookie

    app.get("/addToCartCookies", async (req, res) => {
      const sessionId = req.cookies.guestSessionId;

      if (!sessionId) {
        return res.status(400).json({ error: "No session ID found" });
      }

      const cart = await guestCarts.findOne({ sessionId });
      res.status(200).json(cart ? cart.cart : []);
    });



 
    // address patch 
app.patch('/addCookiesAddress', async (req, res) => {
  try {
    const packageData = req.body;  // Get the entire body, as the frontend sends it as { packageData: ... }
    console.log(packageData, " this is package ");

    // The rest of your logic remains the same
    const sessionId = req.cookies.guestSessionId;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required.' });
    }

    if (!packageData) {
      return res.status(400).json({ message: 'Address is required.' });
    }

    // Define the filter and update operation
    const filter = { sessionId };
    const updateDoc = {
      $set: { packageData },
    };

    // Perform the update
    const result = await guestCarts.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Respond with success
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




    // destructure the addInfo


app.get("/addToCartCookies/:id", async (req, res) => {
  try {
    const { id } = req.params;
   

    // Convert the string ID into an ObjectId
    const objectId = new ObjectId(id);  // Convert to ObjectId here

 

    // Query to search inside the cart array
    const query = { "cart._id": objectId };

    const options = {
      projection: {
        cart: { $elemMatch: { _id: objectId } },
      },
    };

    const result = await guestCarts.findOne(query, options);



    // Handle case where no matching data is found
    if (!result || !result.cart || result.cart.length === 0) {
      return res.status(404).json({ message: "Cookie not found" });
    }

    // Return the matched cart item
    res.send(result.cart[0]);
  } catch (error) {
    console.error("Error fetching cart item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


    // single item

    // app.get("/addToCartCookies/:id", async (req, res) => {
    //   try {
    //     const { id } = req.params;
    
    //     // Validate ID format
    //     if (!ObjectId.isValid(id)) {
    //       return res.status(400).json({ message: "Invalid ID format" });
    //     }
    
    //     // Query the document and fetch only the matching cart item
    //     const result = await guestCarts.findOne({ _id: new ObjectId({id}) });
 
    
    //     if (!result || !result.cart || result.cart.length === 0) {
    //       return res.status(404).json({ message: "Item not found" });
    //     }
   
    //     res.status(200).json(result); // Return the specific item
    //   } catch (error) {
    //     console.error("Error fetching cart item:", error);
    //     res.status(500).json({ error: "Internal Server Error" });
    //   }
    // });

// app.post("/OrderCookies", async (req, res) => {
//   try {
//     const { cookiesItem } = req.body; // Access the cookies item from the request body

//     // Process the order with cookiesItem
//     const result = await guestCartsApprove.insertOne({ cookiesItem });

//     res.send(result);
//   } catch (error) {
//     console.error('Error placing order:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });




    // cookies checked   


//  app.patch('/CartCookies', async (req, res) => {
//   try {
//     const { check, payload } = req.body;
    

//     if (!check) {
//       return res.status(400).json({ error: 'The "check" field is required.' });
//     }

//     const sessionId = req.cookies.guestSessionId;

//     if (!sessionId) {
//       return res.status(400).json({ error: 'Session ID is missing in cookies.' });
//     }

//     // Perform the update
//     const result = await guestCarts.updateOne(
//       { sessionId }, // Filter by session ID
//       { $set: { check, ...payload } }, // Update fields
    
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).json({ message: 'No matching cart items found for the session.' });
//     }

//     res.json({ success: true, modifiedCount: result.modifiedCount });
//   } catch (error) {
//     console.error("Error updating cart:", error);
//     res.status(500).json({ error: 'Internal Server Error', details: error.message });
//   }
// });

    
    
// cookies add address 

// app.patch('/addCookiesAddress', async (req, res) => {
//   try {
//     const { cookiesAddress } = req.body;  // This is the updated address


//     if (!cookiesAddress) {
//       return res.status(400).json({ error: 'The "cookiesAddress" field is required.' });
//     }

//     const sessionId = req.cookies.guestSessionId;  // Get the session ID from cookies

//     if (!sessionId) {
//       return res.status(400).json({ error: 'Session ID is missing in cookies.' });
//     }

//     // Update the cookiesAddress, clear the cart, and reset the check status
//     const updateResult = await guestCarts.updateOne(
//       { sessionId }, // Filter by session ID
//       {
//         $set: {
//           cookiesAddress,   // Update cookiesAddress with new data
//         },
      
//       }
//     );

//     if (updateResult.matchedCount === 0) {
//       return res.status(404).json({ message: 'No matching cart items found for the session.' });
//     }

//     res.json({
//       success: true,
//       modifiedCount: updateResult.modifiedCount // Return how many documents were modified
//     });
//   } catch (error) {
//     console.error("Error updating cart:", error);
//     res.status(500).json({ error: 'Internal Server Error', details: error.message });
//   }
// });






app.post("/cookiesOrder", async (req, res) => {
  try {
    const {cookiesOrderData} = req.body;
    const sessionId = req.cookies.guestSessionId

    // Insert the order into the "myOrder" collection
    const result = await guestCartsApprove.insertOne(cookiesOrderData);
    const updateResult = await guestCarts.updateOne(
      { sessionId }, // Filter by session ID
      { $set: { cart: [] } }
    );

        // Check if the update was successful
        if (updateResult.matchedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Session not found. Failed to update the cart.",
          });
        }

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

// stored address 

app.get("/fetchUserAddress", async (req, res) => {
  try {
    const sessionId = req.cookies.guestSessionId;

    if (!sessionId) {
      return res.status(400).send({ message: "Session ID not found in cookies." });
    }

    const result = await guestCarts.findOne({ sessionId });

    if (!result) {
      return res.status(404).send({ message: "No address found for this session." });
    }

    res.send(result);
  } catch (error) {
    console.error("Error fetching user address:", error);
    res.status(500).send({ message: "Internal server error. Please try again later." });
  }
});


// add to cart delete   


app.delete('/addToCartCookies/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      console.error("Invalid ObjectId:", id);
      return res.status(400).json({ error: 'Invalid product ID' });
    }

      const query = { "cart._id": new ObjectId(id) };
    const update = { $pull: { cart: { _id: new ObjectId(id) } } };
    const result = await guestCarts.updateOne(query, update);

    // Check if the product was deleted
    if (result.deletedCount === 0) {
      console.error("Product not found in cart.");
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    res.json({ message: 'Product successfully removed from cart' });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});










    // jwt post

    app.post('/jwt', async (req, res) => {
      try {
        const user = req.body;
        const token = await jwt.sign(user, process.env.JWT_access_TOKEN, { expiresIn: '706d' });
        res.send({ token });
      } catch (error) {
        console.error('Error generating JWT token:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    // Middleware to verify JWT token
    const verifyToken = (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
    
        if (!authHeader) {
          return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }
    
        const token = authHeader.split(" ")[1];
    
        if (!token) {
          return res.status(403).json({ success: false, message: "Forbidden: Token is missing" });
        }
    
        jwt.verify(token, process.env.JWT_access_TOKEN, (err, decoded) => {
          if (err) {
            console.error("JWT verification error:", err);
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
          }
    
          req.decoded = decoded; // Attach decoded data to the request object
          next(); // Pass control to the next middleware/handler
        });
      } catch (error) {
        console.error("Error in verifyToken middleware:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
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




    const clearGuestSession = (req, res, next) => {
      try {
        // Check if the request has a valid decoded token from the previous middleware
        if (req.decoded) {
          // Clear the guestSessionId cookie
          res.clearCookie("guestSessionId", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
          console.log("Guest session cleared.");
        }
    
        // Continue to the next middleware or route handler
        next();
      } catch (error) {
        console.error("Error in clearGuestSession middleware:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    };
    


    // card items


    app.get("/card", async (req, res) => {
      const result = await card.find().toArray()
      res.send(result)
    })

    app.get("/cardMix", async (req, res) => {
      const result = await cardMix.find().toArray()
      res.send(result)
    })

    // app.post("/addToCart", async (req, res) => {
    //   const ToCart = req.body;
    //   console.log(ToCart)
    //   const result = await addToCart.insertOne(ToCart);
    //   res.send(result);
    // });


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


    app.get("/users", verifyToken, AdminVerify, clearGuestSession, async (req, res) => {
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

app.post("/addToWishlist",  async (req, res) => {
  const { email, addInfo } = req.body;
  console.log("Incoming POST request to /addToWishlist:", req.body);

  // Input Validation
  if (!email || !addInfo) {
    console.error("Invalid request body:", req.body);
    return res.status(400).json({ success: false, message: "Email and addInfo are required." });
  }

  try {
    // Prepare the wishlist item
    const newWishlistItem = {...addInfo };

    // Update or insert operation
    const result = await addToCart.updateOne(
      { email }, // Match by email
      {
        $setOnInsert: { createdAt: new Date() }, // Set createdAt if this is a new document
        $set: { updatedAt: new Date() }, // Always update updatedAt
        $push: { cart: newWishlistItem }, // Push the new item to the wishlist array
      },
      { upsert: true } // Insert a new document if no match is found
    );

    // Check results and respond
    if (result.upsertedCount > 0) {
      return res.status(201).json({
        success: true,
        message: "New wishlist created and item added.",
        cart: result.upsertedId._id,
      });
    } else if (result.modifiedCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Item added to existing wishlist.",
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "No changes were made, item may already exist.",
      });
    }
  } catch (error) {
    console.error("Error in /addToWishlist:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

    






// fetchRealAddress get  

app.get("/fetchRealUser", verifyToken, async (req, res) => {
  try {
    const {email} = req.body // Extract email from URL params

    if (!email) {
      return res.status(400).send({ message: "Email is required to fetch user data." });
    }

    // Fetch the address or cart based on the email
    const result = await addToCart.findOne({ email });

    if (!result) {
      return res.status(404).send({ message: "No address found for this email." });
    }

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching user address:", error);
    res.status(500).send({ message: "Internal server error. Please try again later." });
  }
});




// address patch 

app.patch('/addToCart', verifyToken, async (req, res) => {
  try {
    const { addressData, email } = req.body; // Expect the address to be sent in the request body

    // Validate request body
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (!addressData) {
      return res.status(400).json({ message: 'Address is required.' });
    }

    // Initialize updateResult before using it
    let updateResult;

    // Update the cookiesAddress, clear the cart, and reset the check status
    updateResult = await addToCart.updateOne(
      { email }, // Filter by email
      {
        $set: {
          addressData, 
          cart: [],// Update addressData with new data
        },
       
      }
    );

    // Check if any document was matched
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'No matching document found for the provided email.' });
    }

    // Respond with success
    res.json({ success: true, modifiedCount: updateResult.modifiedCount });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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

// app.get("/addToCart", verifyToken, async (req, res) => {
//       try {
//         const { email } = req.params;
//         const result = await addToCart.find({ email }).toArray(); // Fetch items for this specific email
//         res.send(result);

//       } catch (error) {
//         console.error("Error fetching cart data:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//       }
//     });   



 



// GET /addToCart/:email - Retrieve the current user's cart
app.get("/addToCart", verifyToken, async (req, res) => {
  try {
    const { email } = req.query;  // Use req.query to retrieve the email parameter from URL
 console.log(email, "this is email")
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Fetch cart data based on the email
    const userCart = await addToCart.findOne({ email }, { projection: { cart: 1 } });

    if (!userCart) {
      return res.status(404).json({ message: "No cart data found for this email" });
    }
   

    // Return only the cart array
    res.json(userCart.cart);
  } catch (error) {
    console.error("Error fetching cart data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});






    // DELETE - Remove a product from the cart

app.delete('/addToCart/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;


    const query = { "cart._id": new ObjectId(id) };
    const update = { $pull: { cart: { _id: new ObjectId(id) } } };

    const result = await addToCart.updateOne(query, update);

    if (result.modifiedCount === 0) {
      console.error("Product not found in cart.");
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    res.json({ message: 'Product successfully removed from cart' });
  } catch (error) {
    console.error('Error deleting cart item:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





 

    //myOrder - Place an order

    app.post("/myOrder", verifyToken, async (req, res) => {
      try {
        const orderData = req.body;
   
        // Insert the order into the "myOrder" collection
        const result = await myOrder.insertOne(orderData);

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

// order stats aggregation 

// app.get("/orderStats", verifyToken, AdminVerify, async (req, res) => {
//   try {






//   const result = await myOrder.aggregate([
//   { $unwind: "$cartItems" },
//   { $match: { "cartItems.id": { $exists: true, $ne: "" } } },
//   // Debug: Log documents after $match
//   {
//     $project: {
//       "cartItems.id": 1,
//       "cartItems.size": 1,
//       "cartItems.quantity": 1
//     }
//   }
// ]).toArray();

// console.log(result, "after $match");

//     res.status(200).send(stats);
//   } catch (error) {
//     console.error("Error fetching order stats:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // admin stats 

// app.get('/admin-stats', verifyToken, AdminVerify, async (req, res) => {
//   const users = await usersAll.estimatedDocumentCount();
//   const cardAll = await card.estimatedDocumentCount();
//   const orders = await myOrder.estimatedDocumentCount();




//   const result = await myOrder.aggregate([
//     {
//       $unwind: '$cartItems'
//     },
//     {"cartProduct": {toobject: "$cartItems.id"}},
//     {
//       $lookup: {
//         from: 'card',
//         localField: 'cartProduct',
//         foreignField: '_id',
//         as: 'items'
//       }
//     },
//     {
//       $unwind: '$items'
//     },
//     {
//       $group: {
//         _id: null,
//         quantity:{ $sum: 1 },
//         revenue: { $sum: '$items.price'} 
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         quantity: '$quantity',
//        totalRevenue:{
//         multiply: ['$quantity', '$revenue']
//        }
//       }
//     }
//   ]).toArray();

//   const revenue = result.length > 0 ? result[0].totalRevenue : 0;

//   res.send({
//     users,
//     cardAll,
//     orders,
//     revenue
//   })
// })












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





