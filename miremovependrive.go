// Copyright (C) 2025 Murilo Gomes Julio
// SPDX-License-Identifier: GPL-2.0-only

// Site: https://www.mugomes.com.br

package main

import (
	"fmt"
	"image/color"
	"os/exec"
	"os/user"
	"strconv"
	"strings"
	"time"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"
	"github.com/mugomes/mgcolumnview"
	"github.com/mugomes/mgsmartflow"
)

const VERSION_APP string = "3.0.0"

type myDarkTheme struct{}

func (m myDarkTheme) Color(name fyne.ThemeColorName, variant fyne.ThemeVariant) color.Color {
	// A lógica para forçar o modo escuro é retornar cores escuras.
	// O Fyne usa estas constantes internamente:
	switch name {
	case theme.ColorNameBackground:
		return color.RGBA{28, 28, 28, 255} // Fundo preto
	case theme.ColorNameForeground:
		return color.White // Texto branco
	// Adicione outros casos conforme a necessidade (InputBackground, Primary, etc.)
	default:
		// Retorna o tema escuro padrão para as outras cores (se existirem)
		// Aqui estamos apenas definindo as cores principais para garantir o Dark Mode
		return theme.DefaultTheme().Color(name, theme.VariantDark)
	}
}

// 3. Implemente os outros métodos necessários da interface fyne.Theme (usando o tema padrão)
func (m myDarkTheme) Font(s fyne.TextStyle) fyne.Resource {
	return theme.DefaultTheme().Font(s)
}

func (m myDarkTheme) Icon(n fyne.ThemeIconName) fyne.Resource {
	return theme.DefaultTheme().Icon(n)
}

func (m myDarkTheme) Size(n fyne.ThemeSizeName) float32 {
	if n == theme.SizeNameText {
		return 16
	}
	return theme.DefaultTheme().Size(n)
}

func convertBytes(value float64) string {
	var base float64
	var tipo string

	if value < 1024 {
		base = value
		tipo = " bytes"
	} else if value < 1048576 {
		base = value / 1024
		tipo = " KB"
	} else if value < 1073741824 {
		base = value / 1024 / 1024
		tipo = " MB"
	} else if value < 1099511627776 {
		base = value / 1024 / 1024 / 1024
		tipo = " GB"
	} else if value < 1125899906842624 {
		base = value / 1024 / 1024 / 1024 / 1024
		tipo = " TB"
	}

	return fmt.Sprintf("%.2f %s", base, tipo)
}

func getRun(name string, args ...string) string {
	cmd := exec.Command(name, args...)
	var out strings.Builder
	cmd.Stdout = &out

	err := cmd.Run()

	if err != nil {
		fmt.Errorf("Error: %s", err)
	}

	return out.String()
}

func getDrivers() []string {
	userCurrent, _ := user.Current()
	sResult := getRun("ls", strings.Join([]string{"/media/", userCurrent.Name, "/"}, ""))

	list := strings.Split(sResult, "\n")

	itens := []string{}
	for _, row := range list {
		if row != "" {
			itens = append(itens, row)
		}
	}

	return itens
}

func main() {
	app := app.NewWithID("br.com.mugomes.miremovependrive")
	app.Settings().SetTheme(&myDarkTheme{})

	window := app.NewWindow("MiRemovePendrive")
	window.CenterOnScreen()
	window.SetFixedSize(true)
	window.Resize(fyne.NewSize(530, 250))

	flow := mgsmartflow.New()

	lblDisp := widget.NewLabel("Selecione o dispositivo que deseja remover:")
	lblDisp.TextStyle = fyne.TextStyle{Bold: true}
	flow.AddRow(lblDisp)

	cboDisp := widget.NewSelect(nil, nil)
	cboDisp.PlaceHolder = " "
	cboDisp.Options = getDrivers()

	if len(cboDisp.Options) > 0 {
		cboDisp.Selected = cboDisp.Options[0]
	}

	flow.AddRow(cboDisp)
	flow.SetGap(cboDisp, fyne.NewPos(0, 14))

	lblInfo := widget.NewLabel("Teste")

	header := []string{"Available", "Used", "Total", "Used %"}
	wHeader := []float32{150, 150, 150, 100}
	cv := mgcolumnview.NewColumnView(header, wHeader, false)

	userCurrent, _ := user.Current()
	
	btnRemover := widget.NewButton("Remover", func() {
		go func() {
			fyne.Do(func() {
				flow.AddRow(lblInfo)
				flow.Container.Remove(cv)
			})

			sLSBLK := fmt.Sprintf("lsblk -l | grep \"/media/%s/%s\"", userCurrent.Name, cboDisp.Selected)
			sDriver := strings.Split(getRun("bash", "-c", sLSBLK), " ")[0]
			time.Sleep(1 * time.Second)

			uDisks1 := fmt.Sprintf("udisksctl unmount -b /dev/%s", sDriver)
			sInfo := getRun("bash", "-c", uDisks1)
			time.Sleep(1 * time.Second)

			if sInfo != "" {
				uDisks2 := fmt.Sprintf("udisksctl power-off -b /dev/%s", sDriver)
				sInfo = getRun("bash", "-c", uDisks2)
				time.Sleep(1 * time.Second)
			} else {
				//
			}
			
			fyne.Do(func()  {
				flow.Container.Remove(lblInfo)
			})
		}()
	})

	var btnAtualizar *widget.Button

	btnInfo := widget.NewButton("Informação", func() {
		flow.Container.Remove(cv)
		flow.SetGap(btnAtualizar, fyne.NewPos(0, 19))
		flow.AddRow(cv)
		flow.SetResize(cv, fyne.NewSize(window.Canvas().Size().Width, 84))

		userMedia := fmt.Sprintf("df -B1 | grep \"/media/%s/%s\"", userCurrent.Name, cboDisp.Selected)

		sResult := getRun("bash", "-c", userMedia)
		sSize := strings.Split(strings.TrimSpace(sResult), " ")

		aItens := []string{}
		for _, row := range sSize {
			if row != "" {
				aItens = append(aItens, row)
			}
		}

		sAvailable, _ := strconv.ParseFloat(aItens[3], 64)
		sUsed, _ := strconv.ParseFloat(aItens[2], 64)
		sTotal, _ := strconv.ParseFloat(aItens[1], 64)

		cv.RemoveAll()
		cv.AddRow([]string{convertBytes(sAvailable), convertBytes(sUsed), convertBytes(sTotal), aItens[4]})
	})

	btnAtualizar = widget.NewButton("Atualizar", func() {
		cboDisp.Options = getDrivers()
	})

	flow.AddColumn(btnRemover, btnInfo, btnAtualizar)

	window.SetContent(flow.Container)
	window.ShowAndRun()
}
