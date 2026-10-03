const fs = require("node:fs/promises");
const path = require("node:path");

// Keep saved data beside the application files.
const dataFile = path.join(__dirname, "data.json");

// Read saved data, or return an empty state on the first run.
async function loadData() {
    let text;

    try {
        text = await fs.readFile(dataFile, "utf8");
    } catch (error) {
        if (error.code === "ENOENT") {
            return {
                users: [],
                tasks: [],
                nextUserId: 1,
                nextTaskId: 1
            };
        }

        throw error;
    }

    return JSON.parse(text);
}

// Write a complete snapshot before replacing the previous saved file.
async function saveData(data) {
    const temporaryFile = `${dataFile}.tmp`;

    await fs.writeFile(
        temporaryFile,
        JSON.stringify(data, null, 2),
        "utf8"
    );

    await fs.rename(temporaryFile, dataFile);
}

module.exports = { loadData, saveData };