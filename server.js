const express = require("express");
const http = require("http");
const app = express();
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let users = [];
let userPins = {};
const messages = {
  General: [],
};

io.on("connection", (socket) => {
  socket.on("join server", (username) => {
    const user = {
      username,
      id: socket.id,
      private: false,
    };
    users.push(user);
    userPins[username] = { pin: "", status: "" };
    io.emit("new user", users, userPins);
  });

  socket.on("join room", (roomName, cb) => {
    socket.join(roomName);
    cb(messages[roomName]);
  });

  socket.on("room created", (room) => {
    io.emit("add room", room);
  });

  socket.on("send message", ({ content, to, sender, chatName, isChannel }) => {
    if (isChannel) {
      const payload = {
        content,
        chatName,
        sender,
      };
      socket.to(to).emit("new message", payload);
    } else {
      const payload = {
        content,
        chatName: sender,
        sender,
      };
      socket.to(to).emit("new message", payload);
    }
    if (messages[chatName]) {
      messages[chatName].push({
        sender,
        content,
      });
    }
  });

  socket.on("authenticate user", (pin, socketId, senderName) => {
    socket.to(socketId).emit("authenticate", pin, senderName);
  });

  socket.on("user authenticated", (socketId, senderName) => {
    socket.to(socketId).emit("authenticated", senderName);
  });

  socket.on("user pin generated", (socketId, chatName) => {
    socket.to(socketId).emit("set generated", chatName);
  });

  socket.on("disconnect", () => {
    // const userName = users.filter((u) => u.id == socket.id)[0].username;
    users = users.filter((u) => u.id !== socket.id);
    // delete userPins[userName];
    io.emit("new user", users, userPins);
  });
});

server.listen(3001, () => console.log("server is running on port 3001"));
