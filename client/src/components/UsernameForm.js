import React from "react";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@mui/material/Button";
import logo from "./logo.png";
import "./Form.css"; // Assuming you have a CSS file for styles

const useStyles = makeStyles({
  input: {
    "& input[type=number]::-webkit-outer-spin-button": {
      "-webkit-appearance": "none",
      margin: 0,
    },
    "& input[type=number]::-webkit-inner-spin-button": {
      "-webkit-appearance": "none",
      margin: 0,
    },
  },
});

function Form(props) {
  const classes = useStyles();
  return (
    <div className="form-container">
      {" "}
      {/* This will be the flex container */}
      <form className="centered-form">
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
            onInput={(e) => {
              e.target.value = Math.max(0, parseInt(e.target.value))
                .toString()
                .slice(0, 4);
            }}
            type="number"
            className={classes.input}
          />
        </div>
        <div>
          <Button onClick={props.connect}>Connect</Button>
        </div>
      </form>
    </div>
  );
}

export default Form;
