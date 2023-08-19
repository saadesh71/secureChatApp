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
`;

const SideBar = styled.div`
  height: 100%;
  width: 10%;
  border-right: 1px solid black;
;l`;

const ChatPanel = styled.div`
  height: 100;
  width: 85%;
  display: flex;
  flex-direction: column;
`;

const BodyContainer = styled.div`
  width: 100%;
  height: 75%;
  overflow: scroll;
  border-bottom: 1px solid black;
`;

const TextBox = styled.textarea`
  height: 15%;
  width: 100%;
`;

const ChannelInfo = styled.div`
  height: 10%;
  width: 100%;
  border-bottom: 1px solid black;
  font-weight: bold;
`;

const Row = styled.div`
  cursor: pointer;
`;

const Messages = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
    console.log(props.allUsers);
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
              console.log(props.userPins);
              console.log(props.currentChat.chatName);
              props.toggleChat(currentChat);
            }}
            key={user.id}
          >
            <div style={{ display: "flex" }}>
              <div style={{ paddingLeft: 10, paddingTop: 8 }}>
                {user.username}
              </div>
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
    return (
      <div key={index}>
        <h3>{message.sender}</h3>
        <p>{message.content}</p>
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
    console.log(room);
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
