const { createServer } = require("http");
const signalingServer = require("./signaling");
const adminModule = require("./admin");

const PORT = 3000;

const httpServer = createServer(); // dummy, we only use WebSocket

signalingServer(httpServer, adminModule);
httpServer.listen(PORT, () => {
  console.log(`WebSocket Signaling server running on ws://localhost:${PORT}`);
});
