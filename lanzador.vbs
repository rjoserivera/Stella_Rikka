Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = currentDir
' Ejecuta el launcher.py usando pythonw (sin consola) de forma invisible (0)
WshShell.Run "pythonw.exe launcher.py", 0, False
