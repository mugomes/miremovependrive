// Copyright (C) 2024-2025 Murilo Gomes Julio
// SPDX-License-Identifier: GPL-2.0-only

// Mestre da Info
// Site: https://www.mestredainfo.com.br

miremovependrive.version('miremovependrive').then((value) => {
    document.getElementById('versionApp').innerHTML = value;
});

miremovependrive.readFile('/licenses/electron/LICENSE.txt').then((value) => {
    document.getElementById('txtElectron').innerHTML = value;
});

var coll = document.getElementsByClassName("btnCollapse");
var i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
        this.classList.toggle("active"); var content = this.nextElementSibling; if
            (content.style.display === "block") { content.style.display = "none"; } else {
            content.style.display = "block";
        }
    });
}