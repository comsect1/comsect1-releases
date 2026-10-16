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
    let pkgVersion = "0.1.1";
    if (fs.existsSync(sManifest)) {
      try {
        const man = JSON.parse(fs.readFileSync(sManifest, "utf8"));
        if (man.version) pkgVersion = man.version;
        if ((!expectedExeSha || !expectedGuiSha) && Array.isArray(man.files)) {
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
          const uninstPs1 = path.join(homeDir, "uninstall.ps1");
          const uninstCmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${uninstPs1}"`;
          const regKey = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{9E4B7C2A-51F8-4D3E-A812-7C09E5B31421}_is1";
          execSync(`reg.exe add "${regKey}" /v DisplayName /t REG_SZ /d "Eschaton Covenant Manager" /f`, { stdio: "ignore", windowsHide: true });
          execSync(`reg.exe add "${regKey}" /v DisplayVersion /t REG_SZ /d "${pkgVersion}" /f`, { stdio: "ignore", windowsHide: true });
          execSync(`reg.exe add "${regKey}" /v Publisher /t REG_SZ /d "COMSECT1 Sovereign Architecture" /f`, { stdio: "ignore", windowsHide: true });
          execSync(`reg.exe add "${regKey}" /v DisplayIcon /t REG_SZ /d "${destGui}" /f`, { stdio: "ignore", windowsHide: true });
          execSync(`reg.exe add "${regKey}" /v InstallLocation /t REG_SZ /d "${homeDir}" /f`, { stdio: "ignore", windowsHide: true });
          execSync(`reg.exe add "${regKey}" /v UninstallString /t REG_SZ /d "${uninstCmd.replace(/"/g, '\\"')}" /f`, { stdio: "ignore", windowsHide: true });
          execSync(`reg.exe add "${regKey}" /v QuietUninstallString /t REG_SZ /d "${uninstCmd.replace(/"/g, '\\"')}" /f`, { stdio: "ignore", windowsHide: true });
          execSync(`reg.exe add "${regKey}" /v NoModify /t REG_DWORD /d 1 /f`, { stdio: "ignore", windowsHide: true });
          execSync(`reg.exe add "${regKey}" /v NoRepair /t REG_DWORD /d 1 /f`, { stdio: "ignore", windowsHide: true });
          execSync(`reg.exe add "${regKey}" /v EstimatedSize /t REG_DWORD /d 9600 /f`, { stdio: "ignore", windowsHide: true });
        } catch (_) {}
        try {
          execSync(`"${destExe}" daemon start --listen 0.0.0.0:47821`, { stdio: "ignore", windowsHide: true });
        } catch (_) {}
      }
      console.log("[eschaton] Updated native binaries (" + pkgVersion + ") and started daemon at " + destBin);
    }
  }
} catch (err) {
  console.warn("[eschaton] postinstall note:", err.message);
}