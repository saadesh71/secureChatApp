import React, { useState } from "react";
import styled from "styled-components";
import IconButton from "@mui/material/IconButton";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import immer, { setUseProxies } from "immer";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import logo from "./logo.png";

const Container = styled.div`
  height: 98vh;
  width: 190vh;
  display: flex;
  background: #ededed;
`;

const SideBar = styled.div`
  height: 100%;
  width: 10%;
  background: #2C3E50;
  color: white;
  box-sizing: border-box;
;l`;

const ChatPanel = styled.div`
  height: 100;
  width: 85%;
  display: flex;
  flex-direction: column;
  background: #f7f7f7;
`;

const BodyContainer = styled.div`
  width: 100%;
  height: 75%;
  background: white;
`;

const TextBox = styled.textarea`
  height: 15%;
  width: 100%;
  border: none;
  border-top: 1px solid #cccccc;
  border-radius: 0;
`;

const ChannelInfo = styled.div`
  height: 10%;
  width: 100%;
  background: #2c3e50;
  color: white;
  box-sizing: border-box;
  font-weight: bold;
  display: flex; // Use flexbox for easy centering
  justify-content: center; // Center horizontally
  align-items: center; // Center vertically
  padding: 0 20px; // Optional padding for some spacing on the sides
`;

const Row = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

const StyledMessage = styled.div`
  background-color: ${(props) =>
    props.isCurrentUser
      ? "#1976D2"
      : "#e0e0e0"}; // Different background color for current user
  color: ${(props) =>
    props.isCurrentUser ? "white" : "black"}; // Text color based on the user
  padding: 10px 20px;
  border-radius: 20px;
  margin: 8px 0;
  max-width: 75%; // Adjust the width of the message bubble as needed
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2); // Subtle shadow effect
  align-self: ${(props) => (props.isCurrentUser ? "flex-end" : "flex-start")};
  word-wrap: break-word;
  display: inline-block;
  text-align: ${(props) => (props.isCurrentUser ? "right" : "left")};
  font-size: 18px;
  line-height: 1.4;
  position: relative; // For positioning the message within the flex container
`;

const Messages = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

function Chat(props) {
  const [showGroupNameDialog, setShowGroupNameDialog] = useState(false);
  const [showGroupUsersDialog, setShowGroupUsersDialog] = useState(false);
  const [currGroupName, setCurrGroupName] = useState("");
  const [checked, setChecked] = React.useState([]);

  const handleToggle = (value) => () => {
    const newChecked = [...checked];

    if (!newChecked.includes(value)) {
      newChecked.push(value);
    } else {
      newChecked.splice(newChecked.indexOf(value), 1);
    }
    setChecked(newChecked);
  };

  function renderRooms(room) {
    const currentChat = {
      chatName: room,
      isChannel: true,
      receiverId: "",
    };
    return (
      <Row onClick={() => props.toggleChat(currentChat)} key={room}>
        {room}
      </Row>
    );
  }

  function handlePrivateClick(user) {
    const hide = immer(props.allUsers, (draft) => {
      draft.find((u) => u.username === user.username).private = true;
    });
    props.setAllUsers(hide);
  }

  function renderUser(user) {
    if (user.id != props.yourId) {
      const currentChat = {
        chatName: user.username,
        isChannel: false,
        receiverId: user.id,
      };
      return (
        <div>
          <Row
            onClick={() => {
              props.toggleChat(currentChat);
            }}
            key={user.id}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <div style={{ padding: "10px" }}>{user.username}</div>
              {user.private ? (
                <div>
                  <IconButton onClick={() => handlePrivateClick(user)}>
                    <VisibilityOffIcon />
                  </IconButton>
                </div>
              ) : (
                <div>
                  <IconButton onClick={() => handlePrivateClick(user)}>
                    <VisibilityIcon />
                  </IconButton>
                </div>
              )}
            </div>
          </Row>
        </div>
      );
    }
  }

  function renderMessages(message, index) {
    const currentUser = props.username; // Replace with actual current user's identifier
    const isCurrentUser = message.sender === currentUser;

    return (
      <div>
        <StyledMessage key={index} isCurrentUser={isCurrentUser}>
          {message.content}
        </StyledMessage>
      </div>
    );
  }

  let body;
  if (
    !props.currentChat.isChannel ||
    props.connectedRooms.includes(props.currentChat.chatName)
  ) {
    body = <Messages>{props.messages.map(renderMessages)}</Messages>;
  } else {
    body = (
      <button onClick={() => props.joinRoom(props.currentChat.chatName)}>
        Join {props.currentChat.chatName}
      </button>
    );
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") {
      props.sendMessage();
    }
  }

  function handleGroupUsersDialogClose() {
    let room = {};
    let ids = [];
    checked.map((index) => {
      ids.push(props.allUsers[index].id);
    });
    room[currGroupName] = ids;
    props.socketRef.current.emit("room created", room);
    setShowGroupUsersDialog(false);
    setChecked([]);
  }

  return (
    <div>
      <Container>
        <SideBar>
          <img src={logo} alt="Logo" style={{ paddingBottom: "20px" }} />
          <h3>{props.username}</h3>
          <Button
            variant="contained"
            onClick={() => {
              setShowGroupNameDialog(true);
            }}
            startIcon={<AddIcon />}
          >
            Create Group
          </Button>
          <h3>Groups</h3>
          {props.rooms.map(renderRooms)}
          <h3>All Users</h3>
          {props.allUsers.map(renderUser)}
        </SideBar>
        <ChatPanel>
          <ChannelInfo>{props.currentChat.chatName}</ChannelInfo>
          <BodyContainer>{body}</BodyContainer>
          <TextBox
            value={props.message}
            onChange={props.handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder="say something...."
          />
        </ChatPanel>
      </Container>
      <Dialog open={showGroupNameDialog}>
        <DialogTitle>Enter Group Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="GroupName"
            type="text"
            fullWidth
            variant="standard"
            onChange={(e) => {
              setCurrGroupName(e.target.value);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowGroupNameDialog(false);
              setShowGroupUsersDialog(true);
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showGroupUsersDialog}>
        <DialogTitle>Select Members</DialogTitle>
        <DialogContent>
          <List
            sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
          >
            {props.allUsers.map((value, i) => {
              const labelId = value.username;

              return (
                <ListItem key={value} disablePadding>
                  <ListItemButton
                    role={undefined}
                    onClick={handleToggle(i)}
                    dense
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={checked.includes(i)}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ "aria-labelledby": labelId }}
                      />
                    </ListItemIcon>
                    <ListItemText id={labelId} primary={`${labelId}`} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGroupUsersDialogClose}>OK</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
export default Chat;
