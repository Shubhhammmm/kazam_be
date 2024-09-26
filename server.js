const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const TaskModel = require("./model/taskModel");
const redis = require("./config/redis");
const connectDB = require("./config/db");
const cors = require("cors");

require("dotenv").config();
connectDB();

const app = express();
app.use(
  cors({
    origin: "https://kazam-fe-rosy.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://kazam-fe-rosy.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("add", async (task) => {
    try {
      const tasks = await redis.get("FULLSTACK_TASK_SHUBHAM");
      let taskArray = tasks ? JSON.parse(tasks) : [];

      taskArray.push(task);

      if (taskArray.length > 50) {
        const newTaskDoc = new TaskModel({ tasks: taskArray });
        await newTaskDoc.save();
        await redis.del("FULLSTACK_TASK_SHUBHAM");
        console.log("Tasks moved to MongoDB and Redis cache cleared.");
      } else {
        await redis.set("FULLSTACK_TASK_SHUBHAM", JSON.stringify(taskArray));
        console.log("Tasks updated in Redis.");
      }

      io.emit("taskAdded", task);
    } catch (error) {
      console.error("Error while adding task:", error);
    }
  });

  socket.on("deleteTask", async (index) => {
    try {
      const tasks = await redis.get("FULLSTACK_TASK_SHUBHAM");
      let taskArray = tasks ? JSON.parse(tasks) : [];

      taskArray.splice(index, 1);

      await redis.set("FULLSTACK_TASK_SHUBHAM", JSON.stringify(taskArray));

      io.emit("taskDeleted", index);
    } catch (error) {
      console.error("Error while deleting task:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.get("/fetchAllTasks", async (req, res) => {
  try {
    let tasks = await redis.get("FULLSTACK_TASK_SHUBHAM");

    if (!tasks) {
      console.log("Fetching tasks from MongoDB.");
      const mongoTasks = await TaskModel.find({});
      tasks =
        mongoTasks.length > 0 ? JSON.stringify(mongoTasks[0].tasks) : "[]";
    } else {
      console.log("Fetched tasks from Redis.");
    }

    res.json(JSON.parse(tasks));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).send("Error fetching tasks");
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
