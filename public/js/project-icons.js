async function uploadIcons() {
    const id = document.getElementById("projectId").textContent;
    const fileInput = document.getElementById("iconUpload");

    // Allow user to select multiple files
    const files = await new Promise((resolve) => {
        fileInput.onchange = () => {
            // Convert FileList to an array
            resolve([...fileInput.files]);
        };
        fileInput.click();
    });

    if (!files.length) return alert("Select at least one SVG file!");

    const uploads = files.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async function(event) {
                const base64Data = event.target.result;

                try {
                    let response = await fetch(`http://localhost:3000/projects/${id}/upload-icon`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: file.name, data: base64Data })
                    });

                    if (response.ok) {
                        resolve(await response.json());
                    } else {
                        reject("Upload failed for " + file.name);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.readAsDataURL(file);
        });
    });

    try {
        await Promise.all(uploads);
        await loadIcons(id);
    } catch (error) {
        alert(error);
    }
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
