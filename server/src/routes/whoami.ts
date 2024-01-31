import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

const whoami: RequestHandler = (req, res) => {
  const userDesktopPath = path.join(require("os").homedir(), "Desktop");
  const folderName = "mindapp";

  const identities = {
    "localhost:5173": { self: "public key" },
    "mindapp.cc": { mike: "public key" },
    "space-url": { username: "public key", multiple: "personas" },
  };

  res.send(`<pre>
${JSON.stringify(identities, null, 2)}
</pre>`);
};

export default whoami;
