//скрипт для работы служебной кабины с возможностью перевода в автоматический режим, 
//с использованием двух пар турникетов AutomaticSystems SL-9x (version2)  ©Молотков С.А. 2018г.
//Замечания:
//1. Нормальная работа служебного прохода обеспечивается при установлении считывателей в относительную блокировку блокировку
//2. К  реле 3 подключаются индикаторы, запрещающие заход в шлюз 


var script_name = "script_A";

//Включить ли функцию контроля повторного прохода (APB)
var apb_enable = 1;

//сохранять ли лог работы в файл
var save_log_to_file = 0;

//сохранять ли лог работы в БД SQL-сервера
var save_log_to_sql = 1;

//флаг возможности включения автоматического режима работы
var change_sp_mode_enable = 1;

//флаг показа информационных сообщений на дополнительных дисплеях
var is_show_info_images = 1;

//имя сервера, к которому подключены служебные проходы
var sp_server = "SKSRV";

//времея (в секундах), в течение которого кабина остается заблокированной, после того как контролер принял решение о пропусле
var time_block = "3";

//время (в секундах) отображения зеленого индикатора для прохода в шлюз
var time_green_led = "2"; 

// ID контроллеров, установленных на служебных проходах (in - входной, out - выходной)
var nc32k_sp_A_in="2.1";
var nc32k_sp_A_out="2.2";
var nc32k_sp_B_in="_2.3";
var nc32k_sp_B_out="_2.4";
var nc32k_sp_P_in="_2.5";
var nc32k_sp_P_out="_2.6";
var nc32k_sp_T2_P_in="_1.260";
var nc32k_sp_T2_P_out="_1.269";

//Тип биометрического считывателя, установленного на служебном проходе

//ID's зон используемых для контроля
var area_ZDRO="4.1"; //- ЗДРО
var area_dirty="4.2"; //- Общая зона

//Имена компьютеров которые установлены на служебных проходах

var sp_A_name="ARMSKUD3";
var sp_B_name="_ARMSKUD1";
var sp_P_name="_ARMSKUD2";
var sp_T2_P_name="_T2ARMSKUD1";

//ID модудей фотоидентификаций (ФИ), установленных на проходах (main), а
// а также фотоидентификаций, на которых может быть осуществлен удаленный пропуск (add)

var fi_sp_A_main="7";
var fi_sp_B_main="_8";
var fi_sp_P_main="_9";
var fi_sp_T2_P_main="_3";

var fi_sp_A_remote="0";

//В каждом модуле фотоидентификации должны присутствовать два события (типа макрокоманда), с назначенными на них шаблонами
// На 1-ое событие  должен быть назначен шаблон в котором должны присутствовать следующие кнопки:
// 		Кнопка1 - "пропустить"
//      Кнопка2 - "не пропускать (отменить)"
//      Кнопка3(скрытая) - "пропущен автоматически" (скрыть кнопку можно поместив ее за фотографией)
//      Кнопка4(скрытая) - "не пропущен автоматически"
//      Кнопка5(скрытая) - "пропущен с другого ПК"
//      Кнопка6(скрытая) - "не пропущен с другого ПК"
// На 2-ое событие должен быть назначен шаблон, в котором нет кнопок.

// Указанные события (макрокоманды) никогда не должны вызываться в системе (должны быть скрытыми).
// Важным условием является то, что в ФИ указанные события должны идти именно в той последовательности, в которой описано выше.

// В ФИ, которая будет использоваться дополнительно от основной (для возможности удаленного управления) 
// должно быть создано только одно событие и к нему должен быть применен шаблон без кнопок

//ID макрокоманды-события для шаблона с кнопками
var macro_event_with_buttons = "15";
//ID макрокоманды-события для шаблона без кнопок
var macro_event_without_buttons = "16";

//В каждом модуле ФИ в шаблоне с кнопками, на кнопки 1 и 2 должны быть назначены макрокоманды, индивидуальные для каждой ФИ
var macro_sp_A_grant="6";
var macro_sp_A_deny="7";
var macro_sp_B_grant="_9";
var macro_sp_B_deny="_10";
var macro_sp_P_grant="_12";
var macro_sp_P_deny="_13";
var macro_sp_T2_P_grant="_73";
var macro_sp_T2_P_deny="_74";

//макрокоманда для перевода служебного прохода в режим "ожидания"
//var macro_sp_set_idle = "19";
var macro_sp_A_set_idle = "20";
var macro_sp_B_set_idle = "_19";
var macro_sp_P_set_idle = "_81";
var macro_sp_T2_P_set_idle = "_82";

//На объекте-компьютер того служебного прохода, где будет использоваться автоматический режим работы
//должно быть создано:
//   1. Два диалогового окна, символизирующих об автоматичеком и ручном режимах работы.
var dialog_auto_mode_sp_A="slujA_auto_mode";
var dialog_manual_mode_sp_A="slujA_manual_mode";
var dialog_auto_mode_sp_B="_slujB_auto_mode";
var dialog_manual_mode_sp_B="_slujB_manual_mode";
var dialog_auto_mode_sp_P="0";
var dialog_manual_mode_sp_P="0";
var dialog_auto_mode_sp_T2_P="0";
var dialog_manual_mode_sp_T2_P="0";

//    В каждом диалоговом окне должна быть кнопка, нажатие на которую вызывает макрокоманду для смены режима работы
var macro_sp_A_change_mode="8";
var macro_sp_B_change_mode="_11";
var macro_sp_P_change_mode="_14";
var macro_sp_T2_P_change_mode="_74";
//   2. Сервис голосового оповещения, через который будет воспроизводится звук
var vns_sp_A="9";
var vns_sp_B="_10";
var vns_sp_P="0";
var vns_sp_T2_P="0";
//звуковой файл, сигнализирующий об успешном пропуске
var sound_grant="C:\\Windows\\Media\\Windows Logoff Sound.wav";

//На компьютере служебных кабин должен быть установлен второй дисплей,
//на который будут выводится картинки о статусе прохода.
//Путь к программе imageshower.exe
var image_shower_path = "C:\\ImageShower\\ImageShower.exe";

//Папка, где располагаются картинки: 
var info_images_dir = "C:\\ImageShower\\Images\\";

//картинка, когда служебный проход находится в режиме ожидания
var image_idle="idle.jpg";
//картинка: сотрудник зашел в шлюз (ручной режим)
var image_wait_for_officers_control="wait_for_officers_control.jpg";
//картинка: сотрудник зашел в шлюз (автоматический режим)
var image_wait_for_bioverification="wait_for_bioverification.jpg";
//картинка: ошибка верификации на био-считывателе (автоматический режим)
var image_bioverification_fault="bioverification_fault.jpg";
//картинка: проходите по входу в ЗДРО
var image_pass_in="pass_in.jpg";
//картинка: проходите по выходу из ЗДРО
var image_pass_out="pass_out.jpg";

//специализированные клавиатуры для возможности нажатия кнопок ФИ с клавиатуры
var keyb_sp_A = "1";
var keyb_sp_B = "_2";
var keyb_sp_P = "_3";
var keyb_sp_T2_P = "_5";

//ID камер служебных проходов
var cam_id_sp_A="444";
var cam_id_sp_B="_252";
var cam_id_sp_P="_327";
var cam_id_sp_T2_P="0";

//ID титрователя проходов
var titler_pass_sp_A="9";
var titler_pass_sp_B="_7";
var titler_pass_sp_P="_8";
var titler_pass_sp_T2_P="0";
	
//ID титрователя операторов
var titler_operator_sp_A="12";
var titler_operator_sp_B="_10";
var titler_operator_sp_P="_11";
var titler_operator_sp_T2_P="0";

//время, в течение которого автоматический турникет открыт, и ожидает прохода (должно соответствовать настройкам турникетов)
var door_time = "10";

//текущая дата и время
var now = new Date();

//Получаем дату и время из события
var event_time = Event.GetParam("time");
var event_date = Event.GetParam("date");

//строка подключения к базе данных
var sql_connection_str="Data Source=(local);Initial Catalog=intellect;Integrated Security=SSPI;Persist Security Info=False;Provider=SQLOLEDB.1";

//путь к файлу для сохранения логов
var log_file_path="C:\\auto_spА.log";


