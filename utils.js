const fs = require('fs');
const path = require('path');

// Helper function to get the full path for a file
function getFilePath(filename) {
    return path.join(__dirname, '../data', filename);
}

function readData(filename) {
    const filePath = getFilePath(filename);
    try {
        // Check if the file exists before reading
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return []; // Return an empty array if the file doesn't exist
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading file:", error);
        return []; // Return an empty array on error
    }
}

function writeData(filename, data) {
    const filePath = getFilePath(filename);
    try {
        // Ensure the directory exists before writing
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // Create the directory if it doesn't exist
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing file:", error);
    }
}


module.exports = { readData, writeData };
