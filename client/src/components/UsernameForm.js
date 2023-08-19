import React from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import logo from "./logo.png";

function Form(props) {
  return (
    <form>
      <div>
        <img src={logo} alt="Logo" style={{ paddingBottom: "10px" }} />
      </div>
      <div>
        <TextField
          label="Username"
          type="text"
          value={props.username}
          onChange={props.onChange}
          style={{ paddingBottom: "20px" }}
        />
      </div>
      <div>
        <TextField
          label="Pin"
          type="number"
          value={props.privatePin}
          onChange={props.onPrivatePinChange}
          style={{ paddingBottom: "20px" }}
        />
      </div>
      <div>
        <Button onClick={props.connect}>Connect</Button>
      </div>
    </form>
  );
}

export default Form;
