const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "..", "data", "db.json");

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(
      DATA_PATH,
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
  ensureFile();
  const raw = await fs.promises.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function write(data) {
  ensureFile();
  await fs.promises.writeFile(
    DATA_PATH,
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

module.exports = {
  read,
  write
};
