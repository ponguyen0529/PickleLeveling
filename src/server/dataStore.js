const fs = require("fs");
const path = require("path");

const resolveDataPath = () => {
  const envPath = process.env.DATA_PATH || process.env.DATA_FILE;
  const target = envPath ? path.resolve(envPath) : path.join(__dirname, "..", "..", "data", "db.json");
  return target;
};

let cachedPath = resolveDataPath();

function ensureFile() {
  const dir = path.dirname(cachedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(cachedPath)) {
    fs.writeFileSync(
      cachedPath,
      JSON.stringify(
        {
          users: []
        },
        null,
        2
      )
    );
  }
}

async function read() {
  const current = resolveDataPath();
  if (current !== cachedPath) {
    cachedPath = current;
  }
  ensureFile();
  const raw = await fs.promises.readFile(cachedPath, "utf-8");
  return JSON.parse(raw);
}

async function write(data) {
  ensureFile();
  await fs.promises.writeFile(
    cachedPath,
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

module.exports = {
  read,
  write
};
