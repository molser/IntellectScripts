'***************************************************************************/
' Имя: IntellectPhotoExport.vbs                                            */
' Язык: VBScript                                                           */
' Описание: Копирование фотографий сотрудников из системы Intellect        */
' в систему HikCentral                                                     */
' ITV "Intellect v. 4.9" с присвоением файлам фотографий имен сотрудников  */
' © Молотков С.А. 2019 													   */
'/**************************************************************************/
dim DebugMod
DebugMod = true ' сохранять ли лог работы

dim ConsoleMod
ConsoleMod = false ' режим запуска скрипта (консольный или оконный). В консольном, будет отображаться прогресс работы.

dim MaxPhotosInFolder 'максимальное количество фотографий в папке. Если число будет превышено, то будет создана новая папка (усановить 0, если не требуется)
MaxPhotosInFolder = 0

dim CopyBmpToSpecialFolder 'создавать ли копии файлов *.bmp в отдельной папке  
CopyBmpToSpecialFolder = true

dim g_resultDialog
g_resultDialog = MsgBox("Скрипт копирует фотографии " & vbNewLine & _
		"из программного комплекса ITV ""Intellect"" "  & vbNewLine & _
		"в текущую папку и переименовывает файлы " & vbNewLine & _
		"в соответствии с правилами для HikCentral." & vbNewLine & _		
		"Продолжить?", vbYesNo, "Экспорт фотографий")

if g_resultDialog = vbNo then
	WScript.Quit
end If


set WshShell = WScript.CreateObject("WScript.Shell")
set FSO = CreateObject("Scripting.FileSystemObject")
set objShellApp = CreateObject("Shell.Application")

CurrDirPath = WshShell.CurrentDirectory
set objDestFolder  = FSO.GetFolder(CurrDirPath ) ' папка откуда запускается скрипт

if FSO.GetBaseName(Wscript.FullName) = "cscript" then 
	ConsoleMod = true
end if

'WScript.Echo(Folder.Name)
'WScript.Echo(Folder.ParentFolder)
'WScript.Echo(Folder.Path)
'Set File = FSO.GetFile("10.jpg")
'File.Copy(Folder.Path + "\1\")
'WScript.Echo(File.Name)
'WScript.Echo(File.Type)
'FSO.CreateFolder(DestFolderPath)
'File.Copy(DestFolderPath + FSO.GetBaseName(File.Path) + "_copy." + FSO.GetExtensionName(File.Path))



dim g_IntellectBmpFolderPath
'g_IntellectBmpFolderPath = WshShell.RegRead("HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\ProgramFilesDir (x86)") & _ 
'							"\Интеллект\Bmp"

g_IntellectBmpFolderPath = "C:\Program Files (x86)\Интеллект\Bmp\Person"
dim objSourceFolder
set objSourceFolder = nothing
if not FSO.FolderExists(g_IntellectBmpFolderPath) then		
	set objSourceFolder = objShellApp.BrowseForFolder(0, "Укажите папку с фотографиями", 0)	
	if (objSourceFolder is nothing) then
		WScript.Quit
	end if
	g_IntellectBmpFolderPath = objSourceFolder.Self.Path
'else
	'set objSourceFolder = FSO.GetFolder(g_IntellectBmpFolderPath)
end if
	
	
dim g_DestFolderPath ' путь, куда будут копироваться фотографии

g_DestFolderPath = objDestFolder.Path & "\PersonPhotos_" & getNowDateStr()
FSO.CreateFolder(g_DestFolderPath)

dim g_LogFileName  ' имя лог-файла
g_LogFileName = g_DestFolderPath & "\PersonExport_" & getNowDateStr() & ".log"
'MsgBox g_LogFileName 


set objRegExp = CreateObject("VBScript.RegExp")
objRegExp.Pattern = "[\*\.\+\-""\?\>\<\|\/\\\,\'\~\:\;]"
objRegExp.Global = true