//if (Event.SourceType=="PNET3_NC32K")
if (Event.GetParam("module")=="pnet3.run" && Event.SourceType=="PNET3_NC32K")
{
	//проверяем, что приходит нужное событие от нужных считывателей
	if((Event.Action=="EVENTA1" || Event.Action=="EVENTA2") // || Event.Action=="EVENTA4" || Event.Action=="EVENTA5")
		&& (Event.SourceId==nc32k_sp_A_in	
			|| Event.SourceId==nc32k_sp_A_out 
			|| Event.SourceId==nc32k_sp_B_in
			|| Event.SourceId==nc32k_sp_B_out
			|| Event.SourceId==nc32k_sp_P_in
			|| Event.SourceId==nc32k_sp_P_out
			|| Event.SourceId==nc32k_sp_T2_P_in
			|| Event.SourceId==nc32k_sp_T2_P_out))
	{	
		//получаем параметры, в зависимости от контроллера nc32k
		var obj_nc32k = get_nc32k_dependences(Event.SourceId);		
		//имя служебного прохода
		var sp_name = obj_nc32k.sp_name;
		//получаем сведения о сотруднике
		var person_id = Event.GetParam("param1");
		var card = Event.GetParam("card");
		var facility_code = Event.GetParam("facility_code");
		
		//отладочный блок
		if(save_log_to_file)
		{
			saveLogString(getDateTimeStr(now) + " " + getBaseMsgParamsStr(Event));
			saveLogString("\t" + "Block№: 1");
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
			saveLogString("\t\t" + "facility_code: " + facility_code);
			saveLogString("\t\t" + "card: " + card);			
			saveLogString("\t\t" + "sp_name: " + sp_name);
			saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
			saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
			saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
			saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
		}
		
		//"EVENTA1" - в доступе отказано (режим блокировки))		
		if(Event.Action=="EVENTA1")		
		{		
			//если служебный проход находится в режиме ожидания
			if(Var_var(sp_name + "_sp_status") == "idle")
			{
				//отладочный блок
				if(save_log_to_file)
				{
					saveLogString("\t" + "Block№: 2");
					saveLogString("\t\t" + "script_name: " + script_name);
					saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
					saveLogString("\t\t" + "facility_code: " + facility_code);
					saveLogString("\t\t" + "card: " + card);			
					saveLogString("\t\t" + "sp_name: " + sp_name);
					saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
					saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
					saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
					saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
				}				
				//запускаем процедуру обработки события запроса сотрудника на проход в зону
				passRequestHandling(obj_nc32k, sp_name, person_id);
				//отладочный блок
				if(save_log_to_file)
				{
					saveLogString("\t" + "Block№: 3");
					saveLogString("\t\t" + "script_name: " + script_name);
					saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
					saveLogString("\t\t" + "facility_code: " + facility_code);
					saveLogString("\t\t" + "card: " + card);			
					saveLogString("\t\t" + "sp_name: " + sp_name);
					saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
					saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
					saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
					saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
				}
			}			
		}
		
		//Событие "нет ключа в БД контроллера"				
		else if(Event.Action=="EVENTA2")
		{		
			//если кабина находится в режиме ожидания			
			if(Var_var(sp_name + "_sp_status") == "idle")
			{
				//отладочный блок
				if(save_log_to_file)
				{
					saveLogString("\t" + "Block№: 4");
					saveLogString("\t\t" + "script_name: " + script_name);
					saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
					saveLogString("\t\t" + "facility_code: " + facility_code);
					saveLogString("\t\t" + "card: " + card);			
					saveLogString("\t\t" + "sp_name: " + sp_name);
					saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
					saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
					saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
					saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
				}
				//отсеиваем возможное событие попытки повторной верификации на биометрическом считывателе,
				//когда проход сотруднику уже был разрешен
				if((facility_code.length < 3) || (card == "0"))
				{
					var pass_info = "Фасилити код меньше 3!";					
					if(save_log_to_file)
					{
						saveLogString(getDateTimeStr(now) + " " + getBaseMsgParamsStr(Event));
						saveLogString("\t" + "Block№: 5");
						saveLogString("\t\t" + "script_name: " + script_name);						
						saveLogString("\t\t" + "pass_info: " + pass_info);
						saveLogString("\t\t" + "card: " + card);
						saveLogString("\t\t" + "facility_code: " + facility_code);
					}
					
					if(save_log_to_sql)
					{
						saveLogToSQL({
							event: "Событие на биосчитывателе когда проход в режиме ожидания",
							sp_id: sp_name,
							facility_code: facility_code,
							card: card,						
							person_id: person_id,
							info: "reader_id: " + obj_nc32k.id
							});
					}
				}
				else
				{
					//флаг детекции ситуации выхода по просроченной карте
					var is_exit_by_expired_card = false;
					//если событие произошло на считывателе по выходу из ЗДРО
					if(Event.SourceId==nc32k_sp_A_out 
						|| Event.SourceId==nc32k_sp_B_out
						|| Event.SourceId==nc32k_sp_P_out)
					{
						
						var pass_info = "Попытка выхода из ЗДРО по недействительной карте!";					
						if(save_log_to_file)
						{
							saveLogString(getDateTimeStr(now) + " " + getBaseMsgParamsStr(Event));
							saveLogString("\t" + "Block№: 6");
							saveLogString("\t\t" + "script_name: " + script_name);
							saveLogString("\t\t" + "pass_info: " + pass_info);
							saveLogString("\t\t" + "person_id: " + person_id);
							saveLogString("\t\t" + "sp_name: " + sp_name);
							saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
							saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
							saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
							saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
						}
						
						
						//если сотрудник есть в базе
						if(person_id)
						{
							//проверяем допустимое количество времени, проведенное сотрудником в ЗДРО и наличие в уровне доступа сотрудника разрешения на проход
							if(checkValidZDROTime(person_id) && checkPersonsLevelForNc32K(person_id,obj_nc32k.id))
							{						
								//запускаем процедуру запрос на выход (для того чтобы сотрудник мог выйти из ЗДРО с просроченной картой)
								passRequestHandling(obj_nc32k, sp_name, person_id);
								is_exit_by_expired_card = true;
								
								if(save_log_to_sql)
								{
									saveLogToSQL({
										event: "Выход из ЗДРО по недействительной карте",
										sp_id: sp_name,
										facility_code: facility_code,
										card: card,
										person_id: person_id,
										person_name: getPersonFIO(person_id),
										person_dept: GetObjectName("DEPARTMENT",GetObjectParentId("PERSON", person_id, "DEPARTMENT")),
										info: "reader_id: " + obj_nc32k.id
										});
								}
							}
							else
							{
								if(save_log_to_sql)
								{
									saveLogToSQL({
										event: "Попытка выхода из ЗДРО по недействительной карте",
										sp_id: sp_name,
										facility_code: facility_code,
										card: card,
										person_id: person_id,
										person_name: getPersonFIO(person_id),
										person_dept: GetObjectName("DEPARTMENT",GetObjectParentId("PERSON", person_id, "DEPARTMENT")),
										info: "reader_id: " + obj_nc32k.id
										});
								}
							}
						}						
					}
					if (is_exit_by_expired_card == false)
					{		
						//запускаем процедуру обработки ситуации, когда у сотрудника нет доступа в зону 
						accessDeniedHandling(obj_nc32k, person_id,card, facility_code);						
					}
				}				
				
				//отладочный блок
				if(save_log_to_file)
				{
					saveLogString("\t" + "Block№: 7");
					saveLogString("\t\t" + "script_name: " + script_name);
					saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
					saveLogString("\t\t" + "facility_code: " + facility_code);
					saveLogString("\t\t" + "card: " + card);			
					saveLogString("\t\t" + "sp_name: " + sp_name);
					saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
					saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
					saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
					saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
				}
			}
			//Если кабина находится в режиме верификации
			else if (Var_var(sp_name + "_sp_status") == "wait_for_verification")
			{
				// если включен автоматический режим
				if(Itv_var(sp_name + "_is_auto_mode") == "true")
				{						
					//отладочный блок
					if(save_log_to_file)
					{
						saveLogString("\t" + "Block№: 8");
						saveLogString("\t\t" + "script_name: " + script_name);
						saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
						saveLogString("\t\t" + "facility_code: " + facility_code);
						saveLogString("\t\t" + "card: " + card);			
						saveLogString("\t\t" + "sp_name: " + sp_name);
						saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
						saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
						saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
						saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
					}	
					//запускаем процедуру обработки события верификации отпечатка пальца
					fingerPrintVerification(obj_nc32k, card,facility_code);
					//отладочный блок
					if(save_log_to_file)
					{
						saveLogString("\t" + "Block№: 9");
						saveLogString("\t\t" + "script_name: " + script_name);
						saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
						saveLogString("\t\t" + "facility_code: " + facility_code);
						saveLogString("\t\t" + "card: " + card);			
						saveLogString("\t\t" + "sp_name: " + sp_name);
						saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
						saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
						saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
						saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
					}
				}
			}		
		}			
	}	
}
//событие изменения состояния контроллера NC32K
else if (Event.SourceType=="CORE" && 
		 Event.Action == "SET_STATE" &&
		 Event.GetParam("module")=="pnet3.run" &&
		 Event.GetParam("objtype") == "PNET3_NC32K" &&
		 (Event.GetParam("objid") == nc32k_sp_A_in ||
			Event.GetParam("objid") == nc32k_sp_A_out))
{
	//получаем параметры, в зависимости от контроллера nc32k
	var obj_nc32k = get_nc32k_dependences(Event.GetParam("objid"));
	var sp_name = obj_nc32k.sp_name;	
	
	//отладочный блок
	if(save_log_to_file)
	{
		saveLogString(getDateTimeStr(now) + " " + getBaseMsgParamsStr(Event));
		saveLogString("\t" + "Block№: 10");
		saveLogString("\t\t" + "script_name: " + script_name);		
		saveLogString("\t\t" + "state: " + Event.GetParam("state"));
		saveLogString("\t\t" + "objid: " + Event.GetParam("objid"));
		saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
		saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
	}
	
	//если сработал датчик двери
	if(check_state(Event.GetParam("state"),"DC") == true)
	{
		//если статус служебного прохода == ожидание входа в шлюз
		if(Var_var(sp_name + "_sp_status") == "wait_for_gate_in")
		{			
			//если событие произошло на текущем считывателе
			if(Var_var(sp_name + "_current_nc32k") == obj_nc32k.id)
			{	
				//устанавливаем статус служебного прохода "ожидание верификации"
				Lock();
					Var_var(sp_name + "_sp_status") = "wait_for_verification";
				Unlock();
				
				//отладочный блок
				if(save_log_to_file)
				{
					saveLogString("\t" + "Block№: 11");
					saveLogString("\t\t" + "script_name: " + script_name);
					saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
					saveLogString("\t\t" + "facility_code: " + Event.GetParam("facility_code"));
					saveLogString("\t\t" + "card: " + Event.GetParam("card"));			
					saveLogString("\t\t" + "sp_name: " + sp_name);
					saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
					saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
					saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
					saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
				}
				
				//запускаем процедуру обработки события захода сотрудника в шлюз
				personInGateHandling(obj_nc32k.id);	
			}
		}
		
		//если статус служебного прохода == ожидание выхода из шлюза
		else if(Var_var(sp_name + "_sp_status") == "wait_for_gate_out")
		{
			//отладочный блок
			if(save_log_to_file)
			{
				saveLogString("\t" + "Block№: 12");
				saveLogString("\t\t" + "script_name: " + script_name);
				saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
				saveLogString("\t\t" + "facility_code: " + Event.GetParam("facility_code"));
				saveLogString("\t\t" + "card: " + Event.GetParam("card"));			
				saveLogString("\t\t" + "sp_name: " + sp_name);
				saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
				saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
				saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
				saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
			}			
			
						
			//устанавливаем статус служебного прохода "переход в режим ожидания после выхода сотрудника"
			Lock();
				Var_var(sp_name + "_sp_status") = "getting_idle_after_pass";
			Unlock();
			
			
			//выключаем блокироку турникетов (красные индикаторы) (необходимая мера, так как реле выключения срабатывает с запозданием)
			DoReactStr("PNET3_NC32K",obj_nc32k.id,"RELAY3_ON","");
			DoReactStr("PNET3_NC32K",obj_nc32k.pair,"RELAY3_ON","");			
		}
	}
	//если статус контроллера отличается от "сработал датчик двери" и статус служебки: "переход в режим ожидания после выхода сотрудника"
	else if (Var_var(sp_name + "_sp_status") == "getting_idle_after_pass")
	{
		//отладочный блок
		if(save_log_to_file)
		{
			saveLogString("\t" + "Block№: 13");
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "param1: " + Event.GetParam("param1"));
			saveLogString("\t\t" + "facility_code: " + Event.GetParam("facility_code"));
			saveLogString("\t\t" + "card: " + Event.GetParam("card"));			
			saveLogString("\t\t" + "sp_name: " + sp_name);
			saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
			saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
			saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
			saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
		}
		
		//если событие произошло на противоположном считывателе  (нормальный цикл прохода)
		if(Var_var(sp_name + "_current_nc32k") == obj_nc32k.pair)
		{
			//переводим служебку в режим ожидания
			set_sp_idle(sp_name,"without_relay");	
		}		
	}
}

//событие "нажата кнопка пропустить" на служебном проходе А
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_A_grant && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	grantToPass(sp_A_name, "оператором");
}
//событие "нажата кнопка пропустить" на служебном проходе B
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_B_grant && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	grantToPass(sp_B_name, "оператором");
}
//событие "нажата кнопка пропустить" на служебном проходе P
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_P_grant && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	grantToPass(sp_P_name, "оператором");
}
//событие "нажата кнопка пропустить" на служебном проходе Т2 P
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_T2_P_grant && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	grantToPass(sp_T2_P_name, "оператором");
}
//событие "нажата кнопка не пропускать" на служебном проходе А
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_A_deny && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	denyToPass(sp_A_name);
}
//событие "нажата кнопка не пропускать" на служебном проходе B
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_B_deny && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	denyToPass(sp_B_name);
}
//событие "нажата кнопка не пропускать" на служебном проходе P
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_P_deny && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	denyToPass(sp_P_name);
}
//событие "нажата кнопка не пропускать" на служебном проходе T2_P
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_T2_P_deny && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	denyToPass(sp_T2_P_name);
}

//событие "установки служебного прохода в режим ожидания" A
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_A_set_idle && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	onSettingSpIdle();	
}
//событие "установки служебного прохода в режим ожидания" B
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_B_set_idle && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	onSettingSpIdle();	
}
//событие "установки служебного прохода в режим ожидания" P
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_P_set_idle && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	onSettingSpIdle();	
}

//событие "установки служебного прохода в режим ожидания" P T2
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_T2_P_set_idle && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	onSettingSpIdle();	
}

//переключение авто-режима работы на служебном проходе А
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_A_change_mode && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	if(change_sp_mode_enable) {change_sp_mode(sp_A_name);}
}

