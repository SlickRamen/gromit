const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require("fs");
const express = require("express");
require('ejs-electron'); // Automatically enables EJS rendering in Electron

let mainWindow;
const server = express();

const PORT = 3000;
const PROJECTS_FILE = path.join(__dirname, "projects.json");

// Middleware
server.use(express.json());

// Load projects from file
function loadProjects() {
  if (!fs.existsSync(PROJECTS_FILE)) fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(PROJECTS_FILE));
}

// Save projects
function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

// API Routes
server.get("/projects", (req, res) => res.json(loadProjects()));
server.get("/projects/:id", (req, res) => {
  const projects = loadProjects(); // Load projects from file
  const project = projects.find(p => p.id == req.params.id);

  console.log(project.name);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  res.json(project);
});

server.post("/projects", (req, res) => {
  let projects = loadProjects();
  const newProject = { id: Date.now(), name: req.body.name, icons: [] };
  projects.push(newProject);
  saveProjects(projects);
  res.json(newProject);
});

server.post("/projects/:id/upload-icon", (req, res) => {
  const { id } = req.params;
  const { name, data } = req.body; // SVG data from frontend (Base64 encoded)

  let projects = loadProjects();
  let project = projects.find(p => p.id == id);

  if (!project) return res.status(404).json({ error: "Project not found" });

  if (!project.icons) project.icons = [];
  project.icons.push({ name, data }); // Store inside JSON

  saveProjects(projects);
  res.json({ success: true });
});


server.get("/projects/:id/icons", (req, res) => {
  const { id } = req.params;
  let project = loadProjects().find(p => p.id == id);

  if (!project) return res.status(404).json({ error: "Project not found" });

  res.json(project.icons || []);
});

server.listen(PORT, () => {
  app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: true
      }
    });

    // Correct way to load an EJS file in Electron
    mainWindow.loadFile(path.join(__dirname, 'views', 'pages', 'index.ejs'));

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
