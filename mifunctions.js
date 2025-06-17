// Copyright (C) 2024-2025 Murilo Gomes Julio
// SPDX-License-Identifier: GPL-2.0-only

// Mestre da Info
// Site: https://www.mestredainfo.com.br

const { ipcMain, dialog, BrowserWindow } = require('electron')

module.exports = {
    mifunctions: function (win, milang, miNewWindow, miPath) {
        // Abrir aplicativo externo
        ipcMain.handle('appExterno', async (event, url) => {
            require('electron').shell.openExternal(url);
        });

        // Obter versão do aplicativo e recursos
        ipcMain.handle('appVersao', async (event, tipo) => {
            if (tipo == 'miremovependrive') {
                return require('electron').app.getVersion();
            } else if (tipo == 'electron') {
                return process.versions.electron;
            } else if (tipo == 'node') {
                return process.versions.node;
            } else if (tipo == 'chromium') {
                return process.versions.chrome;
            } else {
                return '';
            }
        });

        // Abre uma nova janela personalizada
        ipcMain.handle('appNewWindow', async (event, url, width, height, resizable, frame, menu, hide) => {
            miNewWindow(url, width, height, resizable, frame, menu, hide);
        });

        // Traduzir
        ipcMain.handle('appTraduzir', async (event, text, ...values) => {
            return milang.traduzir(text, ...values);
        });

        // Função para ler arquivo
        ipcMain.handle('appReadFile', async (event, filename, externo) => {
            const fs = require('fs');
            const path = require('path');
            try {
                if (externo) {
                    return fs.readFileSync(filename, "utf8");
                } else {
                    return fs.readFileSync(path.join(miPath, filename), "utf8");
                }
            } catch (err) {
                return false;
            }
        });

        function trim(str, chr) {
            var rgxtrim = (!chr) ? new RegExp('^\\s+|\\s+$', 'g') : new RegExp('^' + chr + '+|' + chr + '+$', 'g');
            return str.replace(rgxtrim, '');
        }

        function rtrim(str, chr) {
            var rgxtrim = (!chr) ? new RegExp('\\s+$') : new RegExp(chr + '+$');
            return str.replace(rgxtrim, '');
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        }

        // Terminal
        ipcMain.handle('appGetUSB', async (event) => {
            var os = require('os');
            var sCurrentUser = os.userInfo().username;

            var childProcess = require('child_process');
            const child = childProcess.exec('ls /media/' + sCurrentUser + '/');

            child.stdout.on('data', (d) => {
                win.webContents.send('list:usb', d);
            });

            child.stdout.on('close', () => {
                child.unref();
                child.kill();
            });
        });

        ipcMain.handle('appRemoveUSB', async (event, c) => {
            try {
                var os = require('os');
                var sCurrentUser = os.userInfo().username;

                var childProcess = require('child_process');
                const child1 = childProcess.execSync('lsblk -l').toString();

                var reg = new RegExp('\.*/media\/' + sCurrentUser + '\/' + rtrim(c), 'gi');
                var sDisp1 = reg.exec(child1);
                var sDisp2 = sDisp1[0].split(' ');
                var sUSB = trim(sDisp2[0]);

                await sleep(1000);

                const child2 = childProcess.execSync('udisksctl unmount -b /dev/' + sUSB);
                await sleep(1000);

                const child3 = childProcess.execSync('udisksctl power-off -b /dev/' + sUSB);
                await sleep(1000);

                setTimeout(() => {
                    win.webContents.send('driver:msg', '<div class="alert alert-success">Dispositivo removido com segurança!</div>');
                }, 1000);
            } catch (e) {
                setTimeout(() => {
                    win.webContents.send('driver:msg', '<div class="alert alert-danger">Dispositivo em uso, não foi possível remover o dispositivo!</div>');
                }, 1000);

            }
        });

        ipcMain.handle('appInfoUSB', async (event, c) => {
            try {
                var os = require('os');
                var sCurrentUser = os.userInfo().username;

                var childProcess = require('child_process');
                const child1 = childProcess.execSync(`df -B1 | grep "/media/${sCurrentUser}/${rtrim(c)}"`).toString();

                var a1 = trim(child1).split(' ');
                var a2 = a1.filter(function (el) {
                    if (el !== '') {
                        return el;
                    }
                });

                setTimeout(() => {
                    win.webContents.send('driver:info', a2);
                }, 1000);
            } catch (e) {
                setTimeout(() => {
                    win.webContents.send('driver:msg', '<div class="alert alert-danger">Dispositivo em uso, não foi possível remover o dispositivo!</div>');
                }, 1000);

            }
        });
    }
}