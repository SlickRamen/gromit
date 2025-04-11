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
server.use(express.json());// Serve static files from the output directory

server.use("/output", express.static(path.join(__dirname, "output")));
server.use("/temp", express.static(path.join(__dirname, "temp")));

// Ensure output directory exists
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Function to generate the web font
async function generateFont(projectId) {
  const jsonFile = "projects.json"; // Update with your actual file

  // Read and parse the JSON file
  const jsonData = JSON.parse(fs.readFileSync(jsonFile, "utf8"));

  // Find the project by ID
  const project = jsonData.find((p) => p.id === projectId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found.`);
  }

  // Create a temp folder for SVG files
  const dump = path.join(tempDir, "icons_" + projectId);
  if (!fs.existsSync(dump)) fs.mkdirSync(dump);

  let projectFromId = jsonData.find((p) => p.id === projectId);

  if (!projectFromId) {
    console.error("Error finding project");
    return;
  }

  const iconsMap = project.icons.map((icon) => {
    const base64Data = icon.data.replace(/^data:image\/svg\+xml;base64,/, "");
    const svgBuffer = Buffer.from(base64Data, "base64");

    const name = icon.name.replace(".svg", ""); // Remove .svg extension
    return { name, svgBuffer };
  }).sort((a, b) => a.name.localeCompare(b.name));


// Convert Base64 SVGs to files
  const iconPaths = iconsMap.map(({ name, svgBuffer }) => {
    const svgData = Buffer.from(svgBuffer, "base64").toString("utf-8");
    const filePath = path.join(dump, `${name}.svg`);
    fs.writeFileSync(filePath, svgData);
    return filePath;
  });

// Check if files exist
  console.log("Generated SVG Paths:", fs.readdirSync(dump));

  const webfont = require("webfont").default;

  const outputPath = path.join(__dirname, `output/${projectFromId.name}-grom` );
  console.log("Expected Output Path:", outputPath);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const fontName = `${projectFromId.name}-grom`

  const unicodeStart = 0xe900;
  const codepoints = {};
  iconPaths.forEach((path, index) => {
    const name = path.split('/').pop().replace('.svg', '');
    codepoints[name] = unicodeStart + index;
  });


  webfont({
    files: path.join(dump, "*.svg").replace(/\\/g, "/"),
    fontName: fontName,
    formats: ["woff", "woff2", "ttf"],
    dest: outputPath,
    prependUnicode: true,
    normalize: true,
    centerHorizontally: true,
    startUnicode: unicodeStart,
    glyphTransformFn: obj => obj,
    codepoints: codepoints,
  })
      .then((result) => {
        console.log("Font generated successfully!");

        const fontFiles = {
          woff: result.woff,
          woff2: result.woff2,
          ttf: result.ttf,
        };

        for (const [format, buffer] of Object.entries(fontFiles)) {
          if (buffer) {
            const filePath = path.join(outputPath, `${fontName}.${format}`);
            fs.writeFileSync(filePath, buffer);
            console.log(`${format.toUpperCase()} file saved at: ${filePath}`);
          }
        }
        // Generate the CSS file
        let cssContent = `
@font-face {
  font-family: '${fontName}';
  src: url('${fontName}.woff2') format('woff2'),
       url('${fontName}.woff') format('woff'),
       url('${fontName}.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

[class^="icon-"], [class*=" icon-"] {
  font-family: '${fontName}' !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 0;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.use-line-height {
  line-height: 1;
}
`;

        // Generate icon classes
        let unicodeStart = 0xe900; // Start Unicode range
        iconsMap.forEach(({ name }, index) => {
          const unicode = `\\${(unicodeStart + index).toString(16)}`;
          cssContent += `\n.icon-${name}:before { content: "${unicode}"; }`;
        });

        // Save CSS file
        const cssFilePath = path.join(outputPath, `${fontName}.css`);
        fs.writeFileSync(cssFilePath, cssContent);
        console.log(`CSS file saved at: ${cssFilePath}`);
      })
      .catch((error) => {
        console.error("Error generating icon font:", error);
      });

}

// API route to trigger the script
server.post("/generate-font", async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: "Missing projectId" });
  }

  try {
    const message = await generateFont(projectId);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


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
      icon: path.join(__dirname, 'public/img', 'favicon.ico'),
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
