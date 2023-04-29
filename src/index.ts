// @ts-nocheck
require("dotenv").config();

import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { getVideoData, isDataHas, setPlayStatus, setVideoData } from "./utils";
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://doge-watch.web.app",
    // origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: "https://doge-watch.web.app" }));
// app.use(cors());
const PORT = process.env.PORT || 8000;
enum PlaybackStatus {
  unstarted = -1,
  ended = 0,
  playing = 1,
  paused = 2,
  buffering = 3,
  videoCued = 5,
}

app.get("/search", async (req: any, res: any) => {
  const response = await axios
    .get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${req.query.q}&key=${process.env.API_KEY}`
    )
    .then((data: any) => {
      console.log(data);
      return data.data;
    })
    .catch((e: any) => console.log(e));
  console.log(response);
  res.json(response);
});

const rooms = new Map();
let connectedUsers: any = {};
const removeSpaces = (string: string) => {
  return string.trim().replace(/\s/g, "");
};
const checkIfIsAdmin = (room: string, username: string) => {
  let filteredData: any = Object.fromEntries(
    Object.entries(connectedUsers).filter(
      ([key, value]: any) => value.room === room
    )
  );
  // returns true if you are lonely :(
  console.log(filteredData[Object.keys(filteredData)[0]].username);

  return filteredData[Object.keys(filteredData)[0]].username === username;
  // Object.keys(filteredData).forEach((val, key) => console.log(val, key));
};
const setIsAdmin = (room: string, username: string) => {
  let filteredData: any = Object.fromEntries(
    Object.entries(connectedUsers).filter(
      ([key, value]: any) => value.room === room
    )
  );

  let randomUsers: any = Object.values(filteredData).filter(
    (val: any) => val.username !== username
  );
  console.log(randomUsers[0]);

  let res = {
    username: randomUsers[0] ? randomUsers[0].username : username,
    isAdmin: true,
  };

  return res;
};
io.on("connection", (socket: Socket) => {
  console.log(`user connected socket id: ${socket.id}`);

  socket.on("setVideoData", (data) => {
    try {
      console.log("here", data);
      // const vidID = connectedUsers[socket.id].videoID;
      setVideoData(data.videoID, connectedUsers[socket.id].room);
      const broadcastData = {
        ...data,
        username: data.username,
      };
      io.to(connectedUsers[socket.id].room).emit("setVideoData", broadcastData);
      console.log("setVideoData:", data);
      console.log(rooms);
    } catch (e) {}
  });

  socket.on("joinRoom", (data: any, cb) => {
    try {
      console.log("here", data);

      if (
        removeSpaces(data.room).length > 0 ||
        removeSpaces(data.username).length > 0
      ) {
        connectedUsers[socket.id] = data;
        socket.join(data.room);
        // if videodata dont have value then set vidid to talk that talk (k6jqx9kZgPM)
        if (!isDataHas(data.room)) {
          setVideoData("k6jqx9kZgPM", data.room);
          console.log("no videoid video id set.");
        }
        const videoData: Map<any, any> = getVideoData(data.room);

        let sendData = {
          videoID: videoData.get("videoID"),
          isAdmin: checkIfIsAdmin(data.room, data.username),
        };
        socket.broadcast.to(connectedUsers[socket.id].room).emit("userJoined", {
          ...sendData,
          username: data.username,
        });
        // socket.emit("joinRoom", videoData.videoID);
        socket.emit("joinRoom", sendData);
        console.log("videodata: ", videoData);
        console.log("sendData: ", sendData);
        console.log("videoID: ", videoData.get("videoID"));
        console.log("joinRoom:", connectedUsers);
        console.log("datajoinroom", data);
      } else {
        cb({
          success: false,
          message: "Please fill out the form",
        });
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("playStatus", (data) => {
    try {
      console.log(data);
      setPlayStatus(connectedUsers[socket.id].room, data);
      socket.broadcast
        .to(connectedUsers[socket.id].room)
        .emit("playStatus", data);
    } catch (e) {
      console.log(e);
      
    }
  });

  socket.on("chatMessage", (data) => {
    try {
      console.log(data);

      io.to(connectedUsers[socket.id].room).emit("chatMessage", data);
    } catch (e) {
      console.log(e);
      
    }
  });

  socket.on("getAllRooms", () => {
    Object.keys(connectedUsers).forEach((e) => {
      rooms.set(e, connectedUsers[e].room);
    });
    // console.log([...new Set(rooms.values())]);
    socket.emit("getAllRooms", [...new Set(rooms.values())]);
  });

  socket.on("leaveRoom", () => {
    try {
      console.log("user-leaves room:", connectedUsers[socket.id]);
      let userData = connectedUsers[socket.id];
      if (typeof userData !== "undefined") {
        socket.to(userData.room).emit("chatMessage", {
          user: "System",
          message: `${userData.username} left the room.`,
        });
        socket
          .to(userData.room)
          .emit(
            "setNewAdmin",
            setIsAdmin(
              userData.room,
              userData.username
            )
          );
        socket.leave(userData);
        io.emit("getAllRooms", rooms);
        rooms.delete(socket.id);
        delete userData;
      }
      console.log(connectedUsers[socket.id]);
    } catch (e) {}
  });

  socket.on("disconnect", () => {
    try {
      console.log("user disconnected");

      let userData = connectedUsers[socket.id];
      if (typeof userData !== "undefined") {
        socket.to(connectedUsers[socket.id].room).emit("chatMessage", {
          user: "System",
          message: `${connectedUsers[socket.id].username} left the room.`,
        });
        socket
          .to(connectedUsers[socket.id].room)
          .emit(
            "setNewAdmin",
            setIsAdmin(
              connectedUsers[socket.id].room,
              connectedUsers[socket.id].username
            )
          );
        socket.leave(connectedUsers[socket.id]);
        io.emit("getAllRooms", rooms);
        rooms.delete(socket.id);
        delete connectedUsers[socket.id];
      }
      console.log(connectedUsers[socket.id]);
    } catch (e) {}
  });
});

httpServer.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
