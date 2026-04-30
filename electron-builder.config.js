/**
 * @type {import('electron-builder').Configuration}
 */
export default {
  appId: 'com.kronos.timetracker',
  productName: 'Kronos',
  directories: {
    buildResources: 'build',
    output: 'dist-electron',
  },
  files: ['out/**/*'],
  extraResources: [
    { from: 'resources/', to: '.', filter: ['**/*'] },
  ],
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.productivity',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
}
