import React, { useState, useRef, useEffect } from "react";
import Form from "./components/UsernameForm";
import Chat from "./components/Chat";
import io from "socket.io-client";
import immer, { setUseProxies } from "immer";
import "./App.css";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const initialMessagesState = {
  General: [],
};

function App() {
  const [username, setUsername] = useState("");
  const [connected, setConnected] = useState(false);
  const [currentChat, setCurrentChat] = useState({
    isChannel: true,
    chatName: "General",
    receiverId: "",
  });
  const [connectedRooms, setConnectedRooms] = useState(["General"]);
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState(initialMessagesState);
  const [message, setMessage] = useState("");
  const socketRef = useRef();
  const [userPins, setUserPins] = useState({
    General: {
      pin: "",
      status: "authenticated",
    },
  });
  const [pinStatus, setPinStatus] = useState({});
  const [pin, setPin] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinAsk, setPinAsk] = useState(false);
  const [currPin, setCurrPin] = useState("");
  const [privatePin, setPrivatePin] = useState("");
  const [currPrivatePin, setCurrPrivatePin] = useState("");
  const [newRoom, setNewRoom] = useState({});
  const [rooms, setRooms] = useState(["General"]);

  function handleMessageChange(e) {
    setMessage(e.target.value);
  }

  useEffect(() => {
    setMessage("");
  }, [messages]);

  useEffect(() => {
    if (Object.keys(pinStatus).length != 0) {
      if (pin != "") {
        if (userPins[Object.keys(pinStatus)[0]].pin == pin) {
          const status = immer(userPins, (draft) => {
            draft[Object.keys(pinStatus)[0]].status = "authenticated";
          });
          setUserPins(status);
          socketRef.current.emit(
            "user authenticated",
            allUsers.find((u) => u.username === Object.keys(pinStatus)[0]).id,
            username
          );
          setPin("");
          setShowDialog(false);
        }
      } else {
        const status = immer(userPins, (draft) => {
          draft[Object.keys(pinStatus)[0]].status = Object.values(pinStatus)[0];
        });
        setUserPins(status);
      }
      setPinStatus({});
    }
    if (Object.keys(newRoom).length != 0) {
      let roomname = Object.keys(newRoom)[0];
      let ids = Object.values(newRoom)[0];
      if (ids.includes(allUsers.find((u) => u.username === username).id)) {
        let newRooms = [...rooms];
        newRooms.push(roomname);
        let newMessages = immer(messages, (draft) => {
          draft[roomname] = [];
        });
        setRooms(newRooms);
        setMessages(newMessages);
        joinRoom(roomname);
      }
      setNewRoom({});
    }
  }, [pinStatus, newRoom]);

  function sendMessage() {
    const payload = {
      content: message,
      to: currentChat.isChannel ? currentChat.chatName : currentChat.receiverId,
      sender: username,
      chatName: currentChat.chatName,
      isChannel: currentChat.isChannel,
    };
    socketRef.current.emit("send message", payload);
    const newMessages = immer(messages, (draft) => {
      draft[currentChat.chatName].push({
        sender: username,
        content: message,
      });
    });
    setMessages(newMessages);
  }

  function joinRoom(room) {
    const newConnectedRooms = immer(connectedRooms, (draft) => {
      draft.push(room);
    });
    socketRef.current.emit("join room", room, (messages) =>
      roomJoinCallback(messages, room)
    );
    setConnectedRooms(newConnectedRooms);
  }

  function roomJoinCallback(incomingMessages, room) {
    const newMessages = immer(messages, (draft) => {
      draft[room] = incomingMessages;
    });
    setMessages(newMessages);
  }

  function setPins(currentChat) {
    const pin = Math.floor(100000 + Math.random() * 900000);
    const pins = immer(userPins, (draft) => {
      draft[currentChat.chatName].pin = pin.toString();
      draft[currentChat.chatName].status = "generated";
    });
    setUserPins(pins);
    setPin(pin);
    socketRef.current.emit(
      "user pin generated",
      currentChat.receiverId,
      username
    );
    return pin;
  }

  function toggleChat(currentChat) {
    if (!messages[currentChat.chatName]) {
      const newMessages = immer(messages, (draft) => {
        draft[currentChat.chatName] = [];
      });
      setMessages(newMessages);
    }
    setCurrentChat(currentChat);
    if (!currentChat.isChannel) {
      if (allUsers.find((u) => u.username === currentChat.chatName).private) {
        setPinAsk(true);
      }
      if (userPins[currentChat.chatName].status == "") {
        setPins(currentChat);
        setShowDialog(true);
      }
      if (userPins[currentChat.chatName].status == "generated") {
        setShowPinDialog(true);
      }
    }
  }

  function handleChange(e) {
    setUsername(e.target.value);
  }

  function onPrivatePinChange(e) {
    setPrivatePin(e.target.value);
  }

  function connect() {
    setConnected(true);
    socketRef.current = io.connect("/");
    socketRef.current.emit("join server", username);
    socketRef.current.emit("join room", "General", (messages) =>
      roomJoinCallback()
    );
    socketRef.current.on("new user", (allUsers, allUserPins) => {
      setAllUsers(allUsers);
      setUserPins(allUserPins);
    });
    socketRef.current.on("new message", ({ content, sender, chatName }) => {
      setMessages((messages) => {
        const newMessages = immer(messages, (draft) => {
          if (draft[chatName]) {
            draft[chatName].push({ content, sender });
          } else {
            draft[chatName] = [{ content, sender }];
          }
        });
        return newMessages;
      });
    });
    socketRef.current.on("set generated", (chatName) => {
      setPinStatus({ [chatName]: "generated" });
    });
    socketRef.current.on("authenticate", (pin, senderName) => {
      setPin(pin);
      setPinStatus({ [senderName]: "" });
    });
    socketRef.current.on("authenticated", (senderName) => {
      setPinStatus({ [senderName]: "authenticated" });
    });
    socketRef.current.on("add room", (room) => {
      setNewRoom(room);
    });
  }

  let body;
  if (connected) {
    body = (
      <Chat
        message={message}
        handleMessageChange={handleMessageChange}
        sendMessage={sendMessage}
        yourId={socketRef.current ? socketRef.current.id : ""}
        allUsers={allUsers}
        joinRoom={joinRoom}
        connectedRooms={connectedRooms}
        currentChat={currentChat}
        toggleChat={toggleChat}
        messages={messages[currentChat.chatName]}
        userPins={userPins}
        setAllUsers={setAllUsers}
        socketRef={socketRef}
        rooms={rooms}
        username={username}
      />
    );
  } else {
    body = (
      <Form
        username={username}
        privatePin={privatePin}
        onPrivatePinChange={onPrivatePinChange}
        onChange={handleChange}
        connect={connect}
      />
    );
  }

  function handlePinChange(e) {
    setCurrPin(e.target.value);
  }

  function handleClose() {
    setShowPinDialog(false);
    socketRef.current.emit(
      "authenticate user",
      currPin,
      currentChat.receiverId,
      username
    );
  }

  function handlePinAskChange(e) {
    setCurrPrivatePin(e.target.value);
  }

  function handlePinAskClose() {
    if (currPrivatePin === privatePin) {
      setPinAsk(false);
    } else {
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      className="App"
    >
      {body}
      <Dialog open={showDialog}>
        <DialogTitle>Pin for the chat is</DialogTitle>
        <DialogContent>
          <DialogContentText>{pin}</DialogContentText>
        </DialogContent>
      </Dialog>
      <Dialog open={showPinDialog} onClose={handleClose}>
        <DialogTitle>Enter Pin</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="PIN"
            type="number"
            fullWidth
            variant="standard"
            onChange={handlePinChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>OK</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={pinAsk} onClose={handlePinAskClose}>
        <DialogTitle>Enter Pin</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="PIN"
            type="number"
            fullWidth
            variant="standard"
            onChange={handlePinAskChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePinAskClose}>OK</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;
