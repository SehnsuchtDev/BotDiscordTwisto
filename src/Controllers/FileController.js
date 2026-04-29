import fs from 'fs/promises';
import path from 'path';

export const saveJsonToFile = async (data, filename) => {
    const jsonData = JSON.stringify(data, null, 2);
    const filePath = path.join(process.cwd(), "/src/assets/", filename);

    try {
        await fs.writeFile(filePath, jsonData, 'utf8');
    } catch (error) {
        console.error("Error saving JSON to file:", error);
    }
}

export const getJsonFromFile = async (filename) => {
    const filePath = path.join(process.cwd(), "/src/assets/", filename);
    let fileData = null;

    try {
        fileData = await fs.readFile(filePath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn("File not found, returning null:", filename);
            return null;
        }
        console.error("Error reading JSON from file:", error);
        return null;
    }

    let json = null;
    try {
        json = JSON.parse(fileData);
    } catch (error) {
        console.error("Error parsing JSON");
    }

    return json
}