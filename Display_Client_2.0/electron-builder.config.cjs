const path = require('path');

module.exports = {
  appId: 'com.kds.shell',
  productName: 'KDS Device Shell',
  directories: {
    output: 'release',
    buildResources: 'resources'
  },
  files: ['dist/**/*', 'electron/**/*', 'package.json'],
  extraResources: [{ from: '.env', to: '.env', filter: ['.env'] }],
  publish: null,
  protocols: {
    name: 'kds-shell',
    schemes: ['kds']
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    artifactName: 'KDS-Device-Shell-Setup-${version}.${ext}'
  },
  nsis: {
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    include: path.join(__dirname, 'scripts', 'nsis-hooks.nsh')
  }
};
