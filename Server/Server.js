require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const routes = require("./Routes/index.routes");
const cors = require("cors");
const colors = require("colors");
const http = require("http");

const app = express();
const server = http.createServer(app);

// ✅ List of allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://13.53.182.243:3000", // ✅ Add this!
  "http://your-frontend-domain.com", // Optional
];

// ✅ Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin like mobile apps or curl
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

app.use(routes);

// ✅ Test route
app.get("/test", (req, res) => {
  res.send("hello you are connected");
});
// ✅ Database connection and server start
const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(port, "0.0.0.0", () => {
      console.log(
        `✅ MongoDB connected & server running on port ${port}`.magenta.bold
      );
    });
  })
  .catch((error) => {
    console.log(error);
  });
const initChatSocket = require("./chatSocket");
initChatSocket(server); //