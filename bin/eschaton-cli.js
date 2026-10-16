#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
try { require("../postinstall.js"); } catch (_) {}
const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
const localExe = path.join(localAppData, "eschaton", "bin", "eschaton.exe");
const bundledExe = path.join(__dirname, "..", "native", "bin", "eschaton.exe");
const exe = fs.existsSync(localExe) ? localExe : bundledExe;
const res = spawnSync(exe, process.argv.slice(2), { stdio: "inherit", windowsHide: false });
process.exit(res.status !== null ? res.status : 1);