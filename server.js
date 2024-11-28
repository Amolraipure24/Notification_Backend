const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Express app
const app = express();
const PORT = 5000;

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin SDK
const serviceAccount = require("./notificationtest-2d78f-firebase-adminsdk-ui6en-ad224ece1c.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/notifications", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const notificationSchema = new mongoose.Schema({
    title: String,
    body: String,
    imageUrl: String,
    token: String, // Firebase token for the user device
    createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);

// app.post("/api/send-notification", async (req, res) => {
//     const { title, body, imageUrl, token } = req.body;

//     if (!title || !body || !token) {
//         return res.status(400).send("Title, body, and token are required.");
//     }

//     try {
//         // Send a push notification via FCM
//         await admin.messaging().send({
//             token, // Device token
//             notification: {
//                 title,
//                 body,
//                 image: imageUrl, // Optional image URL for the notification
//             },
//         });

//         // Save notification to the database
//         const notification = new Notification({ title, body, imageUrl, token });
//         await notification.save();

//         res.status(200).json({
//             message: "Notification sent and saved successfully!",
//         });
//     } catch (error) {
//         console.error("Error sending notification:", error);
//         res.status(500).send("Failed to send notification.");
//     }
// });

// app.post("/api/send-notification", async (req, res) => {
//     const { title, body, imageUrl } = req.body;

//     // Validate incoming data
//     if (!title || !body || !imageUrl) {
//         return res.status(400).json({
//             error: true,
//             message: "Title, body, and imageUrl are required fields.",
//         });
//     }

//     // Static token (hardcoded)
//     const token =
//         "eUK_ZcV7R3eE0LND97hlt0:APA91bHc5YwTqRhbeDtgQFhye73EVVypUjeeY3d2mXwEhQfe8BMFZRl5wA6NBRrITw_f5iSxclqHp6RHGRqErZv67B067b6EX_2HlxW4_40GJx49d3ucWCc";

//     try {
//         // Construct the notification message
//         const message = {
//             token, // Static device token
//             notification: {
//                 title,
//                 body,
//                 image: imageUrl,
//             },
//         };

//         // Send the notification via Firebase Cloud Messaging (FCM)
//         const response = await admin.messaging().send(message);
//         console.log("FCM Response:", response);

//         // Save the notification to the database
//         const notification = new Notification({ title, body, imageUrl, token });
//         await notification.save();

//         // Respond with success
//         res.status(200).json({
//             success: true,
//             message: "Notification sent and saved successfully!",
//             data: {
//                 fcmResponse: response,
//                 notificationId: notification._id,
//             },
//         });
//     } catch (error) {
//         console.error("Error sending notification:", error);

//         // Enhanced error response
//         res.status(500).json({
//             error: true,
//             message: "Failed to send notification.",
//             details: error.message,
//         });
//     }
// });

app.post("/api/send-notification", async (req, res) => {
    const { title, body, imageUrl, token } = req.body;

    // Validate incoming data
    if (!title || !body || !imageUrl || !token) {
        return res.status(400).json({
            error: true,
            message: "Title, body, imageUrl, and token are required fields.",
        });
    }

    try {
        // Construct the notification message
        const message = {
            token, // Dynamic device token from request body
            notification: {
                title,
                body,
                image: imageUrl,
            },
        };

        // Send the notification via Firebase Cloud Messaging (FCM)
        const response = await admin.messaging().send(message);
        console.log("FCM Response:", response);

        // Save the notification to the database
        const notification = new Notification({ title, body, imageUrl, token });
        await notification.save();

        // Respond with success
        res.status(200).json({
            success: true,
            message: "Notification sent and saved successfully!",
            data: {
                fcmResponse: response,
                notificationId: notification._id,
            },
        });
    } catch (error) {
        console.error("Error sending notification:", error);

        // Enhanced error response
        res.status(500).json({
            error: true,
            message: "Failed to send notification.",
            details: error.message,
        });
    }
});

app.get("/api/notifications", async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments();

        res.status(200).json({
            notifications,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).send("Failed to fetch notifications.");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
