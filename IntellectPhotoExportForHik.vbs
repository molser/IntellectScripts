'***************************************************************************/
' ���: IntellectPhotoExport.vbs                                            */
' ����: VBScript                                                           */
' ��������: ����������� ���������� ����������� �� ������� Intellect        */
' � ������� HikCentral                                                     */
' ITV "Intellect v. 4.9" � ����������� ������ ���������� ���� �����������  */
' � �������� �.�. 2019 													   */
'/**************************************************************************/
dim DebugMod
DebugMod = true ' ��������� �� ��� ������

dim ConsoleMod
ConsoleMod = false ' ����� ������� ������� (���������� ��� �������). � ����������, ����� ������������ �������� ������.

dim MaxPhotosInFolder '������������ ���������� ���������� � �����. ���� ����� ����� ���������, �� ����� ������� ����� ����� (��������� 0, ���� �� ���������)
MaxPhotosInFolder = 0

dim CopyBmpToSpecialFolder '��������� �� ����� ������ *.bmp � ��������� �����  
CopyBmpToSpecialFolder = true

dim g_resultDialog
g_resultDialog = MsgBox("������ �������� ���������� " & vbNewLine & _
		"�� ������������ ��������� ITV ""Intellect"" "  & vbNewLine & _
		"� ������� ����� � ��������������� ����� " & vbNewLine & _
		"� ������������ � ��������� ��� HikCentral." & vbNewLine & _		
		"����������?", vbYesNo, "������� ����������")

if g_resultDialog = vbNo then
	WScript.Quit
end If


set WshShell = WScript.CreateObject("WScript.Shell")
set FSO = CreateObject("Scripting.FileSystemObject")
set objShellApp = CreateObject("Shell.Application")

CurrDirPath = WshShell.CurrentDirectory
set objDestFolder  = FSO.GetFolder(CurrDirPath ) ' ����� ������ ����������� ������

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
'							"\���������\Bmp"

g_IntellectBmpFolderPath = "C:\Program Files (x86)\���������\Bmp\Person"
dim objSourceFolder
set objSourceFolder = nothing
if not FSO.FolderExists(g_IntellectBmpFolderPath) then		
	set objSourceFolder = objShellApp.BrowseForFolder(0, "������� ����� � ������������", 0)	
	if (objSourceFolder is nothing) then
		WScript.Quit
	end if
	g_IntellectBmpFolderPath = objSourceFolder.Self.Path
'else
	'set objSourceFolder = FSO.GetFolder(g_IntellectBmpFolderPath)
end if
	
	
dim g_DestFolderPath ' ����, ���� ����� ������������ ����������

g_DestFolderPath = objDestFolder.Path & "\PersonPhotos_" & getNowDateStr()
FSO.CreateFolder(g_DestFolderPath)

dim g_LogFileName  ' ��� ���-�����
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
rs.CursorType =  adOpenStatic ' adOpenStatic (3) ��������� ������������ �� ������� � �������� �����������
rs.CursorLocation = 3 'adUseClient(3) ������ �� ������� �������, ����� ����� ���� �������� ����������� �� �������
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
if DebugMod then logDebug ("������ �������� ��������. ����� �����: " & rowsCount)
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
while not rs.EOF 'and current_row < 90 '���������������	
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
			if DebugMod then logDebug "���� " & destFilePath & " ����� ����������� ��� �����������."
			destFilePath = destFilePath & ".jpg"
		Case Else
			destFilePath = destFilePath & ".jpg"
		End Select
		
		
		
		'MsgBox ("��� ��������: " + getImageType(sourseFile)) '���������������		
		
		If Not FSO.FileExists(destFilePath) then
			if ConsoleMod Then WScript.Echo ("���������� ����: " & FSO.GetFileName(destFilePath))
			sourseFile.Copy(destFilePath)
			file_count = file_count + 1
		Else
			If DebugMod Then logDebug "���� ���������� " & file_name & " ��� ����������� �����."
		End If
		
	Else
		if DebugMod then logDebug "� ���������� " & file_name & " ��� ����������."
	End if	
	
	current_row = current_row +1
	if ConsoleMod then WScript.Echo ("���������: "  & Int(current_row/rowsCount*100) & "% ����������: " & current_row & " �� " & rowsCount & " �����." )	
	rs.MoveNext
wend
ad.close
if DebugMod then logDebug "������� �������� ��������." & vbNewLine & _
						  "���������� " & current_row & " �� " & rowsCount & " �����." & vbNewLine & _
						  "C���������� " & file_count & " ������."
MsgBox ("������� �������� ���� �� Intellect ��������!")

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
    if objRegExp.Test(strPersonName) then ' ���� � ����� ���������� ������������ ������ ������� (����� ���: *+-~. � �.�.), ������� ��
		dim strFileName
		strFileName = objRegExp.Replace(strPersonName,"")
		strFileName = Replace(strFileName, "  ", " ") ' �������� ������� ������� ����������	
		if DebugMod then logDebug "���������: " + strPersonName + " ������������ � " + strFileName & "."
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
		Case "�"
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
	"      ,rtrim(ltrim(REPLACE(per.name, '���.',''))) as name " & _    
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