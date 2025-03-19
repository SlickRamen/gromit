async function uploadIcon() {
    const id = document.getElementById("projectId").textContent;
    const fileInput = document.getElementById("iconUpload");

    // Wait for user to select a file
    const file = await new Promise((resolve) => {
        fileInput.onchange = () => {
            resolve(fileInput.files[0]);
        };
        fileInput.click();
    });

    if (!file) return alert("Select an SVG file first!");

    const reader = new FileReader();

    reader.onload = async function(event) {
        const base64Data = event.target.result;

        let response = await fetch(`http://localhost:3000/projects/${id}/upload-icon`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: file.name, data: base64Data })
        });

        if (response.ok) {
            const result = await response.json();
            await loadIcons(id);
        } else {
            alert("Upload failed.");
        }
    };

    reader.readAsDataURL(file);
}

// Fetch & Display Icons
async function loadIcons(id) {
    let response = await fetch(`http://localhost:3000/projects/${id}/icons`);
    let icons = await response.json();

    let iconGrid = document.getElementById("iconGrid");
    iconGrid.innerHTML = ""; // Clear previous

    icons.forEach(icon => {
        let img = document.createElement("img");
        img.classList.add("icon");
        img.src = icon.data;
        iconGrid.appendChild(img);
    });
}
