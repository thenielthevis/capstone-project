const multer = require('multer');

const storage = multer.memoryStorage(); // store file in memory buffer

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

module.exports = upload;