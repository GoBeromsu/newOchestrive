let socket = io.connect();

window.onberforeunload = () => {
  socket.disconnect(); //브라우저 리로딩할 때마다 유저 id 재발급
};

function register() {
  console.log("Register user name");
  var data = {
    id: "register",
    name: document.getElementById("userName").value,
  };
  sendMessage(data);
}

function sendMessage(data) {
  socket.emit("message", data);
}

function joinRoom() {
  roomName = document.getElementById("roomName").value;
  var data = {
    id: "joinRoom",
    roomName: roomName,
  };
  sendMessage(data);
}
