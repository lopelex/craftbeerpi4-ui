import { makeStyles } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import React, { createContext, useCallback, useContext, useMemo, useState, useImperativeHandle } from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useCBPi } from '../data';

import { notificationapi } from "../data/notificationapi";

export const ActionDialog = ({ item }) => {
  const alert = useAlert();

  const call_action = (dialog_id, action) => {
    alert.remove(dialog_id);
    notificationapi.action(dialog_id, action, (data) => {
      console.log(data);
    });
  };

  return (
    <Dialog open={true} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
      <DialogTitle id="alert-dialog-title">{item.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{item.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {item.action.map((a) => {
          return (
            <Button onClick={() => call_action(item.id, a.id)} color="primary">
              {a.label}
            </Button>
          );
        })}
      </DialogActions>
    </Dialog>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    position: "absolute",
    bottom: 10,
    right: 30,
    "& > * + *": {
      marginTop: theme.spacing(1),
    },
  },
}));

export const AlertContext = createContext({});

export const AlertProvider = React.forwardRef((props, ref) => {
  const classes = useStyles();
  const [alerts, setAlerts] = useState([]);
  const { state } = useCBPi();

  useImperativeHandle(
    ref,
    () => ({
        showAlert(id, title = "", message = "", type = "info", action = null, timeout = 5000) {
            show(id, title, message, type, action, timeout);
        }
    }),
  )

  const isPlaying = (audio) => {
    return audio
        && audio.currentTime > 0
        && !audio.paused
        && !audio.ended
        && audio.readyState > 2;
  };

  const url = '/cbpi_ui/static/sound.mp3';
  const audio = new Audio(url);

  const play = () =>  {
    if (!isPlaying(audio)) {
      var result = audio.play();
      if (result !== undefined) {
        result.then(() => {}).catch(error => {});
      }
    }
  };

  const remove = useCallback((id) => {
    setAlerts((value) => {
      return value.filter((a) => a.id !== id);
    });
  }, []);

  const show = useCallback((id, title = "", message = "", type = "info", action = null, timeout = 5000) => {
    const alert = {
      id,
      title,
      message,
      type,
      action,
    };

    if (action?.length <= 0) {
      const timerId = setTimeout(() => {
        remove(id);
      }, timeout);
    }

    setAlerts((state) => state.concat(alert));
    if (state.sound){
      play();
    }
    return alert;
  }, []);

  const value = {
    alerts,
    show,
    remove,
  };


  return (
    <AlertContext.Provider value={value}>
      {props.children}

      <div className={classes.root}>
        {alerts.map((a) => {
          if (a?.action?.length > 0) {
            return <ActionDialog key={a.id} item={a} />;
          } else {
            return <Alert severity={a.type || "info"} key={a.id}>{a.title} - {a.message}</Alert>;
          }
        })}
      </div>
    </AlertContext.Provider>
  );
});

export const useAlert = (Context) => {
  const alertContext = useContext(AlertContext);
  const alert = useMemo(() => {
    return alertContext;
  }, [alertContext]);
  return alert;
};
