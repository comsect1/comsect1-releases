#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
const localExe = path.join(localAppData, "eschaton", "bin", "eschaton-gui.exe");
const bundledExe = path.join(__dirname, "..", "native", "bin", "eschaton-gui.exe");
if (!fs.existsSync(localExe) || (fs.existsSync(bundledExe) && fs.statSync(localExe).size !== fs.statSync(bundledExe).size)) {
  try { require("../postinstall.js"); } catch (_) {}
}
const exe = fs.existsSync(localExe) ? localExe : bundledExe;
const child = spawn(exe, process.argv.slice(2), { detached: true, stdio: "ignore", windowsHide: true });
child.unref();
process.exit(0);