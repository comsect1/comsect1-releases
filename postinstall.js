const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

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
    if (fs.existsSync(path.join(srcBin, "eschaton.exe"))) {
      try { execSync("taskkill /F /IM eschaton.exe /IM eschaton-gui.exe", { stdio: "ignore" }); } catch (_) {}
      for (const f of ["eschaton.exe", "eschaton-gui.exe"]) {
        const s = path.join(srcBin, f);
        const d = path.join(destBin, f);
        if (fs.existsSync(s)) {
          try { fs.copyFileSync(s, d); } catch (_) {}
        }
      }
      const sManifest = path.join(__dirname, "release_manifest.json");
      if (fs.existsSync(sManifest)) {
        try { fs.copyFileSync(sManifest, path.join(homeDir, "release_manifest.json")); } catch (_) {}
      }
      const sDll = path.join(__dirname, "native", "sdk", "lib", "eschaton_sdk.dll");
      if (fs.existsSync(sDll)) {
        try { fs.copyFileSync(sDll, path.join(destSdk, "eschaton_sdk.dll")); } catch (_) {}
      }
    } else if (!fs.existsSync(path.join(destBin, "eschaton.exe"))) {
      console.log("[eschaton] Downloading prebuilt release bundle from " + feedUrl + " ...");
      const psCmd = "$ErrorActionPreference='Stop'; $z=Join-Path $env:TEMP 'eschaton-latest.zip'; $x=Join-Path $env:TEMP 'eschaton_npm_stage'; if(Test-Path $x){Remove-Item -Recurse -Force $x}; curl.exe -fsSL --max-time 60 '" + feedUrl + "/eschaton-latest.zip' -o $z; Expand-Archive -Path $z -DestinationPath $x -Force; $inst=Get-ChildItem -Path $x -Filter 'install.ps1' -Recurse -File | Select-Object -First 1; & $inst.FullName -enable_lan_server -no_shortcut";
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCmd}"`, { stdio: "inherit", windowsHide: true });
    }

    const exePath = path.join(destBin, "eschaton.exe");
    if (fs.existsSync(exePath)) {
      try {
        execSync(`"${exePath}" daemon start --listen 0.0.0.0:47821`, { stdio: "ignore", windowsHide: true });
      } catch (_) {}
    }
    console.log("[eschaton] Installed native binaries and started daemon at " + destBin);
  }
} catch (err) {
  console.warn("[eschaton] postinstall note:", err.message);
}