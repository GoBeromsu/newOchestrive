import path from "path";
import url from "url";
import http, { Server } from "http";
import express from "express";
import kurento from "kurento-client";
import SocketIO from "socket.io";

// Constants
const settings = {
  WEBSOCKETURL: "http://localhost:8080/",
  // KURENTOURL: "ws://10.246.246.81:10001/kurento",
  KURENTOURL: "ws://localhost:8888/kurento",
};

// Server Start up
const app = express();
const asUrl = url.parse(settings.WEBSOCKETURL);
const port = asUrl.port;

const server = app.listen(port, () => {
  console.log("Kurento Tutorial started");
  console.log("Open " + url.format(asUrl) + " with a WebRTC capable browser");
});

const io = SocketIO(server);

io.on("connection", (socket) => {
  console.log("유저 : " + socket.id + " is Connected");

  socket.on("message", (message) => {
    switch (message.id) {
      case "register":
        console.log("User registered " + socket.id);
        break;
      case "joinRoom":
        joinRoom(socket, message.roomName, function () {});
        break;
      case "leaveRoom":
        break;
      case "leaveRoom":
        break;
      case "onIceCandidate":
        break;
      default:
        socket.emit({ id: error, message: "Invalid message" + message });
    }
  });
});

app.use(express.static(path.join(__dirname, "static")));

function joinRoom(socket, roomName, callback) {
  if (socket.rooms.has(roomName)) {
    // 유저가 방을 만들어야한다.
    //
  } else {
    // 유저가 방에 접속해야 한다.
  }
}

function getKurentoClient(callback) {
  return kurento(settings.KURENTOURL, function (error, kurentoClient) {
    if (error) {
      var message =
        "Coult not find media server at address " + settings.KURENTOURL;
      return callback(message + ". Exiting with error " + error);
    }

    callback(null, kurentoClient);
  });
}
