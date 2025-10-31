import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import { useState } from "react";
import axios from "axios";

export default function UploadDialog({ open, type, onClose, refetchScores }) {
  const [file, setFile] = useState(null);
  const [logUrl, setLogUrl] = useState("");
  const [role, setRole] = useState("defuser");

  const handleUpload = async () => {
    if (!file && type === "profile") {
      alert("Please select a file to upload.");
      return;
    }
    if (!file && !logUrl && type === "log") {
      alert("Please upload a log file or provide a log link.");
      return;
    }

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (logUrl) formData.append("logUrl", logUrl);
      formData.append("type", type);
      formData.append("role", role);

      const res = await axios.post(`/api/scores/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message || `${type} uploaded successfully.`);
      refetchScores();
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.error || "Upload failed. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Upload {type}</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>Is the profile for expert or defuser?</Typography>
        <RadioGroup row value={role} onChange={(e) => setRole(e.target.value)}>
          <FormControlLabel value="defuser" control={<Radio />} label="Defuser" />
          <FormControlLabel value="expert" control={<Radio />} label="Expert" />
          <FormControlLabel value="both" control={<Radio />} label="Both" />
          {type === "profile" && <FormControlLabel value="solo" control={<Radio />} label="Solo" />}
        </RadioGroup>
        <Box mt={2}><input type="file" onChange={(e) => setFile(e.target.files[0])} /></Box>
        {type === "log" && (
          <Box mt={2}>
            <Typography gutterBottom>Upload a file or paste a Logfile Analyzer link:</Typography>
            <Typography align="center" variant="body2" sx={{ my: 1 }}>— or —</Typography>
            <input
              type="text"
              placeholder="https://ktane.timwi.de/More/Logfile%20Analyzer.html#file=..."
              value={logUrl}
              onChange={(e) => setLogUrl(e.target.value)}
              style={{ width: "100%" }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpload} variant="contained">Upload</Button>
      </DialogActions>
    </Dialog>
  );
}