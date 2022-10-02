import fs from "fs";
import sharp from "sharp";

const IMAGE_MAX_WIDTH = 1600;
const INPUT_DIRECTORY_PATH = "/Users/george/Desktop/Web/Originals";
const OUTPUT_DIRECTORY_PATH = "/Users/george/Desktop/Web/Output";

async function generateFileLists() {
  let jpgFiles = [];
  let pngFiles = [];
  let standardFiles = [];
  let remainingDirectories = [];

  remainingDirectories.push(INPUT_DIRECTORY_PATH);

  while (remainingDirectories.length != 0) {
    const currentDirectory = remainingDirectories.pop();
    const paths = await fs.promises.readdir(currentDirectory);

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const fullPath = currentDirectory + "/" + path;
      const stat = await fs.promises.lstat(fullPath);

      if (stat.isDirectory()) {
        remainingDirectories.push(fullPath);
        continue;
      }

      if (stat.isFile() && !path.startsWith(".")) {
        const extension = path.split(".").pop();
        if (["jpg", "jpeg"].includes(extension)) {
          jpgFiles.push(fullPath);
          continue;
        }
        if (extension == "png") {
          pngFiles.push(fullPath);
          continue;
        }
        if (extension == "heic") {
          // Do nothing for now, we don't have a way to process
          continue;
        }

        standardFiles.push(fullPath);
      }
    }
  }
  return [jpgFiles, pngFiles, standardFiles];
}

async function buildOutputDirectories(paths) {
  for (let i = 0; i < paths.length; i++) {
    await buildOutputDirectory(paths[i]);
  }
}

async function buildOutputDirectory(path) {
  path = path.replace(INPUT_DIRECTORY_PATH, OUTPUT_DIRECTORY_PATH);
  path = path.slice(0, path.lastIndexOf("/"));
  await fs.promises.mkdir(path, { recursive: true });
}

async function processJpgFiles(paths) {
  for (let i = 0; i < paths.length; i++) {
    await processJpg(paths[i]);
  }
}

async function processJpg(path) {
  const newBasePath = path
    .slice(0, path.lastIndexOf("."))
    .replace(INPUT_DIRECTORY_PATH, OUTPUT_DIRECTORY_PATH);
  const newJpgPath = newBasePath + ".jpg";
  const newAvifPath = newBasePath + ".avif";

  await sharp(path)
    .resize({
      width: IMAGE_MAX_WIDTH,
    })
    .rotate()
    .toFile(newJpgPath);

  await sharp(path)
    .resize({
      width: IMAGE_MAX_WIDTH,
    })
    .rotate()
    .avif({
      quality: 85,
    })
    .toFile(newAvifPath);
}

async function processPngFiles(paths) {
  for (let i = 0; i < paths.length; i++) {
    processPngFile(paths[i]);
  }
}

async function processPngFile(path) {
  const newPngPath = path.replace(INPUT_DIRECTORY_PATH, OUTPUT_DIRECTORY_PATH);

  await sharp(path)
    .resize({
      width: IMAGE_MAX_WIDTH,
    })
    .rotate()
    .toFile(newPngPath);
}

async function processStandardFiles(paths) {
  // TODO
}

const [jpgFiles, pngFiles, standardFiles] = await generateFileLists();
const allFiles = [...jpgFiles, ...pngFiles, ...standardFiles];
await buildOutputDirectories(allFiles);
await processJpgFiles(jpgFiles);
await processPngFiles(pngFiles);
await processStandardFiles(standardFiles);
