module.exports = {
    packagerConfig: {
      ignore: [
        /(.eslintrc.json)|(.gitignore)|(electron.vite.config.ts)|(forge.config.cjs)|(tsconfig.*)/,
        /^\/node_modules\/.vite/,
        /^\/.git/,
        /^\/.github/
      ],
      icon: './icon/miremovependrive.ico',
      asar: true,
      extraResource: [
        "./LICENSE",
        "./README.md"
      ]
    },
    plugins: [
      {
        name: '@electron-forge/plugin-auto-unpack-natives',
        config: {}
      }
    ],
    "makers": [
        {
            "name": "@electron-forge/maker-zip",
            "platforms": [
                "linux"
            ]
        }
    ],
    publishers: []
  }
  