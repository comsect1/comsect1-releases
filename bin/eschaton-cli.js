#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
const localExe = path.join(localAppData, "eschaton", "bin", "eschaton.exe");
const bundledExe = path.join(__dirname, "..", "native", "bin", "eschaton.exe");
if (!fs.existsSync(localExe) || (fs.existsSync(bundledExe) && fs.statSync(localExe).size !== fs.statSync(bundledExe).size)) {
  try { require("../postinstall.js"); } catch (_) {}
}
const exe = fs.existsSync(localExe) ? localExe : bundledExe;
const res = spawnSync(exe, process.argv.slice(2), { stdio: "inherit", windowsHide: false });
process.exit(res.status !== null ? res.status : 1);