//переключение авто-режима работы на служебном проходе А
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_A_change_mode && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	if(change_sp_mode_enable) {change_sp_mode(sp_A_name);}
}

//переключение авто-режима работы на служебном проходе B
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_B_change_mode && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	if(change_sp_mode_enable) {change_sp_mode(sp_B_name);}	
}

//переключение авто-режима работы на служебном проходе P
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_P_change_mode && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	if(change_sp_mode_enable) {change_sp_mode(sp_P_name);}
}

//переключение авто-режима работы на служебном проходе T2_P
else if (Event.SourceType=="MACRO" && Event.SourceId == macro_sp_T2_P_change_mode && Event.Action=="RUN" && Event.GetParam("owner") == sp_server)
{
	if(change_sp_mode_enable) {change_sp_mode(sp_T2_P_name);}
}

// при смене пользователя на служебном проходе, запускаем соответствующую процедуру
else if ((Event.SourceType=="SLAVE")	 
	&& (Event.Action=="REGISTER_USER" || Event.Action=="UNREGISTER_USER"))
{
	var sp_name = Event.SourceId;
	if(sp_name == sp_A_name || sp_name == sp_B_name || sp_name == sp_P_name || sp_name == sp_T2_P_name)
	{
		on_sp_session_change(Event.Action, sp_name);
	}	
}

// Обработка нажатия клавиш кнопок фотоидентификации служебных проходов
else if (Event.SourceType=="KEYB" && Event.Action=="NEW_KEY_PRESSED" &&  Event.GetParam("module")=="keyb.run" && Event.GetParam("wparam")=="32")
{
	var keyb_id = Event.SourceId;
	switch(keyb_id)
	{
		case (keyb_sp_A):
			// если не включен автоматический режим
			if(Itv_var(sp_A_name + "_is_auto_mode") != "true")
			{
				DoReactStr("PHOTO_IDENT",fi_sp_A_main,"HANDLE_CUR_EVENT","button<Кнопка1>,service_force<>");
			}			
			break;
		case (keyb_sp_B):
			// если не включен автоматический режим
			if(Itv_var(sp_B_name + "_is_auto_mode") != "true")
			{
				DoReactStr("PHOTO_IDENT",fi_sp_B_main,"HANDLE_CUR_EVENT","button<Кнопка1>,service_force<>");
			}
			break;
		case (keyb_sp_P):
			// если не включен автоматический режим
			if(Itv_var(sp_P_name + "_is_auto_mode") != "true")
			{
				DoReactStr("PHOTO_IDENT",fi_sp_P_main,"HANDLE_CUR_EVENT","button<Кнопка1>,service_force<>");
			}
			break;
		case (keyb_sp_T2_P):
			// если не включен автоматический режим
			if(Itv_var(sp_T2_P_name + "_is_auto_mode") != "true")
			{
				DoReactStr("PHOTO_IDENT",fi_sp_T2_P_main,"HANDLE_CUR_EVENT","button<Кнопка1>,service_force<>");
			}
			break;
	}
}

//Начало перевода служебного прохода в режим ожидания
function onSettingSpIdle()
{
	var sp_name = Event.GetParam("sp_name");	
	var obj_sp = get_sp_dependences(sp_name);
	
	var param0 = Event.GetParam("param0");
	var param1 = Event.GetParam("param1");	
	var person_id = Event.GetParam("person_id");
	var reader_id = Event.GetParam("reader_id");	
	var state = Event.GetParam("state");
	
	//отладочный блок
	if(save_log_to_file)
	{
		saveLogString(getDateTimeStr(now) + " " + getBaseMsgParamsStr(Event));
		saveLogString("\t" + "Block№: 14");		
		saveLogString("\t\t" + "script_name: " + script_name);
		saveLogString("\t\t" + "sp_name: " + sp_name);
		saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
		saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
		saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
		saveLogString("\t\t" + "person_id: " + person_id);
		saveLogString("\t\t" + "param0: " + param0);
		saveLogString("\t\t" + "param1: " + param1);
		saveLogString("\t\t" + "state: " + state);
	}	
	
	//проверяем, на ниличие команды "reset"
	if(param0 == "reset")
	{
		//нажимаем кнопку соответствующей ФИ (перезапуск)
		DoReactStr("PHOTO_IDENT",obj_sp.fi_sp_main,"HANDLE_CUR_EVENT","button<Кнопка4>,service_force<>");
		
		//переводим служебку в режим ожидания
		set_sp_idle(sp_name);
		
		if(save_log_to_file)
		{
			saveLogString(getDateTimeStr(now) + " " + getBaseMsgParamsStr(Event));
			saveLogString("\t" + "Block№: 15");	
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "Button reset pressed!");					
			saveLogString("\t\t" + "sp_name: " + sp_name);
			saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
			saveLogString("\t\t" + "param0: " + param0);
			saveLogString("\t\t" + "param1: " + param1);
			saveLogString("\t\t" + "fi_sp_main: " + obj_sp.fi_sp_main);
		}

		if(save_log_to_sql)
		{
			saveLogToSQL({
					event: "Нажата кнопка ПЕРЕЗАПУСК",
					sp_id: sp_name				
					});
		}
	}
	//проверяем флаг регистрации оператора на служебном проходе
	else if(Var_var(sp_name + "_operator_unregistered") !== "true")
	{
		if(sp_name == sp_A_name)
		{
			//если шлюз ожидает входа сотрудника
			if(state == "wait_for_gate_in" && Var_var(sp_name + "_sp_status") == "wait_for_gate_in")
			{
				//сверяем сотрудника и считыватель
				if(person_id == Var_var(sp_name + "_current_person_id") && reader_id == Var_var(sp_name + "_current_nc32k"))
				{
					//Вариант 1
					//сотрудник не зашел, переводим служебный проход в режим ожидания
					//set_sp_idle(sp_name);				
					
					//Вариант 2
					//датчик турникета по входу в проход не сработал
					//устанавливаем статус служебного прохода "ожидание верификации"
					Lock();
						Var_var(sp_name + "_sp_status") = "wait_for_verification";
					Unlock();				
					//запускаем процедуру обработки события захода сотрудника в шлюз
					personInGateHandling(reader_id);
				}			
			}
			//если служебный проход находится в ожидании выхода сотрудника из шлюза
			else if(state == "wait_for_gate_out" && Var_var(sp_name + "_sp_status") == "wait_for_gate_out")
			{
				//сверяем сотрудника и считыватель
				if(person_id == Var_var(sp_name + "_current_person_id") && reader_id == Var_var(sp_name + "_current_nc32k"))
				{
					if(save_log_to_file)
					{
						saveLogString("\t" + "Block№: 16");		
						saveLogString("\t\t" + "script_name: " + script_name);
						saveLogString("\t\t" + "sp_name: " + sp_name);
						saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
						saveLogString("\t\t" + "param0: " + param0);
						saveLogString("\t\t" + "param1: " + param1);
						saveLogString("\t\t" + "fi_sp_main: " + obj_sp.fi_sp_main);
					}
					
					//информируем оператора, что время на выход сотрудника из шлюза, истекло
					//set_sp_idle(sp_name);
					var text = "Если сотрудник уже вышел из прохода,"
					+ " то, для дальнейшей работы служебной кабины, необходимо два раза нажать кнопку \"Перезапуск\" в верхней части экрана!";
					
					//Показываем на рабочем месте оператора СП окно, информации о истечении время выхода 
					DoReactStr("DIALOG","info_" + sp_name,"CLOSE_ALL","");	
					DoReactStr("DIALOG","info_" + sp_name,"RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,text<"+text+">");
					DoReactGlobalStr("DIALOG","info_DOM2ARMVIDEO08","RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,text<"+text+">,sp_name<" + sp_name + ">");
					
					if(save_log_to_file)
					{
						saveLogString(getDateTimeStr(now) + " " + getBaseMsgParamsStr(Event));
						saveLogString("\t" + "Block№: 17");
						saveLogString("\t\t" + "script_name: " + script_name);
						saveLogString("\t\t" + "info_text: " + text);
						saveLogString("\t\t" + "sp_name: " + sp_name);
						saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
						saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
						saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
						saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
					}
					
					if(save_log_to_sql)
					{
						saveLogToSQL({
							event: "Время ожидания выхода сотрудника из прохода истекло",
							sp_id: sp_name,
							person_id: person_id
							});
					}
				}			
			}
			//если служебный проход находится в процессе информирования о том, что доступ сотруднику запрещен
			else if(state == "show_access_deny" && Var_var(sp_name + "_sp_status") == "show_access_deny")
			{
				//переводим служебный проход в режим ожидания
				set_sp_idle(sp_name);
			}
			//если служебный проход переводится в режим ожидания после запрета прохода
			else if(state =="deny_to_pass") // && Var_var(sp_name + "_sp_status") == "wait_for_verification")
			{
				//переводим служебный проход в режим ожидания
				set_sp_idle(sp_name);
			}
			else if(state =="needed_to_unblock")
			{
				//переводим служебный проход в режим ожидания
				set_sp_idle(sp_name);
			}
		}
		else
		{
			//переводим служебку в режим ожидания
			set_sp_idle(sp_name);			
		}
		
	}
	//отладочный блок
	if(save_log_to_file)
	{
		saveLogString("\t" + "Block№: 18");
		saveLogString("\t\t" + "script_name: " + script_name);
		saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));		
	}	
}

//функция для отбражения события в модуле фотоидентификации
function runFI(current_fi, person_id, direction, event, date, time, is_add_fi, card, facility_code)
{
	//is_add_fi - флаг указывающий, что фотоидентификация настроена на удаленное управление
	
	var msg = CreateMsg();
	//проверяем, есть ли данные о сотруднике
	if(person_id)
	{
		//загружаем сведения из базы
		msg.StringToMsg(GetObjectParams("PERSON", person_id));
		msg.SetParam("id",person_id);
		msg.SetParam("department",GetObjectName("DEPARTMENT",msg.GetParam("parent_id")));
	}
	else
	{
		//если данных о сотруднике нет, записываем номер карты и фасилитит код 
		if(card) {msg.SetParam("card", card);}
		if(facility_code) {msg.SetParam("facility_code", facility_code);}
	}
	
	//модифицируем номер карты с добавлением фасилити кода
	//if(msg.GetParam("card") && msg.GetParam("facility_code"))
	//{
	//	var cardN = Number(msg.GetParam("card").replace(/\s*/g,''));
	//	var facCodeN = Number(msg.GetParam("facility_code").replace(/\s*/g,''));
	//	msg.SetParam("card", (facCodeN*65536)+cardN);
	//}	
		
	msg.SourceType="PHOTO_IDENT";
	msg.SourceId=current_fi;
	msg.Action="RUN";
	msg.SetParam("_noanswered_text","");
	msg.SetParam("_obj_event","RUN");
	msg.SetParam("_obj_type","MACRO");
	msg.SetParam("int_obj_id","1");
	msg.SetParam("date",date);
	msg.SetParam("time",time);
	
	var arrow_mark = "";
	if(direction=="вход")
	{
		arrow_mark = "‹--";
	}
	else
	{
		arrow_mark = "--›";
	}	
	
	//если событие - запрос на проход
	if(event == "canPass")
	{
		msg.SetParam("_line_id","0");
		if(!is_add_fi)
		{
			msg.SetParam("_obj_id",macro_event_with_buttons);
		}
		else
		{
			msg.SetParam("_obj_id",macro_event_without_buttons);
		}
		msg.SetParam("_noanswered_color","65535");
		if(direction=="вход")
		{
			msg.SetParam("_event_name", arrow_mark + " " + "Запрос на вход");
		}
		else
		{
			msg.SetParam("_event_name", arrow_mark + " " +"Запрос на выход");
		}		
	}
	//если событие - отказ по APB
	else if(event == "APB")
	{
		//msg.SetParam("_line_id","1");
		msg.SetParam("_line_id","0");
		//msg.SetParam("_obj_id",macro_event_without_buttons);
		msg.SetParam("_obj_id",macro_event_with_buttons);
		msg.SetParam("_noanswered_color","16711935");
		if(direction=="вход")
		{
			msg.SetParam("_event_name", arrow_mark + " " + "Попытка повторного входа");
		}
		else
		{
			msg.SetParam("_event_name", arrow_mark + " " + "Попытка повторного выхода");
		}		
	}
	//если событие - отказ по отсутствию ключа
	else if(event == "noKey")
	{
		msg.SetParam("_line_id","1");
		msg.SetParam("_obj_id",macro_event_without_buttons);
		msg.SetParam("_noanswered_color","255");
		if(direction=="вход")
		{
			msg.SetParam("_event_name", arrow_mark + " " + "Вход запрещен");
		}
		else
		{
			msg.SetParam("_event_name", arrow_mark + " " + "Выход запрещен");
		}		
	}	
	
	DoReact(msg);				
}

