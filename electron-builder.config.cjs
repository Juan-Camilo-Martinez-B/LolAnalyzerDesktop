// electron-builder config for the Windows installer.
// The local agent (PyInstaller) is built in the backend repo; AGENT_DIR can point
// elsewhere, as the release workflow does.
const path = require('node:path');

const agentDir = process.env.AGENT_DIR
  || path.resolve(__dirname, '../lol-analyzer-backend/dist/lolanalyzer-agent');

module.exports = {
  appId: 'com.lolanalyzer.desktop',
  productName: 'LolAnalyzer',
  // A packaged name of its own: its single-instance lock and user data never clash
  // with a development copy (`lol-analyzer-desktop`) open at the same time.
  extraMetadata: { name: 'lolanalyzer', productName: 'LolAnalyzer' },
  directories: { output: 'release' },
  files: [
    'dist/**/*',
    'dist-electron/**/*',
    '!dist-electron/**/*.map',
    '!dist-electron/**/*.test.js',
    'package.json',
  ],
  extraResources: [{ from: agentDir, to: 'agent', filter: ['**/*'] }],
  // koffi loads a native .node file, which cannot run from inside the asar archive.
  asarUnpack: ['node_modules/koffi/**'],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'public/icon.png',
    // A fixed name keeps the website link stable: /releases/latest/download/LolAnalyzer-Setup.exe
    artifactName: 'LolAnalyzer-Setup.${ext}',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    shortcutName: 'LolAnalyzer',
    uninstallDisplayName: 'LolAnalyzer',
  },
  publish: null,
};
