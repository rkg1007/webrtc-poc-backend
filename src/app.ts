import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000"
    },
    // transports : ['websocket']
});
const usersDb: Record<string, any> = {}

io.on("connection", (socket) => {
    socket.on("join", ({ username }: { username: string}) => {
        const users = []
        for (const user in usersDb) {
            users.push(user);
        }
        socket.broadcast.emit("member-joined", { username })
        socket.emit("online-members", { users })
        usersDb[username] = socket.id;
        socket.data = { username }
    });

    socket.on("disconnecting", () => {
        const { username } = socket.data;
        socket.broadcast.emit("member-left", { username })
        delete usersDb[username];
    });

    socket.on("make-call", ({ from, to, ...args }: any) => {
        if (usersDb[to]) {
            socket.to(usersDb[to]).emit("make-call", { from, ...args });
        } else {
            socket.emit("error", { msg: "something went wrong. user is not connected to the server."});
        }
    });

    socket.on("accept-call", ({ from, to, ...args }: any) => {
        if (usersDb[to]) {
            socket.to(usersDb[to]).emit("accept-call", { from, ...args });
        } else {
            socket.emit("error", { msg: "something went wrong. user is not connected to the server."});
        }
    });

    socket.on("call-signal", ({ from, to, ...args }: any) => {
        if (usersDb[to]) {
            socket.to(usersDb[to]).emit("call-signal", { from, ...args });
        } else {
            socket.emit("error", { msg: "something went wrong. user is not connected to the server."});
        }
    });
});

httpServer.listen(5000);