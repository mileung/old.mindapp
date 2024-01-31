import { RequestHandler } from "express";

const makeHtml = (route: string, description: string) => {
  return `<a target="_blank" href="/${route}"><h2>/${route}</h2></a>
<p>${description}</p>`;
};

const root: RequestHandler = (req, res) => {
  res.send(`<h1>Mindapp Local Server</h1>
${makeHtml("whoami", "Shows who you are for different spaces")}
`);
};

export default root;
