
document.addEventListener("DOMContentLoaded", () => {
    // const params = new URLSearchParams(window.location.search);
    // const projectId = params.get("id");

    const projectList = document.getElementById("projectList");
    const addProjectBtn = document.getElementById("addProjectButton");
    const projectModal = document.getElementById("projectModal");
    const addProjectForm = document.getElementById("addProjectForm");

    function loadProjects() {
        fetch("http://localhost:3000/projects")
        .then(res => res.json())
        .then(projects => {
            projectList.innerHTML = "";

            projects.forEach(project => {
                const wrapper = document.createElement("div");
                wrapper.className = "project-wrapper";

                const elementId = document.createElement("span");
                elementId.style.display = "none";
                elementId.className = "project-id-label";
                elementId.textContent = project.id;

                wrapper.appendChild(elementId);

                const title = document.createElement("span");
                title.className = "project-name project-content";
                title.textContent = project.name;

                title.onclick = function () {toggleProject(title)};
                wrapper.appendChild(title);

                const itemList = document.createElement("div");
                itemList.className = "package";

                let id = 0;
                project.icons.forEach((item) => {

                    const itemRep = document.createElement("div");
                    itemRep.className = "project-item";
                    itemRep.textContent = `${item.name.split(".")[0]}`;
                    itemRep.style.backgroundImage = `url(${item.data})`;
                    itemList.appendChild(itemRep);
                    id += 1;
                })

                wrapper.appendChild(itemList);

                projectList.appendChild(wrapper);

                toggleProject(title, true);
            });

        })
        .catch(err => console.error("Error loading projects:", err));
    }

    if (addProjectBtn) {
        addProjectBtn.addEventListener("click", async () => {
            projectModal.style.display = "block";
        });
    }

    if (addProjectForm) {
        addProjectForm.addEventListener("submit", function (event) {
            const projectName = document.getElementById("name").value.trim();

            if (!projectName) {
                return;
            }

            // Send to backend
            fetch("http://localhost:3000/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: projectName })
            })
                .then(res => res.json())
                .then(project => {
                    console.log("Project added:", project);
                    loadProjects(); // Refresh project list
                })
                .catch(err => console.error("Error adding project:", err));

        });
    }

    loadProjects();
});

function loadProjectDetails(id) {
    const projectsPane = document.getElementById("projectPane");

    // Check if we can find it
    if (projectsPane) {
        fetch(`http://localhost:3000/projects/${id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to load project");
                }
                return res.json();
            })
            .then(async project => {
                document.getElementById("infoPane").style.display = "none";
                document.getElementById("projectPane").style.display = "block";

                document.getElementById("projectTitle").innerHTML = `<i class="icon-folder" style="margin-right: 0.5rem; font-size: 2rem;"></i>${project.name}`;
                document.getElementById("projectId").textContent = project.id;

                await loadIcons(project.id);
            })
            .catch(err => console.error("Error loading projects:", err));

    }
}