strConnectionToIntellectDB = "Provider=SQLOLEDB.1;Integrated Security=SSPI;Persist Security Info=False;Initial Catalog=intellect;Data Source=SERVERSKUD"
set ad = CreateObject("ADODB.Connection") 
ad.ConnectionString = strConnectionToIntellectDB
ad.Mode = 1 'ReadOnly
ad.Open 

strSQL = getSqlQuery()

'set rs = ad.execute(strSQL)
dim rs 
Set rs = CreateObject("ADODB.Recordset")
rs.CursorType =  adOpenStatic ' adOpenStatic (3) позволяет перемещаться по записям в обратном направлении
rs.CursorLocation = 3 'adUseClient(3) курсор на стороне клиента, чтобы можно было свободно пробегаться по записям
rs.Open strSQL, ad



REM function fileExist(ars)
	REM fileExist = false
	REM dim filePath
	REM filePath = objSourceFolder.Path & "\" & ars.Fields("id").Value & ".jpg"
	REM if FSO.FileExists(filePath) then
		REM fileExist = true
	REM end if
REM end function


dim rowsCount
rowsCount = rs.RecordCount
if DebugMod then logDebug ("Начало процесса экспорта. Всего строк: " & rowsCount)
dim current_row
current_row = 0
dim file_count
file_count = 0
dim sourseFilePath
dim sourseFile
dim destFilePath
dim file_name
dim image_type
dim current_sub_folder
current_sub_folder = g_DestFolderPath
dim subfolder_count
subfolder_count = 0
while not rs.EOF 'and current_row < 90 'закоментировать	
	sourseFilePath = g_IntellectBmpFolderPath & "\" & rs.Fields("id").Value & ".bmp"	
	if FSO.FileExists(sourseFilePath) then		
		set sourseFile = FSO.GetFile(sourseFilePath)		
		file_name = getFileName(rs)
		image_type = getImageType(sourseFile)
		
		'MsgBox ("file_count: " &  file_count)
		if (MaxPhotosInFolder <> 0) Then
			if (file_count Mod MaxPhotosInFolder = 0) Then
				subfolder_count = subfolder_count + 1
				current_sub_folder = g_DestFolderPath & "\" & CStr(subfolder_count)
				'MsgBox ("current_sub_folder: " &  current_sub_folder)
				FSO.CreateFolder(current_sub_folder)
			End if		
		End If		
		
		destFilePath = current_sub_folder & "\" & file_name		
		
		
		Select Case image_type
		Case "BMP"
			If (CopyBmpToSpecialFolder = true) Then
				If Not FSO.FolderExists(g_DestFolderPath & "\bmp") Then
					FSO.CreateFolder(g_DestFolderPath & "\bmp")
				End If
				sourseFile.Copy(g_DestFolderPath & "\bmp" & "\" & rs.Fields("id").Value & ".bmp")
			End If			
			destFilePath = destFilePath & ".bmp"
		Case "unnown"
			if DebugMod then logDebug "Файл " & destFilePath & " имеет неизвестный тип изображения."
			destFilePath = destFilePath & ".jpg"
		Case Else
			destFilePath = destFilePath & ".jpg"
		End Select
		
		
		
		'MsgBox ("Тип картинки: " + getImageType(sourseFile)) 'закоментировать		
		
		If Not FSO.FileExists(destFilePath) then
			if ConsoleMod Then WScript.Echo ("Копируется файл: " & FSO.GetFileName(destFilePath))
			sourseFile.Copy(destFilePath)
			file_count = file_count + 1
		Else
			If DebugMod Then logDebug "Фото сотрудника " & file_name & " уже скопировано ранее."
		End If
		
	Else
		if DebugMod then logDebug "У сотрудника " & file_name & " нет фотографии."
	End if	
	
	current_row = current_row +1
	if ConsoleMod then WScript.Echo ("Выполнено: "  & Int(current_row/rowsCount*100) & "% Обработано: " & current_row & " из " & rowsCount & " строк." )	
	rs.MoveNext
wend
ad.close
if DebugMod then logDebug "Процесс экспорта завершен." & vbNewLine & _
						  "Обработано " & current_row & " из " & rowsCount & " строк." & vbNewLine & _
						  "Cкопировано " & file_count & " файлов."
MsgBox ("Процесс экспорта фото из Intellect завершен!")

set sourseFile = nothing
set rs = nothing
set ad = nothing
set objRegExp = nothing
set ts = nothing
set objSourceFolder = nothing
set WshShell = nothing
set FSO = nothing
set objShellApp = nothing


sub logError(astr)
  logMsg astr
end sub

sub logDebug(astr)
  logMsg astr
end sub

sub logMsg(astr)
  'WScript.Stdout.WriteLine astr
  dim ts
  set ts = FSO.OpenTextFile(g_LogFileName, 8, true, 0)  
  ts.WriteLine(astr)  
  ts.close()
end sub

function getNowDateStr()  
  dt = Now()  
  getNowDateStr = Year(dt) & "-" & _ 
				Right("0" & Month(dt),2) & "-" & _
				Right("0" & Day(dt),2) & "_" & _
				Right("0" & Hour(dt),2) & "-" & _
				Right("0" & Minute(dt),2) & "-" & _
				Right("0" & Second(dt),2)
end function

function getFileName(ars)
	dim strPersonName
	dim strPersonSurname
	
	strPersonName = Replace(ars.Fields("name").Value, " ","")
	strPersonSurname = Replace(ars.Fields("surname").Value, " ","")
	
	'strPersonName = ars.Fields("name").Value & " " & ars.Fields("surname").Value & " " & ars.Fields("patronymic").Value & " (" & ars.Fields("id") & ")"
	strPersonName = strPersonSurname & " " & strPersonName & "_" & ars.Fields("id").Value
					'ars.Fields("surname").Value & " " & _
					'ars.Fields("patronymic").Value	
					REM Left(ars.Fields("surname").Value,1) & _
					REM Left(ars.Fields("patronymic").Value,1)
    if objRegExp.Test(strPersonName) then ' если в имени сотрудника присутствуют плохие символы (такие как: *+-~. и т.д.), удаляем их
		dim strFileName
		strFileName = objRegExp.Replace(strPersonName,"")
		strFileName = Replace(strFileName, "  ", " ") ' заменяем двойные пробелы одинарными	
		if DebugMod then logDebug "Сотрудник: " + strPersonName + " переименован в " + strFileName & "."
		getFileName = strFileName
		exit function
	else
		getFileName = strPersonName
	end if
end function

function getImageType(file)
	dim image_type
	dim ts
	dim image_code
	
	Set ts = file.OpenAsTextStream()
	If (file.size <> 0) Then
		image_code = ts.read(1)
	End If
	ts.close
	
	Select Case image_code
		Case "я"
			image_type = "JPG"
		Case "B"
			image_type = "BMP"
		Case Else
			image_type = "unnown"
	End Select
	getImageType = image_type
end function

function getSqlQuery()
	getSqlQuery = _
	"select " & _
	"       per.id " & _
	"      ,rtrim(ltrim(REPLACE(per.name, 'дек.',''))) as name " & _    
	"      ,rtrim(ltrim(per.patronymic)) as patronymic " & _
	"      ,rtrim(ltrim(per.surname)) as surname " & _
	"      ,per.parent_id " & _      
	"  FROM [intellect].[dbo].[OBJ_PERSON] per " & _
	"  left join [intellect].[dbo].OBJ_DEPARTMENT dep on dep.id = per.parent_id " & _
	"  order by per.name, per.patronymic, per.surname" & _
	"  	   ,rtrim(ltrim(per.name)) " & _    
	"      ,rtrim(ltrim(per.patronymic))  " & _
	"      ,rtrim(ltrim(per.surname))  " 
end function