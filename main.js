// Copyright (C) 2024-2025 Murilo Gomes Julio
// SPDX-License-Identifier: GPL-2.0-only

// Mestre da Info
// Site: https://www.mestredainfo.com.br

const { app, BrowserWindow, Menu, MenuItem, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const sOS = require('os');

const sPlatform = sOS.platform().toLowerCase();
const miPath = app.getAppPath();

// Argumentos
let sArgs = process.argv;
let sArgv = '';
if (sArgs[1] == '.') {
    sArgv = sArgs.slice(2).toString();
} else {
    sArgv = sArgs.slice(1).toString();
}

const milangs = require(path.join(app.getAppPath(), '/milang.js'));
const milang = new milangs(sPlatform, miPath);

process.on('uncaughtException', (error) => {
    console.error(milang.traduzir('Unhandled exception:'), error);
});

if (!fs.existsSync(path.join(sOS.userInfo().homedir, '/.miremovependrive/'))) {
    fs.mkdirSync(path.join(sOS.userInfo().homedir, '/.miremovependrive/'));
}

if (!fs.existsSync(path.join(sOS.userInfo().homedir, '/.miremovependrive/config.json'))) {
    const config1 = JSON.parse('{ "app": { "disableAccelerationHardware": true } }');
    config1.app.disableAccelerationHardware = true;
    fs.writeFileSync(path.join(sOS.userInfo().homedir, '/.miremovependrive/config.json'), JSON.stringify(config1, '', "\t"));
}

const config = JSON.parse(fs.readFileSync(path.join(sOS.userInfo().homedir, '/.miremovependrive/config.json'), 'utf-8'));

if (config.app.disableAccelerationHardware) {
    app.disableHardwareAcceleration();
}

app.setName('MIRemovePendrive');

let miIcon = path.join(miPath, '/icon/miremovependrive.png');
let sStartApp = true;

function createMenu(sWin, sFileMenu) {
    if (fs.existsSync(path.join(miPath, '/menus/', `${sFileMenu}.json`))) {
        fs.readFile(path.join(miPath, '/menus/', `${sFileMenu}.json`), (err, data) => {
            if (err) {
                console.error(milang.traduzir('Error reading JSON file'), err);
                return;
            }

            const menuData = JSON.parse(data);
            const mainMenu = Menu.buildFromTemplate(getMenuTemplate(sWin, menuData));
            sWin.setMenu(mainMenu);
        });
    } else {
        const mainMenu = Menu.buildFromTemplate(getMenuTemplate(sWin, ''));
        sWin.setMenu(mainMenu);
    }
}

const createWindow = () => {
    miNewWindow('index.html', 600, 400, false, true, false);
}

// Nova Janela
function miNewWindow(url, width, height, resizable, frame, hide) {
    let sWidth = (width) ? width : 800;
    let sHeight = (height) ? height : 600;
    let sResizable = (resizable == true || resizable == false) ? resizable : true;
    let sFrame = (frame == true || frame == false) ? frame : true;
    let sHide = (hide == true || hide == false) ? hide : false;

    const sNewWindow = new BrowserWindow({
        width: sWidth,
        height: sHeight,
        resizable: sResizable,
        frame: sFrame,
        icon: miIcon,
        webPreferences: {
            preload: path.join(app.getAppPath(), '/preload.js'),
        }
    });

    if (sHide) {
        sNewWindow.hide();
    }

    sNewWindow.setMenu(null);

    if (sStartApp) {
        sNewWindow.loadFile(path.join(miPath, '/app/index.html'));

        app.on("browser-window-created", (e, sNewWindow) => {
            sNewWindow.removeMenu();
        });

        const mifunctions = require(path.join(app.getAppPath(), '/mifunctions.js'));
        mifunctions.mifunctions(sNewWindow, milang, miNewWindow, miPath);

        createMenu(sNewWindow, 'menu');

        sStartApp = false;
    } else {
        sNewWindow.loadFile(path.join(miPath, '/app/', url).replace('file:', ''));
    }

    if (fs.existsSync(path.join(miPath, '/app/', url.replace('file:', ''))) && fs.existsSync(path.join(miPath, '/menus/', url.replace('.html', '.json').replace('file:', '')))) {
        createMenu(sNewWindow, url.replace('.html', ''));
    }

    sNewWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url !== '') {
            miNewWindow(`${url}`);

            return { action: 'deny' }
        }

        return { action: 'allow' }
    });
}

// Template de Menu
function getMenuTemplate(win, menuData) {
    let template = [];

    // Loop sobre as chaves do objeto JSON
    Object.keys(menuData).forEach((sKey) => {
        let submenu = [];

        // Loop sobre os itens do submenu
        Object.keys(menuData[sKey]).forEach((sSubMenuKey) => {
            let menuItem = {};

            if (sSubMenuKey.indexOf('separator') == 0) {
                menuItem = { type: 'separator' };
            } else {
                menuItem = {
                    label: milang.traduzir(sSubMenuKey),
                    accelerator: menuData[sKey][sSubMenuKey].key,
                    click: () => {
                        // Verifica se é uma página ou URL
                        if (menuData[sKey][sSubMenuKey].page) {
                            if (menuData[sKey][sSubMenuKey].newwindow) {
                                miNewWindow(`/${menuData[sKey][sSubMenuKey].page}`, menuData[sKey][sSubMenuKey].width, menuData[sKey][sSubMenuKey].height, menuData[sKey][sSubMenuKey].resizable, menuData[sKey][sSubMenuKey].frame, menuData[sKey][sSubMenuKey].menu, menuData[sKey][sSubMenuKey].hide)
                            } else {
                                win.loadFile(path.join(miPath, '/app/', menuData[sKey][sSubMenuKey].page));
                            }
                        } else if (menuData[sKey][sSubMenuKey].url) {
                            require('electron').shell.openExternal(menuData[sKey][sSubMenuKey].url);
                        } else if (menuData[sKey][sSubMenuKey].script) {
                            win.webContents.executeJavaScript(menuData[sKey][sSubMenuKey].script);
                        }
                    }
                };
            }

            submenu.push(menuItem);
        });

        // Adiciona o submenu ao item do menu principal
        template.push({ label: milang.traduzir(sKey), submenu });
    });

    return template;
}

app.whenReady().then(() => {
    createWindow()

    // Enquanto os aplicativos do Linux são encerrados quando não há janelas abertas, os aplicativos do macOS geralmente continuam em execução mesmo sem nenhuma janela aberta, e ativar o aplicativo quando não há janelas disponíveis deve abrir um novo.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });
});

// Para sair do aplicativo no Linux
// Se for MACOS não roda esse comando
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});