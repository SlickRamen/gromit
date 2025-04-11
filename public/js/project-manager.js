document.addEventListener("DOMContentLoaded", () => {
    const projectList = document.getElementById("projectList");
    const addProjectBtn = document.getElementById("addProjectButton");
    const editProjectBtn = document.getElementById("editProjectButton");
    const deleteProjectBtn = document.getElementById("deleteProjectButton");
    const projectModal = document.getElementById("projectModal");
    const projectEditModal = document.getElementById("projectEditModal");
    const projectDeleteModal = document.getElementById("projectDeleteModal");
    const addProjectForm = document.getElementById("addProjectForm");
    const editProjectForm = document.getElementById("editProjectForm");
    const deleteProjectForm = document.getElementById("deleteProjectForm");

    function loadProjects() {
        fetch("http://localhost:3000/projects")
        .then(res => res.json())
        .then(projects => {
            projectList.innerHTML = "";

            projects.forEach(project => {
                const wrapper = document.createElement("a");
                wrapper.className = "project-wrapper";

                const elementId = document.createElement("span");
                elementId.style.display = "none";
                elementId.className = "project-id-label";
                elementId.textContent = project.id;

                wrapper.appendChild(elementId);

                const title = document.createElement("a");
                title.className = "project-name project-content";
                title.textContent = project.name;
                title.href = "#";

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

    if (editProjectBtn) {
        editProjectBtn.addEventListener("click", async () => {
            const idElement = document.getElementById("projectId");
            const projectId = Number(idElement.textContent);

            console.log(projectId)

            try {
                const response = await fetch("http://localhost:3000/projects");
                const projects = await response.json();

                const project = projects.find(p => p.id === projectId);

                if (project) {
                    document.getElementById("existingId").value = project.id;
                    document.getElementById("editName").value = project.name;
                    document.getElementById("editDescription").value = project.description ?? "";
                    projectEditModal.style.display = "block";

                } else {
                    console.error("Not found");
                }
            } catch (err) {
                console.error("Failed to load: ", err);
            }
        });
    }

    if (deleteProjectBtn) {
        deleteProjectBtn.addEventListener("click", async () => {
            const idElement = document.getElementById("projectId");
            const projectId = Number(idElement.textContent);

            try {
                const response = await fetch("http://localhost:3000/projects");
                const projects = await response.json();

                const project = projects.find(p => p.id === projectId);

                if (project) {
                    document.getElementById("deleteId").value = project.id;
                    projectDeleteModal.style.display = "block";
                } else {
                    console.error("Not found");
                }
            } catch (err) {
                console.error("Failed to load: ", err);
            }
        });
    }

    if (addProjectForm) {
        addProjectForm.addEventListener("submit", function (event) {
            const projectName = document.getElementById("name").value.trim();
            const projectDescription = document.getElementById("description").value.trim();

            if (!projectName) {
                return;
            }

            // Send to backend
            fetch("http://localhost:3000/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: projectName, description: projectDescription })
            })
                .then(res => res.json())
                .then(project => {
                    console.log("Project added:", project);
                    loadProjects(); // Refresh project list
                })
                .catch(err => console.error("Error adding project:", err));

        });
    }

    if (editProjectForm) {
        editProjectForm.addEventListener("submit", function (event) {
            const projectExistingId = document.getElementById("existingId").value.trim();
            const projectName = document.getElementById("editName").value.trim();
            const projectDescription = document.getElementById("editDescription").value.trim();

            if (!projectName) {
                return;
            }

            // Send to backend
            fetch("http://localhost:3000/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: projectExistingId, name: projectName, description: projectDescription })
            })
                .then(res => res.json())
                .then(project => {
                    console.log("Project updated or added:", project);
                    loadProjects(); // Refresh project list
                })
                .catch(err => console.error("Error adding project:", err));

        });
    }

    if (deleteProjectForm) {
        deleteProjectForm.addEventListener("submit", function (event) {
            const projectId = document.getElementById("deleteId").value.trim();

            if (!projectId) {
                return;
            }

            // Send to backend
            fetch(`http://localhost:3000/projects/${projectId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            })
                .then(res => res.json())
                .then(project => {
                    console.log("Project deleted:", project);
                    loadProjects(); // Refresh project list
                })
                .catch(err => console.error("Error deleting project:", err));

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
                document.getElementById("projectDescription").innerHTML = `${project.description ?? "A Gromit project"}`;
                document.getElementById("projectId").textContent = project.id;

                await loadIcons(project.id);
            })
            .catch(err => console.error("Error loading projects:", err));

    }
}