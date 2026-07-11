[Setup]
AppName=Stella Rikka
AppVersion=1.0
AppPublisher=Joseph Joestar
DefaultDirName={autopf}\Stella Rikka
DefaultGroupName=Stella Rikka
OutputBaseFilename=StellaRikka_v1_Installer
Compression=lzma2/ultra64
SolidCompression=yes
SetupIconFile=stella_rikka_logo.ico
UninstallDisplayIcon={app}\installer\stella_rikka_logo.ico
WizardStyle=modern
ShowLanguageDialog=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

; Nota: Hemos removido InfoBeforeFile para que no aparezca el RTF como pediste.

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copiar todo el proyecto desde el directorio padre. Excluímos la carpeta de datos y los backups para una instalación limpia.
Source: "..\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "backend\data\*,backend\data_backups\*,__pycache__\*,*.git*,installer\Output\*"

[Icons]
Name: "{group}\Stella Rikka"; Filename: "{app}\lanzador.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\installer\stella_rikka_logo.ico"
Name: "{autodesktop}\Stella Rikka"; Filename: "{app}\lanzador.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\installer\stella_rikka_logo.ico"; Tasks: desktopicon

[Run]
; Instalar dependencias obligatoriamente durante la instalación (sin casilla de verificación)
Filename: "cmd.exe"; Parameters: "/c pip install -r ""{app}\requirements.txt"""; StatusMsg: "Instalando dependencias de Python (Flask)..."; Flags: runhidden waituntilterminated
; Ejecutar la suite opcionalmente (casilla de verificación al final)
Filename: "{app}\lanzador.vbs"; WorkingDir: "{app}"; Description: "Lanzar Stella Rikka ahora"; Flags: shellexec postinstall nowait skipifsilent

[Code]
// Script en Pascal para cambiar los colores del instalador a la estética "Sea Horizon" (Dark Mode)
procedure InitializeWizard();
begin
  // Colores en formato BGR (Blue, Green, Red) - Inno Setup requiere este formato
  // #0A1628 (Fondo secundario) = $28160A
  // #060D1E (Fondo principal) = $1E0D06
  // #F59E0B (Naranja Ámbar de Orihime) = $0B9EF5
  // #FFF8EE (Texto claro) = $EEF8FF
  
  WizardForm.Color := $28160A;
  WizardForm.Font.Color := $EEF8FF;
  
  // Colorear páginas del asistente
  WizardForm.WelcomePage.Color := $28160A;
  WizardForm.InnerPage.Color := $28160A;
  WizardForm.FinishedPage.Color := $28160A;
  WizardForm.LicensePage.Color := $28160A;
  WizardForm.SelectDirPage.Color := $28160A;
  WizardForm.SelectProgramGroupPage.Color := $28160A;
  WizardForm.ReadyPage.Color := $28160A;
  WizardForm.InstallingPage.Color := $28160A;
  
  // Paneles superiores
  WizardForm.MainPanel.Color := $1E0D06;
  
  // Textos y Títulos (Color Ámbar)
  WizardForm.PageNameLabel.Font.Color := $0B9EF5;
  WizardForm.PageDescriptionLabel.Font.Color := $EEF8FF;
  
  WizardForm.WelcomeLabel1.Font.Color := $0B9EF5;
  WizardForm.WelcomeLabel2.Font.Color := $EEF8FF;
  WizardForm.FinishedHeadingLabel.Font.Color := $0B9EF5;
  WizardForm.FinishedLabel.Font.Color := $EEF8FF;
  
  // Arreglar las cajas de texto (Memo, Edit) que se ven blancas con texto claro
  WizardForm.ReadyMemo.Color := $1E0D06;
  WizardForm.ReadyMemo.Font.Color := $EEF8FF;
  
  WizardForm.TasksList.Color := $1E0D06;
  WizardForm.TasksList.Font.Color := $EEF8FF;
  
  WizardForm.DirEdit.Color := $1E0D06;
  WizardForm.DirEdit.Font.Color := $EEF8FF;
  
  WizardForm.GroupEdit.Color := $1E0D06;
  WizardForm.GroupEdit.Font.Color := $EEF8FF;
end;
