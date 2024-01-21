var exec = require('child_process').exec;
var fs = require('fs/promises');
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
  this._output = null;
  this._executablePath = 'gs';
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

gs.prototype.exec = async function () {
  var self = this;

  if (!this._input) throw new Error("Please specify input");

  var args = this.options.concat([this._input]).join(' ');
  await execPromise(this._executablePath + ' ' + args);

  if (this._output) {
    const compressFileBase64 = await fs.readFile(this._output, "base64");
    await fs.unlink(this._input);
    await fs.unlink(this._output);
    return compressFileBase64;
  }
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

gs.prototype.inputBase64 = async function (base64) {
  const hasTempFolder = fs.existsSync(this.tempFolder);
  if (!hasTempFolder) {
    await fs.mkdir(this.tempFolder);
  }

  this._input = path.join(this.tempFolder, "original.pdf");
  await fs.writeFile(this._input, base64, "base64");
  return this;
};

// New method to set output as Base64
gs.prototype.outputBase64 = function () {
  this._output = path.join(this.tempFolder, "compress.pdf");
  this.output(this._output);
  return this;
};

module.exports = create;
