const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

function sha256File(p) {
  try {
    if (!fs.existsSync(p)) return "";
    return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").toLowerCase();
  } catch (_) {
    return "";
  }
}

function sleepMs(ms) {
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (_) {}
}

try {
  if (process.platform === "win32") {
    const feedUrl = "https://github.com/comsect1/comsect1-releases/releases/download/eschaton-latest";
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const homeDir = path.join(localAppData, "eschaton");
    const destBin = path.join(homeDir, "bin");
    const destSdk = path.join(homeDir, "sdk", "lib");
    const hostDir = path.join(homeDir, "host");
    fs.mkdirSync(destBin, { recursive: true });
    fs.mkdirSync(destSdk, { recursive: true });
    fs.mkdirSync(hostDir, { recursive: true });

    const feedFile = path.join(hostDir, "update_feed.txt");
    if (!fs.existsSync(feedFile)) {
      try { fs.writeFileSync(feedFile, feedUrl + "\n", "utf8"); } catch (_) {}
    }

    const srcBin = path.join(__dirname, "native", "bin");
    const sManifest = path.join(__dirname, "release_manifest.json");
    let expectedExeSha = sha256File(path.join(srcBin, "eschaton.exe"));
    let expectedGuiSha = sha256File(path.join(srcBin, "eschaton-gui.exe"));
    if ((!expectedExeSha || !expectedGuiSha) && fs.existsSync(sManifest)) {
      try {
        const man = JSON.parse(fs.readFileSync(sManifest, "utf8"));
        if (Array.isArray(man.files)) {
          for (const f of man.files) {
            if (f.path === "bin/eschaton.exe") expectedExeSha = (f.sha256 || "").toLowerCase();
            if (f.path === "bin/eschaton-gui.exe") expectedGuiSha = (f.sha256 || "").toLowerCase();
          }
        }
      } catch (_) {}
    }

    const destExe = path.join(destBin, "eschaton.exe");
    const destGui = path.join(destBin, "eschaton-gui.exe");
    const actualExeSha = sha256File(destExe);
    const actualGuiSha = sha256File(destGui);
    const needsUpdate =
      !actualExeSha ||
      !actualGuiSha ||
      (expectedExeSha && actualExeSha !== expectedExeSha) ||
      (expectedGuiSha && actualGuiSha !== expectedGuiSha);

    if (needsUpdate) {
      if (fs.existsSync(path.join(srcBin, "eschaton.exe"))) {
        try { execSync("taskkill /F /T /IM eschaton.exe", { stdio: "ignore" }); } catch (_) {}
        try { execSync("taskkill /F /T /IM eschaton-gui.exe", { stdio: "ignore" }); } catch (_) {}
        sleepMs(400);
        for (const pf of ["daemon.pid", "gui.pid", "tray_window.pid", "show_window.req"]) {
          try { fs.unlinkSync(path.join(hostDir, pf)); } catch (_) {}
        }
        for (const f of ["eschaton.exe", "eschaton-gui.exe"]) {
          const s = path.join(srcBin, f);
          const d = path.join(destBin, f);
          if (fs.existsSync(s)) {
            for (let retry = 0; retry < 12; retry++) {
              try {
                fs.copyFileSync(s, d);
                break;
              } catch (_) {
                try { execSync("taskkill /F /T /IM eschaton.exe", { stdio: "ignore" }); } catch (_) {}
                try { execSync("taskkill /F /T /IM eschaton-gui.exe", { stdio: "ignore" }); } catch (_) {}
                sleepMs(250);
              }
            }
          }
        }
        if (fs.existsSync(sManifest)) {
          try { fs.copyFileSync(sManifest, path.join(homeDir, "release_manifest.json")); } catch (_) {}
        }
        const sDll = path.join(__dirname, "native", "sdk", "lib", "eschaton_sdk.dll");
        if (fs.existsSync(sDll)) {
          try { fs.copyFileSync(sDll, path.join(destSdk, "eschaton_sdk.dll")); } catch (_) {}
        }
      } else {
        console.log("[eschaton] Updating binaries from release server (" + feedUrl + ") ...");
        const psCmd = "$ErrorActionPreference='Stop'; $z=Join-Path $env:TEMP 'eschaton-latest.zip'; $x=Join-Path $env:TEMP 'eschaton_npm_stage'; if(Test-Path $x){Remove-Item -Recurse -Force $x}; curl.exe -fsSL --max-time 60 '" + feedUrl + "/eschaton-latest.zip' -o $z; Expand-Archive -Path $z -DestinationPath $x -Force; $inst=Get-ChildItem -Path $x -Filter 'install.ps1' -Recurse -File | Select-Object -First 1; & $inst.FullName -enable_lan_server -no_shortcut";
        execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCmd}"`, { stdio: "inherit", windowsHide: true });
      }
      if (fs.existsSync(destExe)) {
        try {
          execSync(`"${destExe}" daemon start --listen 0.0.0.0:47821`, { stdio: "ignore", windowsHide: true });
        } catch (_) {}
      }
      console.log("[eschaton] Updated native binaries and started daemon at " + destBin);
    }
  }
} catch (err) {
  console.warn("[eschaton] postinstall note:", err.message);
}