const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

module.exports = function (httpServer, adminModule) {
  const wss = new WebSocket.Server({ server: httpServer });

  let broadcaster = null;
  const clients = new Map();
  let startTime = null;

  wss.on("connection", (socket) => {
    const id = uuidv4();
    socket.id = id;
    clients.set(id, socket);

    console.log(`[WS] Client connected: ${id}`);

    socket.on("message", (msg) => {
      let data;
      try {
        data = JSON.parse(msg);
      } catch (e) {
        console.error("[WS] Invalid message:", msg);
        return;
      }

      const { type, targetId } = data;

      switch (type) {
        case "broadcaster":
          if (broadcaster) {
            socket.send(JSON.stringify({ type: "error", message: "A broadcaster is already connected." }));
            return;
          }
          broadcaster = socket;
          startTime = new Date();
          console.log(`[WS] Broadcaster registered: ${id}`);
          adminModule.broadcastUpdate(true, clients.size - 1, startTime);
          adminModule.log(`Broadcast started at ${startTime.toLocaleTimeString()}`);
          break;

        case "listener":
          console.log(`[WS] Listener connected: ${id}`);
          if (broadcaster) {
            broadcaster.send(JSON.stringify({
              type: "new-listener",
              listenerId: id
            }));
            adminModule.broadcastUpdate(true, clients.size - 2, startTime);
          } else {
            socket.send(JSON.stringify({ type: "error", message: "No broadcaster available." }));
          }
          break;

        case "offer":
        case "answer":
        case "candidate":
          const targetSocket = clients.get(targetId);
          if (targetSocket) {
            targetSocket.send(JSON.stringify({
              ...data,
              senderId: id
            }));
          } else {
            console.warn(`[WS] Target not found for ${type}: ${targetId}`);
          }
          break;

        case "admin":
          socket.isAdmin = true;
          console.log(`[WS] Admin interface connected: ${id}`);
          adminModule.init(socket);
          break;

        default:
          console.warn("[WS] Unknown message type:", type);
      }
    });

    socket.on("close", () => {
      clients.delete(id);
      console.log(`[WS] Client disconnected: ${id}`);

      if (socket === broadcaster) {
        broadcaster = null;
        startTime = null;
        console.log("[WS] Broadcaster disconnected");
        adminModule.broadcastUpdate(false, 0, null);
      } else {
        const listenerCount = clients.size - (broadcaster ? 2 : 1); // minus admin & broadcaster
        adminModule.broadcastUpdate(!!broadcaster, listenerCount, startTime);
      }
    });

    socket.on("error", (err) => {
      console.error(`[WS] Socket error (${id}):`, err);
    });
  });
};
