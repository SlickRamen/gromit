/**
 * When the page loads, close all the projects.
 */
document.addEventListener("DOMContentLoaded", function() {
    let projects = document.getElementsByClassName("project-wrapper");

    // Convert HTMLCollection to an array and iterate
    Array.from(projects).forEach(project => {
        toggleProject(project.querySelector(".project-name"), true); // Collapse all projects initially
    });
});


/**
 * Toggle a project's visibility.
 *
 * @param projectElement the element to update
 * @param forceClose to force the element to close itself
 */
function toggleProject(projectElement, forceClose) {
    let items = projectElement.parentNode.querySelector('.package');
    let projects = document.getElementsByClassName("project-wrapper");

    if (!forceClose) {
        Array.from(projects).forEach(project => {
            project.classList.remove("selected");
        });

        projectElement.parentNode.classList.add("selected");

        loadProjectDetails(projectElement.parentNode.getElementsByClassName("project-id-label")[0].textContent);
    }

    if ((items.style.display === "none" || items.style.display === "") && !forceClose) {
        items.style.display = "flex";
        projectElement.classList.add("active");
    } else {
        items.style.display = "none";
        projectElement.classList.remove("active");
    }
}
