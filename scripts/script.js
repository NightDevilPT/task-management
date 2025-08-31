// copy.js
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

function scanDirectory(dir, fileList = []) {
	const files = fs.readdirSync(dir);

	files.forEach((file) => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		// Check if this is a directory to exclude
		const isExcludedDir = config.excludeDirs.some((excludeDir) => {
			return (
				filePath.includes(path.sep + excludeDir + path.sep) ||
				filePath.endsWith(path.sep + excludeDir)
			);
		});

		// Check if this file matches exclude glob patterns
		const isExcludedGlob = config.excludeGlobs.some((glob) => {
			const pattern = new RegExp(glob.replace(/\*/g, ".*"));
			return pattern.test(filePath);
		});

		if (stat.isDirectory() && !isExcludedDir && !isExcludedGlob) {
			scanDirectory(filePath, fileList);
		} else if (stat.isFile()) {
			// Check if file extension is included
			const ext = path.extname(file).toLowerCase();
			const isIncludedExtension = config.includeExtensions.includes(ext);

			if (isIncludedExtension && !isExcludedDir && !isExcludedGlob) {
				fileList.push(filePath);
			}
		}
	});

	return fileList;
}

function generateFileList(files) {
	let content = "";
	files.forEach((file) => {
		content += file + "\n";
	});
	return content;
}

function generateFileListWithCode(files) {
	let content = "";
	files.forEach((file) => {
		content += `// File: ${file}\n`;
		content += "// " + "=".repeat(80) + "\n\n";

		try {
			const fileContent = fs.readFileSync(file, "utf8");
			content += fileContent + "\n\n";
			content += "// " + "=".repeat(80) + "\n\n";
		} catch (error) {
			content += `// Error reading file: ${error.message}\n\n`;
			content += "// " + "=".repeat(80) + "\n\n";
		}
	});
	return content;
}

function main() {
	try {
		console.log("Starting directory scan...");

		// Get all files
		const allFiles = scanDirectory(config.inputDir);
		console.log(`Found ${allFiles.length} files to process`);

		// Generate file list (file 1)
		const fileListContent = generateFileList(allFiles);
		fs.writeFileSync(config.outputListPath, fileListContent);
		console.log(`File list saved to: ${config.outputListPath}`);

		// Generate file list with code (file 2)
		const fileListWithCodeContent = generateFileListWithCode(allFiles);
		fs.writeFileSync(config.outputCodePath, fileListWithCodeContent);
		console.log(`File list with code saved to: ${config.outputCodePath}`);

		console.log("Process completed successfully!");
	} catch (error) {
		console.error("Error:", error.message);
		process.exit(1);
	}
}

// Run the script
main();
