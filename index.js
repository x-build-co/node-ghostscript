var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var { promisify } = require('util');
var execPromise = promisify(exec);

var cwd = process.cwd();

var create = function () {
  return new gs();
};

var gs = function () {
  this.options = [];
  this._input = null;
  this._executablePath = 'gs'; // Default to 'gs'
  this.tempFolder = path.join(cwd, "temp");
};

gs.prototype.batch = function () {
  this.options.push('-dBATCH');
  return this;
};

gs.prototype.device = function (device) {
  device = device || 'jpeg';
  this.options.push('-sDEVICE=' + device);
  return this;
};

// Method to set the Ghostscript executable path
gs.prototype.setExecutablePath = function (path) {
  this._executablePath = path;
  return this;
};

gs.prototype.exec = function (callback) {
  var self = this;

  if (!this._input) return callback("Please specify input");

  var args = this.options.concat([this._input]).join(' ');
  exec(this._executablePath + ' ' + args, function (err, stdout, stderr) {
    callback(err, stdout, stderr);
  });
};

gs.prototype.input = function (file) {
  this._input = file;
  return this;
};

gs.prototype.jpegq = function (value) {
  value = value || 75;
  this.options.push('-dJPEGQ=' + value);
  return this;
};

gs.prototype.dsfactor = function (value) {
  value = value || 1;
  this.options.push('-dDownScaleFactor=' + value);
  return this;
};

gs.prototype.nopause = function () {
  this.options.push('-dNOPAUSE');
  return this;
};

gs.prototype.output = function (file) {
  file = file || '-';
  this.options.push('-sOutputFile=' + file);
  if (file === '-') return this.quiet();
  return this;
};

gs.prototype.q = gs.prototype.quiet;

gs.prototype.quiet = function () {
  this.options.push('-dQUIET');
  return this;
};

gs.prototype.resolution = function (xres, yres) {
  this.options.push('-r' + xres + (yres ? 'x' + yres : ''));
  return this;
};

gs.prototype.r = gs.prototype.res = gs.prototype.resolution;

// New method specifically for PDF compression
gs.prototype.compressPdf = async function (base64Input) {
  const hasTempFolder = fs.existsSync(this.tempFolder);
  if (!hasTempFolder) {
    await fs.mkdir(this.tempFolder);
  }

  const inputFilePath = path.join(this.tempFolder, "original.pdf");
  const outputFilePath = path.join(this.tempFolder, "compressed.pdf");
  await fs.writeFile(inputFilePath, base64Input, "base64");

  this.batch().nopause().quiet().device('pdfwrite').output(outputFilePath).input(inputFilePath);

  var args = this.options.concat([this._input]).join(' ');
  await execPromise(this._executablePath + ' ' + args);

  const compressedFileBase64 = await fs.readFile(outputFilePath, "base64");
  await fs.unlink(inputFilePath);
  await fs.unlink(outputFilePath);

  return compressedFileBase64;
};


module.exports = create;
