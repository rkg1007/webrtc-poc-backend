import WebSocket, { WebSocketServer } from "ws";

let port = process.env.PORT;
if (!port) port = "5000";

const Port = Number(port)

const server = new WebSocketServer({ port: Port });

const users: Record<string, WebSocket> = {}; 

server.on("connection", (socket) => {
    socket.onopen = handleOpen;
    socket.onmessage = (data) => handleMessage(socket, data);
    socket.onclose = handleClose;
    socket.onerror = handleError;
});

const handleOpen = () => { console.log("new connection") }
const handleClose = () => { console.log("connection closed") }
const handleError = () => { console.log("error occured") }
const handleMessage = (socket: WebSocket, event: any) => {
    const { type, data } = JSON.parse(event.data);
    switch (type) {
        case "join":
            handleMemberJoin(socket, data);
            break;
        case "leave":
            handleMemberLeave(data);
            break;
        case "message":
            handleMemberMessage(data);
            break;
        default:
            handleCustomEvent(type, data);
            break;
    } 
}

const handleMemberJoin = (socket: WebSocket, data: any) => {
    const { username } = data;
    console.log(`${username} joined the server`);
    for (const peer in users) {
        const peerConn = users[peer];
        sendMessage(peerConn, { type: "member-joined", data: { username } });
    }
    users[username] = socket;
}

const handleMemberLeave = (data: any) => {
    const { username } = data;
    console.log(`${username} has left the server`);
    delete users[username];
    for (const peer in users) {
        const conn = users[peer];
        sendMessage(conn, { type: "member-left", data: { username } });
    }
}

const handleMemberMessage = (data: any) => {
    const { username, message } = data;
    console.log(`${username} sent a message`, message);
    for (const peer in users) {
        if (peer !== username) {
            const conn = users[peer];
            sendMessage(conn, { type: "member-message", data: { username, message } });
        }
    }
}

const handleCustomEvent = (event: string, data: any) => {
    const { username } = data;
    console.log(`${username} fired a event ${event} with data`, data);
    for (const peer in users) {
        if (peer !== username) {
            const conn = users[peer];
            sendMessage(conn, { type: event, data });
        }
    }
}

const sendMessage = (socket: WebSocket, message: any) => {
    socket.send(JSON.stringify(message));
}

