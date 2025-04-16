let admins = [];

function broadcastUpdate(isBroadcasting, listenerCount, startTime) {
  const update = {
    type: "admin-update",
    broadcasting: isBroadcasting,
    listenerCount,
    startTime: startTime ? startTime.toLocaleString() : null,
    timestamp: new Date().toLocaleTimeString(),
  };

  admins.forEach((admin) => {
    if (admin.readyState === 1) {
      admin.send(JSON.stringify(update));
    }
  });

  console.log(`[ADMIN UPDATE]: Broadcasting: ${isBroadcasting}, Listeners: ${listenerCount}, Start: ${update.startTime}`);
}

function log(message) {
  const logMessage = {
    type: "log",
    message,
    timestamp: new Date().toLocaleTimeString(),
  };

  console.log(`[ADMIN LOG]: ${message}`);
  admins.forEach((admin) => {
    if (admin.readyState === 1) {
      admin.send(JSON.stringify(logMessage));
    }
  });
}

function init(socket) {
  admins.push(socket);
  console.log("[ADMIN]: New admin connected. Total admins:", admins.length);

  socket.send(
    JSON.stringify({
      type: "log",
      message: "Admin interface connected.",
      timestamp: new Date().toLocaleTimeString(),
    })
  );

  socket.on("close", () => {
    admins = admins.filter((a) => a !== socket);
    console.log("[ADMIN]: Admin disconnected. Remaining admins:", admins.length);
  });
}

module.exports = {
  broadcastUpdate,
  log,
  init,
};
