import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import { useState } from "react";
import axios from "axios";

export default function BombConfDialog({ open, type, mission, onClose, refetchScores }) {

  const handleUpload = async () => {
    try {
      const params = { type, missionId: mission.id };
      const res = await axios.post(
        `/api/scores/mission`,
        params,
        { withCredentials: true }
      );

      alert(res.data.message || `${type} confidences set successfully.`);

      refetchScores();
      onClose();
    } catch (err) {
      console.error("Mission confidence set failed:", err);
      alert(err.response?.data?.error || "Mission confidence set failed. Try again or report this.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Set All Confident</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>Are you sure? This will set all of your {type} scores to confident for this mission. You can only undo this by manually changing confidence scores back or deleting all of your data.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleUpload} variant="contained">Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}