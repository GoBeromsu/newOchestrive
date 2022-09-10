import path from "path";
import url from "url";
import http, { Server } from "http";
import express from "express";
import kurento from "kurento-client";
import SocketIO from "socket.io";
import { pipeline } from "stream";

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

let kurentoClient = null;
let iceCandidateQueues = null; //엔드포인트 생성 전에 icecandidate가 생성 될 수 있기 때ㅑ문이다.

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
        getRoom(socket, message.roomName, () => {});
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

function joinRoom(socket, username, roomname, callback) {
  getRoom(socket, roomname, (err, myRoom) => {
    if (err) {
      return callback(err);
    }

    myRoom.pipeline.create("WebRtcEndpoint", (err, outgoingMedia) => {
      if (err) {
        callback(err);
      }
      let user = {
        id: socket.id, //user connection id
        name: username,
        outgoingMedia: outgoingMedia, // our outgoing webrtc endpoint
        incomingMedia: {}, //incoming webrtc endpoint
      };

      // 보낼 endpoint들을 확인한다
      let iceCandidateQueue = iceCandidateQueues[user.id];
      if (iceCandidateQueue) {
        while (iceCandidateQueue.length) {
          let ice = iceCandidateQueue.shift();
          user.outgoingMedia.addIceCandidate(ice.candidate);
        }
      }

      // candidate 생성
      user.outgoingMedia.on("OnIceCandidate", (event) => {
        let candidate = kurento.register.complexTypes.IceCandidates(
          event.candidate
        );
        socket.emit("message", {
          event: "candidate",
          userid: user.id,
          candidate: candidate,
        });
      });

      // 방의 유저들에게 새로운 유저가 왔음을 알린다
      socket.to(roomname).emit("message", {
        event: "newParticipantArrived",
        userid: user.id,
        username: user.name,
      });

      let existingUsers = [];
      for (let i in myRoom.participants) {
        if (myRoom.participants[i].id != user.id) {
          existingUsers.push({
            id: myRoom.participants[i].id,
            name: myRoom.participants[i].name,
          });
        }
      }

      socket.emit("message", {
        event: "existingParticipants",
        existingUsers: existingUsers,
        userid: user.id,
      });

      myRoom.participants[user.id] = user;
    });
  });
}

function getRoom(socket, roomname, callback) {
  let myRoom = io.sockets.adapter.rooms[roomname] || { length: 0 };
  let numClients = myRoom.length;

  if (numClients == 0) {
    socket.join(roomname, () => {
      myRoom = io.socket.adapter.rooms[roomname];
      getKurentoClient((err, kurento) => {
        kurento.create("MediaPipeline", (err, pipeline) => {
          myRoom.pipeline = pipeline;
          myRoom.participants = {};
          callback(null, myRoom);
        });
      });
    });
  } else {
    socket.join(roomname);
    callback(null, myRoom);
  }
}

function getKurentoClient(callback) {
  if (kurentoClient !== null) {
    return callback(null);
  }

  kurento(settings.KURENTOURL, (error, _kurentoClient) => {
    if (error) {
      const message =
        "Coult not find media server at address " + settings.KURENTOURL;
      return callback(message + ". Exiting with error " + error);
    }
    kurentoClient = _kurentoClient;
    callback(null, kurentoClient);
  });
}
