const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const wss = new WebSocket.Server({ port: 3000 });

let broadcaster = null;
const clients = new Map();

wss.on("connection", socket => {
  const id = uuidv4();
  socket.id = id;
  clients.set(id, socket);

  socket.on("message", message => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "broadcaster":
        if (data.type === "broadcaster") {
          if (broadcaster && broadcaster !== socket) {
            socket.send(JSON.stringify({
              type: "broadcaster-already-connected",
              message: "Another broadcaster is already connected."
            }));
          }}
          
        broadcaster = socket;
        break;

      case "listener":
        if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
          broadcaster.send(JSON.stringify({
            type: "new-listener",
            listenerId: id
          }));
        }
        break;

      case "offer":
      case "answer":
      case "candidate":
        const target = clients.get(data.targetId);
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({
            ...data,
            senderId: id
          }));
        }
        break;
    }
  });

  socket.on("close", () => {
    clients.delete(id);
    if (socket === broadcaster) broadcaster = null;
  });
});

console.log("WebSocket signaling server running at wss://192.168.55.60:3000");