//функция, разрешения на проход сотруднику
function grantToPass(sp_name, who_grant)
{
	if(Var_var(sp_name + "_current_person_id"))
	{
		var person_id = Var_var(sp_name + "_current_person_id");		
		var card = GetObjectParam("PERSON",person_id,"card").replace(/\s*/g,'');
		//var param0 = GetObjectName("PERSON",person_id) + " " + GetObjectParam("PERSON",person_id,"surname") + " " + GetObjectParam("PERSON",person_id,"patronymic");
		var facility_code = GetObjectParam("PERSON",person_id,"facility_code").replace(/\s*/g,'');
		var obj_nc32k = get_nc32k_dependences(Var_var(sp_name + "_current_nc32k"));
		var obj_sp = get_sp_dependences(sp_name);
		var status = "";
		
		var msgAccessEvent = CreateMsg();
		msgAccessEvent.SourceType = "PNET3_NC32K";
		msgAccessEvent.SourceId = obj_nc32k.id;
		//msgAccessEvent.SetParam("param0", param0);
		msgAccessEvent.SetParam("module","pnet3.run");
		msgAccessEvent.SetParam("param1",person_id);
		msgAccessEvent.SetParam("card",card);
		msgAccessEvent.SetParam("facility_code",facility_code);		
		
		var arrow_mark = "";
		if(obj_nc32k.direction=="вход")
		{
			arrow_mark = "‹--";
			msgAccessEvent.Action = "ACCESS_IN";
			status = "pass_in";
		}
		else if (obj_nc32k.direction=="выход")
		{
			arrow_mark = "--›";
			msgAccessEvent.Action = "ACCESS_OUT1";
			status = "pass_out";
		}	
		
		//Устанавливаем статус служебного прохода "Ожидание выхода"
		if(Var_var(sp_name + "_sp_status") == "wait_for_verification" || Var_var(sp_name + "_sp_status") == "wait_for_gate_in")
		{
			Lock();
				Var_var(sp_name + "_sp_status") = "wait_for_gate_out";
			Unlock();
		}
		
		//отправляем событие прохода по сотруднику
		NotifyEventGlobal(msgAccessEvent);
		
		if(sp_name == sp_A_name)
		{
			//открываем турникет для нормального выхода из шлюза
			turnRelay(obj_nc32k.pair, "2", "1");			
			
			var state = "wait_for_gate_out";
			var delay = Number(door_time) + 2;
		
			//запускаем макрокоманду, на проверку случая, если сотрудник не вышел из шлюза за определенное время
			NotifyEventStr("MACRO",obj_sp.macro_sp_set_idle,"RUN","state<" + state + ">,sp_name<" + sp_name + ">,person_id<" + person_id + ">,reader_id<" + obj_nc32k.id + ">,delay<" + String(delay) + ">");			
		}
		else
		{
			//открываем турникет для нормального выхода из шлюза
			openDoor(obj_nc32k.pair, "3");
			
			//переводим служебку в режим ожидания через определенную задержку (delay);				
			NotifyEventStr("MACRO",obj_sp.macro_sp_set_idle,"RUN","sp_name<" + sp_name + ">,delay<" + time_block + ">");
		}		
			
		//выводим информацию на монитор информирования
		show_info_status(sp_name,status);		
		
		//проигрываем звук информирующий сотрудника о разрешении прохода
		DoReactStr("VNS",obj_sp.vns,"PLAY","recursion<1>,file<" + sound_grant + ">");
		
		//показываем титры на соответствующей камере
		var person_name = getPersonFIO(person_id);
		var person_dept = GetObjectName("DEPARTMENT",GetObjectParentId("PERSON", person_id, "DEPARTMENT"));		
		var title_text = arrow_mark + " " + person_name + " - " + person_dept + ". Пропущен " + who_grant;					
		addTitle(title_text, obj_sp.titler_pass, obj_sp.cam_id);		
		
		if(save_log_to_file)
		{
			saveLogString("\t" + "Block№: 19");
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "sp_name: " + sp_name);
			saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
			saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
			saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
			saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));		
		}		
	}
}

//функция запрещения прохода сотруднику
function denyToPass(sp_name) 
{
	var person_id = Var_var(sp_name + "_current_person_id");
	var person_name = getPersonFIO(person_id);
	var person_dept = GetObjectName("DEPARTMENT",GetObjectParentId("PERSON", person_id, "DEPARTMENT"));	
	var obj_nc32k = get_nc32k_dependences(Var_var(sp_name + "_current_nc32k"));
	var obj_sp = get_sp_dependences(sp_name); 
	var title_text = "";
	
	if(save_log_to_file)
	{
		saveLogString("\t" + "Block№: 20");
		saveLogString("\t\t" + "script_name: " + script_name);
		saveLogString("\t\t" + "sp_name: " + sp_name);
		saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
		saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
		saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
		saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
	}
	
	var arrow_mark = "";
	if(obj_nc32k.direction=="вход")
	{
		arrow_mark = "‹--";		
	}
	else if (obj_nc32k.direction=="выход")
	{
		arrow_mark = "--›";		
	}
	
	title_text = arrow_mark + " " + person_name + " - " + person_dept + ". Не пропущен!";
	
	//показываем титры на соответствующей камере
	addTitle(title_text, obj_sp.titler_pass, obj_sp.cam_id);
	
	//очищаем текущие параметры служебного прохода
	reset_sp_params(sp_name);
	
	if(sp_name == sp_A_name)
	{
		var state = "deny_to_pass";
		//задержка перевода служебки в режим ожидания
		var delay = "3";
	
		//запускаем макрокоманду, перевода служебки в режим ожидания через определенную задержку
		NotifyEventStr("MACRO",obj_sp.macro_sp_set_idle,"RUN","state<" + state + ">,sp_name<" + sp_name + ">,delay<" + delay + ">");
	}
	else
	{
		//выводим информацию на монитор информирования
		show_info_status(sp_name,"idle");
		//переводим служебку в режим ожидания
		Lock();
			Var_var(sp_name + "_sp_status") = "idle";
		Unlock();
	}	
}

//функция очистки текущих параметров служебного прохода
function reset_sp_params(sp_name)
{
	//сбрасываем текущие параметры служебного прохода
	Lock();
		Var_var(sp_name + "_current_person_id")="";
		Var_var(sp_name + "_current_nc32k")="";
		Var_var(sp_name + "_is_APB")="false";
		Var_var(sp_name + "_verification_faults") = "0";
	Unlock();	
}

//функция, информирующая сотрудника о том, что ему запрещен проход
function accessDeniedHandling(obj_nc32k, person_id, card, facility_code)
{	
	var sp_name = obj_nc32k.sp_name;
	var obj_sp = get_sp_dependences(sp_name);
	var person_name = "";
	var person_dept = "";
	//если сотрудник есть в базе
	if(person_id)
	{
		person_name = getPersonFIO(person_id);
		person_dept = GetObjectName("DEPARTMENT",GetObjectParentId("PERSON", person_id, "DEPARTMENT"));
	}
	else
	{
		person_name = "Карта " + "(" + facility_code + ")" + " " + card;
	}
	
	var arrow_mark = "";
		
	if(obj_nc32k.direction=="вход")
	{
		arrow_mark = "‹--";		
	}
	else if (obj_nc32k.direction=="выход")
	{
		arrow_mark = "--›";									
	}
	
	//устанавливаем статус служебного прохода "оповещение о запрете доступа"		
	Lock();
		Var_var(sp_name + "_sp_status") = "show_access_deny";
	Unlock();
	
	//запускаем ФИ с сообщением "Проход запрещен"
	runFI(obj_nc32k.main_fi, person_id, obj_nc32k.direction, "noKey", event_time, event_date, false, card, facility_code);
	
	//показываем титры на соответствующей камере
	var title_text = arrow_mark + " " + person_name + " - " + person_dept + ". " + obj_nc32k.direction.charAt(0).toUpperCase() + obj_nc32k.direction.substr(1) + " запрещен!";					
	addTitle(title_text, obj_sp.titler_pass, obj_sp.cam_id);
	
	if(sp_name == sp_A_name)
	{
		//Выключаем реле3 для включения красного индикатора
		DoReactStr("PNET3_NC32K",obj_nc32k.id,"RELAY3_OFF","");
		
		var state = "show_access_deny";				
		//переводим служебку в "режим ожидания" через 2 секунды				
		NotifyEventStr("MACRO",obj_sp.macro_sp_set_idle,"RUN","state<" + state + ">,sp_name<" + sp_name + ">,delay<2>");
	}
	else
	{
		//переводим служебку в "режим ожидания" через определенную задержку				
		NotifyEventStr("MACRO",obj_sp.macro_sp_set_idle,"RUN","sp_name<" + sp_name + ">,delay<" + time_block + ">");
	}	
}

//функция получения именных компонентов сотрудника
function getPersonFIO(person_id)
{
	var msg = CreateMsg();
	msg.StringToMsg(GetObjectParams("PERSON", person_id));
	return msg.GetParam("name") + " " + msg.GetParam("surname") + " " + msg.GetParam("patronymic");
}
//функция открывания и последующего закрывания двери
function openDoor(nc32k, seconds)
{
	DoReactStr("PNET3_NC32K",nc32k,"OPEN_ONCE","");
	
	/* DoReactStr("PNET3_NC32K",nc32k,"OPEN_DOOR","");
	DoReactStr("PNET3_NC32K",nc32k,"CLOSE_DOOR","delay<" + seconds + ">"); */
}

//функция включения и последующего отключения реле
function turnRelay(nc32k, relayNum, seconds)
{
	DoReactStr("PNET3_NC32K",nc32k,"RELAY" + relayNum + "_ON","");
	DoReactStr("PNET3_NC32K",nc32k,"RELAY" + relayNum + "_OFF","delay<"+ seconds + ">");
}

//функция блокировки прохода
function blockPass(obj_sp)
{
	var sp_name = obj_sp.id;
	
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_in,"CLOSE_DOOR","");
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_out,"CLOSE_DOOR","");
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_in,"PART_BLOCK","delay<1>");
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_out,"PART_BLOCK","delay<1>");
	
	if(sp_name == sp_A_name)
	{
		//включаем красный индикатора
		DoReactStr("PNET3_NC32K",obj_sp.nc32K_in,"RELAY3_OFF","delay<2>");
		DoReactStr("PNET3_NC32K",obj_sp.nc32K_out,"RELAY3_OFF","delay<2>");
	}	
	
	//закрываем окно сообщений на мониторе информирования
	show_info_status(sp_name,"no_image","2");
	
	Lock();
		Var_var(sp_name + "_sp_status") = "lock";
	Unlock();
}

