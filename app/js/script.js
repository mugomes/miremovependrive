// Copyright (C) 2024-2025 Murilo Gomes Julio
// SPDX-License-Identifier: GPL-2.0-only

// Mestre da Info
// Site: https://www.mestredainfo.com.br

const txtDriver = document.getElementById('txtDriver');
const sResult = document.getElementById('resultado');

// Abrir arquivo
async function getDriver() {
    txtDriver.innerHTML = '';
    miremovependrive.getUSB();
    miremovependrive.listUSB((sValues) => {
        var sDriver = sValues.split("\n")
        sDriver.forEach((row) => {
            if (row != '') {
                var opt = document.createElement('option');
                opt.value = row;
                opt.innerHTML = row;
                txtDriver.appendChild(opt);
            }
        });
    });
}

getDriver();

async function removeUSB() {
    disabledButton(true);

    sResult.innerHTML = '<div class="alert alert-info">Removendo dispositivo com segurança...</div>';

    await miremovependrive.removeUSB(txtDriver.value);

    miremovependrive.listRemoveUSB((sValue) => {
        if (sValue != '') {
            sResult.innerHTML = sValue;
        }
    });

    getDriver();

    disabledButton(false);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function disabledButton(value) {
    if (value) {
        document.querySelectorAll('button')[0].setAttribute('disabled', true);
        document.querySelectorAll('button')[1].setAttribute('disabled', true);
    } else {
        document.querySelectorAll('button')[0].removeAttribute('disabled');
        document.querySelectorAll('button')[1].removeAttribute('disabled');
    }
}

async function infoUSB() {    
    disabledButton(true);

    sResult.innerHTML = '';
    sResult.innerHTML = '<div class="alert alert-info">Obtendo informações do dispositivo...</div>';

    await miremovependrive.infoUSB(txtDriver.value);
    miremovependrive.listInfoUSB((a) => {
        sResult.innerHTML = `<table>
        <tr>
            <th>Disponível</th>
            <th>Usado</th>
            <th>Total</th>
        </tr>
        <tr>
            <td>${formatBytes(a[3])}</td>
            <td>${formatBytes(a[2])} ${a[4]}</td>
            <td>${formatBytes(a[1])}</td>
        </tr>
        </table>`;

        disabledButton(false);
    });
}