import path from "path";
import cors from "cors";
import express from "express";
import root from "./routes/_root";
import searchLocalFs from "./routes/search-local-fs";
import whoami from "./routes/whoami";
import writeNote from "./routes/write-note";
import {
  getSettings,
  mindappRootPath,
  mkdirIfDne,
  touchIfDne,
} from "./utils/files";
import { Settings } from "./types/Settings";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", root);
app.get("/whoami", whoami);
app.post("/write-note", writeNote);
app.get("/search-local-fs", searchLocalFs);

app.listen(port, () => {
  touchIfDne(
    path.join(mindappRootPath, "settings.json"),
    JSON.stringify(new Settings())
  );
  mkdirIfDne(path.join(mindappRootPath, "spaces"));
  global.startDate = getSettings().startDate;
  console.log(`Server is running on http://localhost:${port}`);
});