//функция разблокировки прохода
function unblockPass(obj_sp)
{
	var sp_name = obj_sp.id;
		
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_in,"CLOSE_DOOR","");
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_out,"CLOSE_DOOR","");
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_in,"PART_BLOCK","delay<0>");
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_out,"PART_BLOCK","delay<0>");
	
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_in,"RELAY2_OFF","delay<0>");
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_out,"RELAY2_OFF","delay<0>");
	
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_in,"RELAY3_OFF","delay<0>");
	DoReactStr("PNET3_NC32K",obj_sp.nc32K_out,"RELAY3_OFF","delay<0>");
	
		
	//показываем статус на мониторе информирования
	show_info_status(sp_name,"idle","2");
	
	
	var state = "needed_to_unblock";				
	var delay = "2";
	//переводим служебку в "режим ожидания" через определенную задержку				
	NotifyEventStr("MACRO",obj_sp.macro_sp_set_idle,"RUN","state<" + state + ">,sp_name<" + sp_name + ">,delay<" + delay + ">");	
}

//фунцция переключения авторежима на служебном проходе
function change_sp_mode(sp_name)
{
	if(Var_var(sp_name + "_sp_status") == "idle")
	{		
		//блокируем служебный проход
		Lock();
			Var_var(sp_name + "_sp_status") = "lock";
		Unlock();
			
		var obj_sp = get_sp_dependences(sp_name);		
		
		if(Itv_var(sp_name + "_is_auto_mode") == "false")
		{
			//включаем авто-режим
			Lock();
				Itv_var(sp_name + "_is_auto_mode") = "true";
			Unlock();
			//устанавливаем количество отображаемых событий в окне фотоидентификации в "1"
			DoReactSetupCore("PHOTO_IDENT",obj_sp.fi_sp_main,"remove_events<1>");
			DoReactSetupCore("PHOTO_IDENT",obj_sp.fi_sp_main,"archive_max<1>,delay<1>");
		}
		else
		{
			//включаем ручной режим
			Lock();
				Itv_var(sp_name + "_is_auto_mode") = "false";
			Unlock();
			//устанавливаем количество отображаемых событий в окне фотоидентификации в "100"
			DoReactSetupCore("PHOTO_IDENT",obj_sp.fi_sp_main,"remove_events<0>");
			DoReactSetupCore("PHOTO_IDENT",obj_sp.fi_sp_main,"archive_max<100>,delay<1>");
		}
		var user_id = GetUserId(sp_name);;
		var operator = getPersonFIO(user_id);
		show_sp_mode_panel(sp_name,operator);
		
		//переводим служебный проход в режим ожидания
		Lock();
			Var_var(sp_name + "_sp_status") = "idle";
		Unlock();		
	}
}
//функция, отображающая панель с информацией о текужем режиме работы служебного прохода
function show_sp_mode_panel(sp_name,operator)
{
	var obj_sp = get_sp_dependences(sp_name);
			
	if(obj_sp.dialog_auto && obj_sp.dialog_manual)
	{
		if(Itv_var(sp_name + "_is_auto_mode") == "true")
		{
			DoReactStr("DIALOG",obj_sp.dialog_auto,"RUN","delay<2>");
			DoReactStr("DIALOG",obj_sp.dialog_manual,"CLOSE_ALL","delay<2>");
		}	
		else
		{
			DoReactStr("DIALOG",obj_sp.dialog_manual,"RUN","operator<" + operator + ">,delay<2>");
			DoReactStr("DIALOG",obj_sp.dialog_auto,"CLOSE_ALL","delay<2>");			
		}		
	}	
}
//функция скрытия панели с информацией о текужем режиме работы служебного прохода
function close_sp_mode_panel(sp_name)
{
	var obj_sp = get_sp_dependences(sp_name);
	
	if(obj_sp.dialog_auto && obj_sp.dialog_manual)
	{
		DoReactStr("DIALOG",obj_sp.dialog_manual,"CLOSE_ALL","");
		DoReactStr("DIALOG",obj_sp.dialog_auto,"CLOSE_ALL","");
	}
}
//функция, запускающаяся при смене пользователя служебного прохода
function on_sp_session_change(event, sp_name)
{
	//проверяем значение переменной автоматического режима
	//если ее значение неизвестно, то устанавливаем ручной режим
	if(Itv_var(sp_name + "_is_auto_mode") == "")
	{
		Lock();
			Itv_var(sp_name + "_is_auto_mode") = "false";
		Unlock();		
	}
	
	//получаем параметры текущего служебного прохода
	var obj_sp = get_sp_dependences(sp_name);
	
	if(event=="REGISTER_USER")
	{
		//снимаем флаг отсутствия оператора на служебном проходе
		Lock();
			Var_var(sp_name + "_operator_unregistered") = "false";
		Unlock();		
		
		var user_id = GetUserId(sp_name);
		var operator = getPersonFIO(user_id);
		
		//показываем панель оператора
		show_sp_mode_panel(sp_name,operator);
		//снимаем блокировку служебки
		unblockPass(obj_sp);
		
		//показываем титры на соответствующей камере		
		var title_text = "Оператор: " + operator;					
		addTitle(title_text, obj_sp.titler_operator, obj_sp.cam_id);
		
	}
	else if(event=="UNREGISTER_USER")
	{
		//устанавливаем флаг отсутствия оператора на служебном проходе
		Lock();
			Var_var(sp_name + "_operator_unregistered") = "true";
		Unlock();
		
		//закрываем панель оператора
		close_sp_mode_panel(sp_name);
		//установливаем блокировку служебки
		blockPass(obj_sp);		
		
		//очищаем титры оператора на видеокамере
		clearTitle(obj_sp.titler_operator, obj_sp.cam_id);
		
		//очищаем титры прохода на видеокамере
		clearTitle(obj_sp.titler_pass, obj_sp.cam_id);
		
		//на всякий случай убиваем процесс "ImageShower"
		var command_line = "taskkill /IM ImageShower.exe /T /F";
		var delay = "2";
		DoReactStr("SLAVE",sp_name,"CREATE_PROCESS","command_line<" + command_line + ">,delay<" + delay + ">");
			
	}	
	
}
//функция получения параметров в зависимости от контроллера
function get_nc32k_dependences(nc32k)
{
	var obj_nc32k = {};
	switch (nc32k)
	{
		case nc32k_sp_A_in:
			obj_nc32k.id=nc32k_sp_A_in;
			obj_nc32k.direction = "вход";
			obj_nc32k.pair = nc32k_sp_A_out;
			obj_nc32k.sp_name = sp_A_name;
			obj_nc32k.main_fi = fi_sp_A_main;			
			break;
		case nc32k_sp_A_out:
			obj_nc32k.id=nc32k_sp_A_out;
			obj_nc32k.direction = "выход";
			obj_nc32k.pair = nc32k_sp_A_in;
			obj_nc32k.sp_name = sp_A_name;
			obj_nc32k.main_fi = fi_sp_A_main;			
			break;
		case nc32k_sp_B_in:
			obj_nc32k.id=nc32k_sp_B_in;
			obj_nc32k.direction = "вход";
			obj_nc32k.pair = nc32k_sp_B_out;
			obj_nc32k.sp_name = sp_B_name;
			obj_nc32k.main_fi = fi_sp_B_main;			
			break;
		case nc32k_sp_B_out:
			obj_nc32k.id=nc32k_sp_B_out;
			obj_nc32k.direction = "выход";
			obj_nc32k.pair = nc32k_sp_B_in;
			obj_nc32k.sp_name = sp_B_name;
			obj_nc32k.main_fi = fi_sp_B_main;			
			break;
		case nc32k_sp_P_in:
			obj_nc32k.id=nc32k_sp_P_in;
			obj_nc32k.direction = "вход";
			obj_nc32k.pair = nc32k_sp_P_out;
			obj_nc32k.sp_name = sp_P_name;
			obj_nc32k.main_fi = fi_sp_P_main;			
			break;
		case nc32k_sp_P_out:
			obj_nc32k.id=nc32k_sp_P_out;
			obj_nc32k.direction = "выход";
			obj_nc32k.pair = nc32k_sp_P_in;
			obj_nc32k.sp_name = sp_P_name;
			obj_nc32k.main_fi = fi_sp_P_main;			
			break;
		case nc32k_sp_T2_P_in:
			obj_nc32k.id=nc32k_sp_T2_P_in;
			obj_nc32k.direction = "вход";
			obj_nc32k.pair = nc32k_sp_T2_P_out;
			obj_nc32k.sp_name = sp_T2_P_name;
			obj_nc32k.main_fi = fi_sp_T2_P_main;			
			break;
		case nc32k_sp_T2_P_out:
			obj_nc32k.id=nc32k_sp_T2_P_out;
			obj_nc32k.direction = "выход";
			obj_nc32k.pair = nc32k_sp_T2_P_in;
			obj_nc32k.sp_name = sp_T2_P_name;
			obj_nc32k.main_fi = fi_sp_T2_P_main;			
			break;
	}
	return obj_nc32k;
}
//функция получения параметров в зависимости от служебного прохода
function get_sp_dependences(sp_name)
{	
	var obj_sp = {};
	switch (sp_name)
	{
		case sp_A_name:
			obj_sp.id=sp_A_name;
			obj_sp.nc32K_in=nc32k_sp_A_in;
			obj_sp.nc32K_out=nc32k_sp_A_out;			
			obj_sp.cam_id=cam_id_sp_A;
			obj_sp.titler_pass=titler_pass_sp_A;
			obj_sp.titler_operator=titler_operator_sp_A;
			obj_sp.fi_sp_main=fi_sp_A_main;
			obj_sp.dialog_auto=dialog_auto_mode_sp_A;
			obj_sp.dialog_manual=dialog_manual_mode_sp_A;
			obj_sp.vns=vns_sp_A;
			obj_sp.macro_sp_set_idle=macro_sp_A_set_idle;
			break;
		case sp_B_name:
			obj_sp.id=sp_B_name;
			obj_sp.nc32K_in=nc32k_sp_B_in;
			obj_sp.nc32K_out=nc32k_sp_B_out;
			obj_sp.cam_id=cam_id_sp_B;
			obj_sp.titler_pass=titler_pass_sp_B;
			obj_sp.titler_operator=titler_operator_sp_B;
			obj_sp.fi_sp_main=fi_sp_B_main;
			obj_sp.dialog_auto = dialog_auto_mode_sp_B;
			obj_sp.dialog_manual = dialog_manual_mode_sp_B;
			obj_sp.vns=vns_sp_B;
			obj_sp.macro_sp_set_idle=macro_sp_B_set_idle;
			break;
		case sp_P_name:
			obj_sp.id=sp_P_name;
			obj_sp.nc32K_in=nc32k_sp_P_in;
			obj_sp.nc32K_out=nc32k_sp_P_out;
			obj_sp.cam_id=cam_id_sp_P;
			obj_sp.titler_pass=titler_pass_sp_P;
			obj_sp.titler_operator=titler_operator_sp_P;
			obj_sp.fi_sp_main=fi_sp_P_main;
			obj_sp.dialog_auto = dialog_auto_mode_sp_P;
			obj_sp.dialog_manual = dialog_manual_mode_sp_P;
			obj_sp.vns=vns_sp_P;
			obj_sp.macro_sp_set_idle=macro_sp_P_set_idle;
			break;
		case sp_T2_P_name:
			obj_sp.id=sp_T2_P_name;
			obj_sp.nc32K_in=nc32k_sp_T2_P_in;
			obj_sp.nc32K_out=nc32k_sp_T2_P_out;
			obj_sp.cam_id=cam_id_sp_T2_P;
			obj_sp.titler_pass=titler_pass_sp_T2_P;
			obj_sp.titler_operator=titler_operator_sp_T2_P;
			obj_sp.fi_sp_main=fi_sp_T2_P_main;
			obj_sp.dialog_auto = dialog_auto_mode_sp_T2_P;
			obj_sp.dialog_manual = dialog_manual_mode_sp_T2_P;
			obj_sp.vns=vns_sp_T2_P;
			obj_sp.macro_sp_set_idle=macro_sp_T2_P_set_idle;
			break;
	}
	return obj_sp;	
}
//функция отображения информационного окна
function show_info_status(sp_name, status, delay)
{
	var current_image = "";
	var current_display = "";
	switch(status)
	{
		case "idle":
			current_image = image_idle;
			current_display = "2";
			break;
		case "wait_for_officers_control":
			current_image = image_wait_for_officers_control;
			current_display = "2";
			break;
		case "wait_for_bioverification":
			current_image = image_wait_for_bioverification;
			current_display = "2";
			break;
		case "bioverification_fault":
			current_image = image_bioverification_fault;
			current_display = "2";
			break;
		case "pass_in":
			current_image = image_pass_in;
			current_display = "2";
			break;
		case "pass_out":
			current_image = image_pass_out;
			current_display = "2";
			break;
		case "close":
			DoReactStr("SLAVE",sp_name,"CREATE_PROCESS","command_line<" + image_shower_path + " /command close>,delay<" + delay + ">");
			return;
			break;
		case "no_image":
			current_display = "2";
			DoReactStr("SLAVE",sp_name,"CREATE_PROCESS","command_line<" + image_shower_path + " /command no_image  /display " + current_display + ">,delay<" + delay + ">");
			return;
			break;
	}
	if(is_show_info_images)
	{
		var command_line = image_shower_path + " /command show_image /image_path " + info_images_dir + current_image + " /display " + current_display;
		if(sp_name != sp_P_name)
		{
			DoReactStr("SLAVE",sp_name,"CREATE_PROCESS","command_line<" + command_line + ">,delay<" + delay + ">");
		}		
	}	
}
//функция добавления титров к камере
function addTitle(text, titler_id,cam_id)
{
	DoReactGlobalStr("CAM",cam_id,"ADD_SUBTITLES","command<" + text + "\r>,page<BEGIN>,title_id<" + titler_id + ">"); 
}
//функция удаления титров с камеры
function clearTitle(titler_id,cam_id)
{
	DoReactGlobalStr("CAM",cam_id,"CLEAR_SUBTITLES","title_id<" + titler_id + ">"); //DoReactStr("CAM","377","CLEAR_SUBTITLES","title_id<6>,delay<10>");
}
//функция парсинга даты пересечения зоны сотрудника
function get_area_change_date(str_date)
{
	//26-10-17 09:09:14
	var arr_datetime = str_date.split(" ");
	var arr_date = arr_datetime[0].split("-");
	var arr_time = arr_datetime[1].split(":");
	
	var day = Number(arr_date[0]);	
	var month = Number(arr_date[1])-1;
	var year = Number(arr_date[2]);
	if (year < 100)
	{
		year = 2000 + year;
	}
	var hours = Number(arr_time[0]);
	var minutes = Number(arr_time[1]);
	var seconds = Number(arr_time[2]);
	// DebugLogString("--------------string_to_parse: " + str_date);
	// DebugLogString("--------------day: " + day);
	// DebugLogString("--------------month: " + month);
	// DebugLogString("--------------year: " + year);
	// DebugLogString("--------------hours: " + hours);
	// DebugLogString("--------------minutes: " + minutes);
	// DebugLogString("--------------seconds: " + seconds);	
	
	var result = new Date(year, month, day, hours, minutes, seconds);
	return result;
}
//функция для проверки определенного статуса объекта
function check_state(states,state)
{
	var arr_states = states.split("|");
	for(i=0; i<arr_states.length; i++)
	{
		if(arr_states[i] == state)
		{
			return true;
		}
	}
	return false;
}
//процедура пропуска сотрудника внутрь шлюза
function passInGateHandling(obj_nc32k)
{
	//открываем турникет для прохода сотрудника в шлюз
	openDoor(obj_nc32k.id, "1");

	if(obj_nc32k.sp_name == sp_A_name)
	{
		//Выключаем реле3 на противоположном турникете, для включения красного индикатора;
		DoReactStr("PNET3_NC32K",obj_nc32k.pair,"RELAY3_OFF","");				
	}
	
}
//процедура фиксации того, что сотрудник зашел внутрь шлюза
function personInGateHandling(nc32k_id)
{
	//Выключаем реле3 на турникете, для включения красного индикатора;
	DoReactStr("PNET3_NC32K",nc32k_id,"RELAY3_OFF","");
}
//функция перевода служебного прохода в "режим ожидания"
function set_sp_idle(sp_name, relay_option)
{
	var obj_sp = get_sp_dependences(sp_name);
		
	if(sp_name == sp_A_name)
	{
		if(relay_option != "without_relay")
		{
			//выключаем красный индикатор
			DoReactStr("PNET3_NC32K",obj_sp.nc32K_in,"RELAY3_ON","");
			DoReactStr("PNET3_NC32K",obj_sp.nc32K_out,"RELAY3_ON","");
		}
	}		
	
	//показываем статус на мониторе информирования
	show_info_status(sp_name,"idle");
	
	//очищаем титры прохода на видеокамере
	clearTitle(obj_sp.titler_pass, obj_sp.cam_id);
	
	//очищаем текущие параметры служебного прохода
	reset_sp_params(sp_name);

	//устанавливаем статус "режим ожидания"	
	Lock();
		Var_var(sp_name + "_sp_status") = "idle";
	Unlock();
}
//получение основных компонентов соообщения
function getBaseMsgParamsStr(msg)
{
	return msg.SourceType + "|" + msg.SourceId + "|" + msg.Action + "||" + GetEventDescription(msg.SourceType, msg.Action);
}
//сохраниение строки в файл 
function saveLogString(str)
{
	//объект доступа к файловой системе
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var f;
	try
	{
		f = fso.OpenTextFile(log_file_path,8,true,-1);
	}
	catch(err)
	{
		DebugLogString(getDateTimeStr(now) + "--------------Ошибка открытия файла!");
		DebugLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
		//f.Close();
		return;
	}		
	try
	{				
		f.WriteLine(str);	
	}
	catch(err)
	{
		DebugLogString(getDateTimeStr(now) + "--------------Ошибка записи в файл!");
	}
	f.Close();		
}
function getDateTimeStr(date)
{
	var day = ("0"+date.getDate()).slice(-2);
	var month = ("0"+(date.getMonth() + 1)).slice(-2);
	var year = date.getFullYear();
	var hours = ("0"+date.getHours()).slice(-2);
	var minutes = ("0"+date.getMinutes()).slice(-2);
	var seconds = ("0"+date.getSeconds()).slice(-2);
	var milliseconds = ("0"+date.getMilliseconds()).slice(-3);
	var dateStr = "";
	dateStr = "[" + day + "." + month + "." + year + " " + hours + ":" + minutes + ":" + seconds + "." + milliseconds + "]";
	return dateStr;
}
//функция выполнения sql команды
function execute_sql(sql_connection_str,query)
{
	var connection = new ActiveXObject("ADODB.Connection");
	connection.Open(sql_connection_str);
	try
	{
		connection.Execute(query);
	}
	catch(err)
	{
		DebugLogString("-------Ошибка записи данных в базу данных!");
		DebugLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
		
		saveLogString(getDateTimeStr(now));
		saveLogString("-------Ошибка записи данных в базу данных!");
		saveLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
	}
	finally
	{
		connection.close;
		//DebugLogString("-------Закрыл соединение!");
	}	
}
//функция получения данных из базы данных
function get_sql(sql_connection_str,query)
{
	var result = "";
	var rs = new ActiveXObject("ADODB.Recordset");
	try
	{
		rs.Open(query, sql_connection_str);
		rs.MoveFirst
		while(!rs.eof)
		{
		   result += rs.Fields(0);
		   rs.MoveNext;
		}
	}
	catch(err)
	{
		DebugLogString("-------Ошибка чтения данных из базы данных!");
		DebugLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
		saveLogString(getDateTimeStr(now));
		saveLogString("-------Ошибка чтения данных из базы данных!");
		saveLogString("--------------err.name: " + err.name + "---err.message:" + err.message);			
	}
	finally
	{
		rs.close;
		//DebugLogString("-------Закрыл рекордсет!");
	}	
	return result;
}
//функция проверки повторного входа/выхода у сотрудника (anti pass back)
function checkAPB(obj_nc32k, person_id)
{
	//DebugLogString("------function checkAPB");	
	var result = false;
	var person_name = getPersonFIO(person_id);
	var check_area="";
	if((obj_nc32k.direction) == "вход") 
	{
		check_area=area_ZDRO;					
	}
	else if ((obj_nc32k.direction) == "выход")
	{				
		check_area=area_dirty;
	}
									
	//получаем данные о сотруднике
	var msgCurrentPerson = CreateMsg();
	msgCurrentPerson.StringToMsg(GetObjectParams("PERSON",person_id));
	
	//Проверяем, включен ли контроль APB для пользователя
	if(msgCurrentPerson.GetParam("is_apb")=="1")
	{
		//Проверяем текущую зону у сотрудника
		var person_area = msgCurrentPerson.GetParam("area_id");
		//DebugLogString("--------------Person: " + person_name + " (" + person_id + ")");
		//DebugLogString("--------------person_area: " + person_area);
		//DebugLogString("--------------check_area: " + check_area);										
		
		//Если сотрудник находится в той зоне в которую хочет войти
		//if(true)
		if(person_area == check_area)
		{
			//отсекаем события APB по времени (до 30.10.2017 14:00:00 наблюдались ошибки в работе служебки)
			var area_change = msgCurrentPerson.GetParam("when_area_id_changed");			
			//DebugLogString("--------------area_change: " + area_change);
			var date_area_change;
			var is_error_parse_date_area_change = false;
			try
			{
				date_area_change = get_area_change_date(area_change);
				//DebugLogString("--------------date_area_change: " + date_area_change);
			}
			catch(err)
			{
				is_error_parse_date_area_change = true;
				
				saveLogString(getDateTimeStr(now));
				saveLogString("\t" + "Ошибка парсинга даты пересечения зоны!");
				saveLogString("\t" + "area_change: " + area_change);
				saveLogString("\t" + "err.name: " + err.name + " err.message:" + err.message);
				
				DebugLogString("--------------Ошибка парсинга даты пересечения зоны!");
				DebugLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
				
				if(save_log_to_sql)
				{
					saveLogToSQL({
							event: "Ошибка парсинга даты пересечения зоны",
							info: area_change,
							person_id: person_id
							});
				}
			}
			//если нет ошибки в извлечении даты пересечения
			if(is_error_parse_date_area_change == false)
			{
				var bad_period_end = new Date(2017, 9, 30, 14,0,0);
				//если сотрудник последний раз пересекал зону до окончания сбойного периода, или есть ошибка в извлечении даты пересечения
				if((date_area_change < bad_period_end) || isNaN(date_area_change) == true) 
				{
					saveLogString(getDateTimeStr(now));
					saveLogString("\t" + "date_area_change is in bad_period");
					saveLogString("\t" + "Person_area: " + person_area + ", check_area: " + check_area + ", area_change: " + area_change +  ", date_area_change: " + date_area_change + ", bad_period_end: " + bad_period_end);
					DebugLogString("--------------Date_area_change is in bad_period!");
					DebugLogString("--------------bad_period_end: " + bad_period_end);
				}
				else
				{
					result = true;
					//DebugLogString("------function checkAPB: are in true block!");
				}
			}						
		}		
	}
	//DebugLogString("------function checkAPB result: " + result);
	return result;	
}
//обработка события запроса сотрудника на проход в зону
function passRequestHandling(obj_nc32k, sp_name, person_id)
{
	var obj_sp = get_sp_dependences(sp_name);
	if(sp_name == sp_A_name)
	{
		//устанавливаем статус служебного прохода в ожидание входа в шлюз			
		Lock();
			Var_var(sp_name + "_sp_status") = "wait_for_gate_in";
		Unlock();
		
		var state = "wait_for_gate_in";	
		//запускаем макрокоманду, на блокировку прохода по истечении таймаута турникета, в случае, если датчик турникета некорректно отработал
		NotifyEventStr("MACRO",obj_sp.macro_sp_set_idle,"RUN","state<" + state + ">,sp_name<" + sp_name + ">,person_id<" + person_id + ">,reader_id<" + obj_nc32k.id + ">,delay<" + door_time + ">");
	}
	else
	{
		//устанавливаем статус служебного прохода "ожидание верификации"
		Lock();
			Var_var(sp_name + "_sp_status") = "wait_for_verification";
		Unlock();
	}
	
	//запоминаем текущий считыватель					
	//запоминаем ID текущего сотрудника
	Lock();
		Var_var(sp_name + "_current_nc32k") = obj_nc32k.id;
		Var_var(sp_name + "_current_person_id") = person_id;
	Unlock();
	
	//запускаем процедуру обработки события на вход сотрудника внутрь шлюза
	passInGateHandling(obj_nc32k);						
	
	//Получаем данные о текущей служебке
	var obj_sp = get_sp_dependences(sp_name);
	var person_dept = GetObjectName("DEPARTMENT",GetObjectParentId("PERSON", person_id, "DEPARTMENT"));
	
	//получаем данные о сотруднике
	var msgCurrentPerson = CreateMsg();
	msgCurrentPerson.StringToMsg(GetObjectParams("PERSON",person_id));	
	
	//ФИО сотрудника
	var person_name = getPersonFIO(person_id);
	//название текущего контроллера
	var nc32_name = GetObjectName("PNET3_NC32K",obj_nc32k.id).replace(/ТД\d-\d+_*\d*\s*/,"");
	//флаг фиксации повторного прохода у текущего сотрудника
	var is_apb = false; 
	
	var arrow_mark = "";
	if(obj_nc32k.direction=="вход")
	{
		arrow_mark = "‹--";		
	}
	else if (obj_nc32k.direction=="выход")
	{
		arrow_mark = "--›";									
	}
	
	//Если определили наличие APB
	if(checkAPB(obj_nc32k,person_id))
	{							
		DebugLogString("--------------Зафиксирован APB!");
		//Создаем данные для события APB
		var msgevent = CreateMsg();
		msgevent.SourceType = "PNET3_NC32K";
		msgevent.SourceId = obj_nc32k.id;
		
		//достаем информацию о сохранненом параметре прохода сотрудника
		var sql_query = "SELECT [last_pass_info] FROM intellect.opk.persons WHERE [id] = '" + person_id + "'";						
		var last_pass_org = get_sql(sql_connection_str,sql_query);
		var last_pass = last_pass_org.replace(/ТД\d-\d+_*\d*\s*/,""); //удаляем из имени номер точки доступа
		
		var pass_info = "У сотрудника " + person_name + " (" + person_id + ")";		
		
		
		if(obj_nc32k.direction=="вход")
		{
			msgevent.Action = "EVENTA4";
			pass_info += " не зафиксирован предыдущий выход из ЗДРО.  Необходимо выяснить, каким образом сотрудник";
			
			if(last_pass)
			{
				pass_info += "  вышел из зоны, после того как вошел в нее через: " + last_pass + ".";
			}
			else
			{
				pass_info += "  крайний раз вышел из ЗДРО.";
			}			
			
		}
		else if (obj_nc32k.direction=="выход")
		{
			msgevent.Action = "EVENTA5";
						
			pass_info += " не зафиксирован предыдущий вход в ЗДРО.  Необходимо выяснить, каким образом сотрудник";
			
			if(last_pass)
			{
				pass_info += "  вошел в зону, после того как вышел из нее через: " + last_pass + ".";
			}
			else
			{
				pass_info += "  вошел в ЗДРО.";
			}						
		}		
		
		//msgevent.SetParam("param0",Event.GetParam("param0"));
		msgevent.SetParam("param2","Крайний проход: " + last_pass_org);
		msgevent.SetParam("module","pnet3.run");
		msgevent.SetParam("param1",person_id);
		msgevent.SetParam("card",msgCurrentPerson.GetParam("card").replace(/\s*/g,''));
		msgevent.SetParam("facility_code",msgCurrentPerson.GetParam("facility_code").replace(/\s*/g,''));	
		
		//проверяем, настройки функции контроля повторного прохода
		if(apb_enable)
		{			
			//отправляем событие APB по сотруднику
			NotifyEventGlobal(msgevent);
		
			//уcтанавливаем переменную детекции APB на служебном проходе
			Var_var(sp_name + "_is_APB")="true";
			
			//Запускаем ФИ с окном "Попытка повторного прохода"
			runFI(obj_nc32k.main_fi, person_id, obj_nc32k.direction, "APB", event_time, event_date, false);
			
			//Показываем на рабочем месте оператора СП окно, информации о нарушении режима 
			DoReactStr("DIALOG","APB_info_" + sp_name,"CLOSE_ALL","");	
			DoReactStr("DIALOG","APB_info_" + sp_name,"RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,person_name<"+person_name+">,pass_info<"+pass_info+">,location<"+nc32_name+">");
			DoReactGlobalStr("DIALOG","APB_info_ARMVIDEO03","RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,person_name<"+person_name+">,pass_info<"+pass_info+">,location<"+nc32_name+">");
			DoReactGlobalStr("DIALOG","APB_info_CMARM2","RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,person_name<"+person_name+">,pass_info<"+pass_info+">,location<"+nc32_name+">");
			
			//показываем титры на соответствующей камере
			var title_text = arrow_mark + " " + person_name + " - " + person_dept + ". Попытка повторного " + obj_nc32k.direction + "а!";					
			addTitle(title_text, obj_sp.titler_pass, obj_sp.cam_id);
			
			is_apb = true;
		}
		
		DoReactGlobalStr("DIALOG","APB_info_ARMVIDEO08","RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,person_name<"+person_name+">,pass_info<"+pass_info+">,location<"+nc32_name+">");
		
		if(save_log_to_file)
		{
			saveLogString(getDateTimeStr(now));
			saveLogString("\t" + "Block№: 21");
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "pass_info: " + pass_info);
			saveLogString("\t\t" + "nc32_name: " + nc32_name);
			saveLogString("\t\t" + "sp_name: " + sp_name);
			saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
			saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
			saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
			saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
		}

		if(save_log_to_sql)
		{
			saveLogToSQL({
					event: "APB",
					sp_id: sp_name,
					card: card,
					facility_code: facility_code,
					person_id: person_id,
					person_name: person_name,
					person_dept: person_dept,
					last_pass_info: last_pass,
					info: "reader: " + nc32_name
					});
		}		
	}	
	
	//Если наличия APB нет, начинаем процедуру генерацию события запрос на проход
	if (!is_apb)
	{								
		//Запускаем ФИ с окном "Запрос на проход"
		runFI(obj_nc32k.main_fi, person_id, obj_nc32k.direction, "canPass", event_time, event_date, false);

		//показываем титры на соответствующей камере
		var title_text = arrow_mark + " " + person_name + " - " + person_dept + ". Запрос на " + obj_nc32k.direction;					
		addTitle(title_text, obj_sp.titler_pass, obj_sp.cam_id);				
	}
		
	var status  = "";
	//проверяем включен ли авто режим	
	if(Itv_var(sp_name + "_is_auto_mode") == "true")
	{					
		status  = "wait_for_bioverification";							
	}
	else 
	{
		status  = "wait_for_officers_control"; 
	}				
	//выводим информацию на монитор информирования
	show_info_status(sp_name,status);				
	
	//отправляем данные на модуль распознавания лиц
	//var person_guid = msgCurrentPerson.GetParam("guid");
	//var command_line = "python C:\\intellect\\intellect_message.py " + person_guid + " " + obj_nc32k.id;
	//var command_line = "calc.exe";
	//DoReactGlobalStr("SLAVE","DOM2VIDEOSRV7","CREATE_PROCESS","command_line<" + command_line + ">");
	//DebugLogString("-------------command_line: " + command_line);	
}
//функция проверки допустимого времени проведенного сотрудником в ЗДРО
function checkValidZDROTime(person_id)
{
	var result = false;	
	
	var area_change = GetObjectParam("PERSON",person_id,"when_area_id_changed");
	DebugLogString("--------------area_change: " + area_change);
	var date_area_change;
	var is_error_parse_date_area_change = false;	
	try
	{
		date_area_change = get_area_change_date(area_change);
	}
	catch(err)
	{
		is_error_parse_date_area_change = true;
		
		if(save_log_to_file)
		{
			saveLogString(getDateTimeStr(now));
			saveLogString("\t" + "Block№: 22");
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "Ошибка парсинга даты пересечения зоны!");
			saveLogString("\t\t" + "area_change: " + area_change);
			saveLogString("\t\t" + "err.name: " + err.name + " err.message:" + err.message);
		}
		
		DebugLogString("--------------Ошибка парсинга даты пересечения зоны!");
		DebugLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
	}
	if(is_error_parse_date_area_change == false)
	{
		var person_area_id = GetObjectParam("PERSON",person_id,"area_id");		
		//отладочный блок
		if(save_log_to_file)
		{
			saveLogString("\t" + "Block№: 23");
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "person_id: " + person_id);
			saveLogString("\t\t" + "person_area_id: " + person_area_id);
			saveLogString("\t\t" + "date_area_change: " + date_area_change);
			saveLogString("\t\t" + "now: " + now);		
		}		
		//если зона сотрудника соответствует ЗДРО
		if(person_area_id == area_ZDRO)
		{
			if(date_area_change)
			{
				var ms = now - date_area_change;
				if(save_log_to_file)
				{
					saveLogString("\t" + "Block№: 24");
					saveLogString("\t\t" + "script_name: " + script_name);
					saveLogString("\t\t" + "ms: " + ms);
				}
				//если струдник провел в ЗДРО меньше 30 часов (108000000 ms)
				if(ms < 108000000)
				{
					result = true;
				}
			}
		}
		if(save_log_to_file)
		{
			saveLogString("\t" + "Block№: 25");
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "result: " + result);
		}
	}	
	return result;
}
//обработка события верификации отпечка пальца
function fingerPrintVerification(obj_nc32k, card, facility_code)
{
	var sp_name = obj_nc32k.sp_name;
	var person_id = Var_var(sp_name + "_current_person_id");
	var person_name = getPersonFIO(person_id);
	var current_card = GetObjectParam("PERSON",person_id,"card").replace(/\s*/g,'');
	//current_card = current_card.replace(/\s*/g,'');
	var current_facility_code = GetObjectParam("PERSON",person_id,"facility_code").replace(/\s*/g,'');
	
	//Если совпадает номер карты совпадает с картой текущего сотрудника:
	//т.е. событие, которое наступает после успешной верификации отпечатка пальца
	if ((current_card == card) 
		&& (Number(current_facility_code) == Number(facility_code)))
	{
		//Если на служебном проходе не зафиксирован APB
		if(Var_var(sp_name + "_is_APB") != "true")
		{
			//нажимаем кнопку соответствующей ФИ (пропущен автоматически)
			DoReactStr("PHOTO_IDENT",obj_nc32k.main_fi,"HANDLE_CUR_EVENT","button<Кнопка3>,service_force<>");
			//пропускаем текущего сотрудника
			grantToPass(sp_name, "автоматически");							
		}
		//если зафиксирован APB 
		else
		{
			var text = "У сотрудника " + person_name + " идентификация отпечатка пальца прошла успешно."
			+ " Разрешение или запрет пропуска, при зафиксированном нарушении режима, осуществляется контролером (нажатием кнопки на экране АРМ).";										
									
			//Показываем на рабочем месте оператора СП окно, информации о о том, 
			//верификация на биометрическом считывателе успешна, однако решение о проходе должен принять контролер. 
			DoReactStr("DIALOG","info_" + sp_name,"CLOSE_ALL","");	
			DoReactStr("DIALOG","info_" + sp_name,"RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,text<"+text+">");
			DoReactGlobalStr("DIALOG","info_DOM2ARMVIDEO08","RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,text<"+text+">,sp_name<" + sp_name + ">");
			
			//Выводим сообщение сотруднику, о том, что ему необходимо ожидать решение контролера.
			show_info_status(sp_name,"wait_for_officers_control");
			
			if(save_log_to_file)
			{
				saveLogString(getDateTimeStr(now));
				saveLogString("\t" + "Block№: 26");
				saveLogString("\t\t" + "script_name: " + script_name);
				saveLogString("\t\t" + "info_text: " + text);
				saveLogString("\t\t" + "sp_name: " + sp_name);
				saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
				saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
				saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
				saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
			}
		}																
	}
	//если номер карты равен "0". Расцениваем как событие ошибки верификации.
	//Чтобы при ошибки верификации контроллер выдавал номер карты, равный нулю,
	//нужно подобрать соответствующий кастомный формат WIEGAND в настройках био считывателя 
	else if(card == "0")
	{
		if(save_log_to_file)
		{
			saveLogString(getDateTimeStr(now));
			saveLogString("\t" + "Block№: 27");
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "Неудачная верификация отпечатка пальца");
			saveLogString("\t\t" + "facility_code: " + facility_code);
			saveLogString("\t\t" + "card: " + card);			
			saveLogString("\t\t" + "sp_name: " + sp_name);
			saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
			saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
			saveLogString("\t\t" + "current_person_id: " + person_id);
			saveLogString("\t\t" + "current_person_facility_code: " + current_facility_code);
			saveLogString("\t\t" + "current_person_card: " + current_card);
			saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
			saveLogString("\t\t" + "verification_faults: " + Var_var(sp_name + "_verification_faults"));
		}
		
		//проверяем количество неправильных попыток верификации
		var verification_faults = 0;
		verification_faults = Number(Var_var(sp_name + "_verification_faults"));
		verification_faults++;
		Var_var(sp_name + "_verification_faults") = String(verification_faults);
		
		//если зафиксировано три неудачных попытки верификации отпечатка пальца
		if(verification_faults == 3)
		{
			var text = "У сотрудника " + person_name + " зафиксированы три попытки неудачной идентификации отпечатка пальца."
			+ " Убедитесь в том, что карта принадлежит предъявителю!";										
									
			//отсылаем информацию оператору 
			DoReactStr("DIALOG","info_" + sp_name,"CLOSE_ALL","");	
			DoReactStr("DIALOG","info_" + sp_name,"RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,text<"+text+">");
			//DoReactGlobalStr("DIALOG","info_DOM2ARMVIDEO08","RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,text<"+text+">,sp_name<" + sp_name + ">");
			
			if(save_log_to_file)
			{
				saveLogString(getDateTimeStr(now));
				saveLogString("\t" + "Block№: 28");
				saveLogString("\t\t" + "script_name: " + script_name);
				saveLogString("\t\t" + "info_text: " + text);
				saveLogString("\t\t" + "sp_name: " + sp_name);
				saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
				saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
				saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
				saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
			}
			
			if(save_log_to_sql)
			{
				saveLogToSQL({
					event: "Третья неудачная попытка верификации пальца",
					sp_id: sp_name,
					card: card,
					facility_code: facility_code,
					person_id: person_id,
					person_name: person_name,
					person_dept: GetObjectName("DEPARTMENT",GetObjectParentId("PERSON", person_id, "DEPARTMENT")),
					info: "reader_id: " + obj_nc32k.id
					});
			}
		}						
								
		//отсылаем тревожное сообщение на инфо-панель
		show_info_status(sp_name,"bioverification_fault");
	}
	//если номер карты не соответствует карте, предъявленной на внешнем считывателе 
	else if ((Var_var(sp_name + "_sp_status") != "show_access_deny") && facility_code.length < 3)
	{
		if(save_log_to_file)
		{
			saveLogString(getDateTimeStr(now));
			saveLogString("\t" + "Block№: 29");
			saveLogString("\t\t" + "script_name: " + script_name);
			saveLogString("\t\t" + "Попытка прохода по разным картам");
			saveLogString("\t\t" + "facility_code: " + facility_code);
			saveLogString("\t\t" + "card: " + card);			
			saveLogString("\t\t" + "sp_name: " + sp_name);
			saveLogString("\t\t" + "sp_status: " + Var_var(sp_name + "_sp_status"));
			saveLogString("\t\t" + "current_nc32k: " + Var_var(sp_name + "_current_nc32k"));
			saveLogString("\t\t" + "current_person_id: " + Var_var(sp_name + "_current_person_id"));
			saveLogString("\t\t" + "current_facility_code: " + current_facility_code);
			saveLogString("\t\t" + "current_person_card: " + current_card);
			saveLogString("\t\t" + "is_APB: " + Var_var(sp_name + "_is_APB"));
		}
		
		var text = "Карта, предъявленная на внешнем считывателе, не соответствует карте на биометрическом считывателе!";										
									
		//Показываем на рабочем месте оператора СП инфо-окно, о том, что
		//карты на считывателях различаются. 
		DoReactStr("DIALOG","info_" + sp_name,"CLOSE_ALL","");	
		DoReactStr("DIALOG","info_" + sp_name,"RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,text<"+text+">");
		DoReactGlobalStr("DIALOG","info_DOM2ARMVIDEO08","RUN","date<"+formatEventDate(event_date)+">,time<"+event_time+">,text<"+text+">,sp_name<" + sp_name + ">");
		
		if(save_log_to_sql)
		{
			saveLogToSQL({
					event: "Попытка прохода по разным картам",
					sp_id: sp_name,
					card: card,
					facility_code: facility_code,
					person_id: person_id,
					person_name: person_name,
					person_dept: GetObjectName("DEPARTMENT",GetObjectParentId("PERSON", person_id, "DEPARTMENT")),
					info: "reader_id: " + obj_nc32k.id
					});
		}
	}
}
//функция форматирования даты события
function formatEventDate(str_date)
{
	var arr_date = str_date.split("-");	
	if(arr_date.length != 3)
	{
		arr_date = str_date.split(".");		
	}	
	if(arr_date.length = 3)
	{
		if(arr_date[2].length = 2)
		{
			arr_date[2] = "20" + arr_date[2];
		}
		str_date = arr_date[0] + "." + arr_date[1] + "." + arr_date[2]		
	}	
	return str_date;
}
//функция сохранения лога в sql-сервера
function saveLogToSQL(options)
{
	if(!options.event)
	{
		return;
	}
	
	var event = "'" + options.event + "'";
	var sp_id = options.sp_id || "NULL";
	var facility_code = options.facility_code || "NULL";
	var card = options.card || "NULL";
	var person_id = options.person_id || "NULL";
	var person_name = options.person_name || "NULL";
	var person_dept = options.person_dept || "NULL";	
	var info = options.info || "NULL";
	var last_pass_info = options.last_pass_info || "NULL";
	
	//DebugLogString("-------event: " + event);
	//DebugLogString("-------sp_id: " + sp_id);
	//DebugLogString("-------facility_code: " + facility_code);
	//DebugLogString("-------card: " + card);	
	
	if (sp_id != "NULL") sp_id = "'" + sp_id + "'";
	if (facility_code != "NULL") facility_code = "'" + facility_code + "'";
	if (card != "NULL") card = "'" + card + "'"; 
	if (person_id != "NULL") person_id = "'" + person_id + "'"; 
	if (person_name != "NULL") person_name = "'" + person_name + "'"; 
	if (person_dept != "NULL") person_dept = "'" + person_dept + "'"; 
	if (info != "NULL") info = "'" + info + "'"; 
	if (last_pass_info != "NULL") last_pass_info = "'" + last_pass_info + "'"; 
	
	var query = "insert [opk].[sp_log] ([event],[sp_id],[facility_code],[card],[person_id],[person_name],[person_dept],[info],[last_pass_info])" +
				" values(" + event 
					 + "," + sp_id
					 + "," + facility_code 
					 + "," + card 
					 + "," + person_id 
					 + "," + person_name
					 + "," + person_dept
					 + "," + info
					 + "," + last_pass_info
					 + ")";
	
	var connection = new ActiveXObject("ADODB.Connection");
	connection.Open(sql_connection_str);
	try
	{
		connection.Execute(query);
		//DebugLogString("-------Запрос в БД: " + query + " выполнен");
	}
	catch(err)
	{
		DebugLogString("-------Ошибка записи данных в базу данных!");
		DebugLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
		
		saveLogString(getDateTimeStr(now));
		saveLogString("-------Ошибка записи данных в базу данных!");
		saveLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
		saveLogString("--------------query: " + query);
	}
	finally
	{
		connection.close;
		//DebugLogString("-------Закрыл соединение!");
	}	
}
//функция проверки в уровне доступа сотрудника разрешения на проход на определенной точке доступа
function checkPersonsLevelForNc32K(person_id, nc32k)
{
	DebugLogString("----person_id =" + person_id);
	if(save_log_to_file)
	{
		saveLogString("\t" + "Block№: 30");
		saveLogString("----person_id =" + person_id);
	}
	
	try
	{
		var person_level = GetObjectParam("PERSON",person_id,"level_id");
		DebugLogString("-------person_level: <" + person_level + ">");
		
		if(save_log_to_file)
		{
			saveLogString("-------person_level: <" + person_level + ">");			
		}
		
		
		var arr_person_levels = person_level.split(",");
		var msg_level = CreateMsg();
		for(var i=0; i < arr_person_levels.length; i++)
		{
			DebugLogString("----person_level: " + i + " = <" + arr_person_levels[i] + ">");
			
			if(save_log_to_file)
			{
				saveLogString("----person_level: " + i + " = <" + arr_person_levels[i] + ">");			
			}
			
			
			msg_level.StringToMsg(GetObjectParams("LEVEL", arr_person_levels[i]));
			DebugLogString("msg_level.MsgToString(): " + msg_level.MsgToString());
			
			var level_reders_count = Number(msg_level.GetParam("READER.reader_id.count"));
			
			for(var j=0; j < level_reders_count; j++)
			{
				if(msg_level.GetParam("READER.reader_id." + String(j)) ==  nc32k)
				{
					DebugLogString("-------checkPersonsLevelForNc32K_result: true");
					
					if(save_log_to_file)
					{
						saveLogString("-------checkPersonsLevelForNc32K_result: true");			
					}
					
					if(msg_level.GetParam("READER.time_zone." + String(j)) == "*") return true;
				}	
			}		
			
		}
	}
	catch(err)
	{
		if(save_log_to_file)
		{
			saveLogString("\t" + "Block№: 31");
			saveLogString("--------------Ошибка в функции checkPersonsLevelForNc32K!");
			saveLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
		}		
		
		DebugLogString(getDateTimeStr(now) + "-----------Ошибка в функции checkPersonsLevelForNc32K!");
		DebugLogString("--------------err.name: " + err.name + "---err.message:" + err.message);
		
	}	
	return false;
}