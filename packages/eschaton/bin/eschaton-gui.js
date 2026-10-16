#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
try { require("../postinstall.js"); } catch (_) {}
const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
const localExe = path.join(localAppData, "eschaton", "bin", "eschaton-gui.exe");
const bundledExe = path.join(__dirname, "..", "native", "bin", "eschaton-gui.exe");
const exe = fs.existsSync(localExe) ? localExe : bundledExe;
const child = spawn(exe, process.argv.slice(2), { detached: true, stdio: "ignore", windowsHide: true });
child.unref();
process.exit(0);