// Скрипт запоминает дату и время просмотренного кадра на мониторе наблюдения, в тот момент, когда нажата клавиша "пауза".
// Затем, если запустить макрокоманду "Установить время воспроизведения", то на активном мониторе установится время воспроизведения, запомненное на предыдущем шаге.
// version 1.2 добавлена функция установки даты по событию входа в архив.
// version 1.3 добавлена функция установки даты по клику по камере на карте, с условием, что до этого была нажата пауза.
// version 1.4 добавлено отключение звука на мониторе, при переходе на другую камеру.
// version 1.5 переработана логика команд.
// version 1.6 добавлена поддержка внешнего хранилища.
// © Молотков С.А. 2017, 2018

if (Event.SourceType == "MONITOR")
{
	if(Event.GetParam("module") == "video.run")
	{
		//если нажата клавиша "Пауза", запоминаем дату и время текущего кадра и номер монитора
		//также устанавливаем флаг запоминания, для исключения последующий рекурсий
		if (Event.Action=="PLAY_PAUSE")
		{
			var slave_id = Event.GetParam("slave_id");
			//var cam = {name: "", id: "", audio_id: "", audio_type: "",  slave_id: ""}; //объект - камера
			
			var cam_id = Event.GetParam("cam");
			//DebugLogString("------------------Event.GetParam(cam): " + cam_id);
			//cam.audio_id = GetObjectParam("CAM",cam_id,"audio_id");		
			//DebugLogString("------------------GetObjectParam(CAM,cam_id,audio_id): " + cam.audio_id);
			
			Var_var(slave_id + "_monitor_id") = Event.SourceId;
			Var_var(slave_id + "_monitor_date") = Event.GetParam("date");
			Var_var(slave_id + "_monitor_time") = Event.GetParam("time");
			Var_var(slave_id + "_monitor_cam") = cam_id;
			//Var_var(slave_id + "_monitor_audio_settings") = get_cams_mics_settings(cam_id); //запоминаем настройки микрофонов камеры для последующего отключения их воспроизведения (если звук был включен)		
			
			
			//Var_var(slave_id + "_monitor_time_saved") - флаг защиты от бесконечной рекурсии,		
			
			Lock();
				Var_var(slave_id + "_monitor_time_saved") = "true";
			Unlock();
			
			//DebugLogString("---------------Var_var(slave_id + _monitor_id): " + Var_var(slave_id + "_monitor_id"));
			//DebugLogString("---------------Var_var(slave_id + _monitor_date): " + Var_var(slave_id + "_monitor_date"));
			//DebugLogString("---------------Var_var(slave_id + _monitor_time): " + Var_var(slave_id + "_monitor_time"));
			//DebugLogString("---------------Var_var(slave_id + _monitor_cam): " + Var_var(slave_id + "_monitor_cam"));
			//DebugLogString("---------------Var_var(slave_id + _monitor_time_saved: " + Var_var(slave_id + "_monitor_time_saved"));		
		}
		// при щелчке по области монитора, запоминаем монитор и его камеру
		else if (Event.Action=="ACTIVATE_CAM")
		{
			var slave_id = Event.GetParam("slave_id");
			Var_var(slave_id + "_monitor_id") = Event.SourceId;
			Var_var(slave_id + "_monitor_cam") = Event.GetParam("cam");
			//DebugLogString("---------------slave_id: " + slave_id);
			//DebugLogString("---------------Var_var(slave_id + _monitor_id): " + Var_var(slave_id + "_monitor_id"));
			//DebugLogString("---------------Var_var(slave_id + _monitor_cam): " + Var_var(slave_id + "_monitor_cam"));
		}
		//по событию выхода из архива, сбрасываем Var_var(slave_id + "_monitor_time_saved")
		else if (Event.Action=="ARCH_EXIT")
		{
			var slave_id = Event.GetParam("slave_id");
			Lock();
				Var_var(slave_id + "_monitor_time_saved") = "false";
			Unlock();
			//DebugLogString("---------------Var_var(slave_id + _monitor_time_saved: " + Var_var(slave_id + "_monitor_time_saved"));	
		}
	}
	
	//при щелчке по камере на карте, включается эта камера, с запомненным временем воспроизведения
	if(Event.Action=="ACTIVATE_OBJECT")
	{
		var slave_id = Event.GetParam("slave_id");
		var mon_id = Event.SourceId;
		var cam_id = Event.GetParam("cam");
		var speaker_id = GetObjectParam("SLAVE",slave_id,"speaker_id"); //динамик компьютера
		
		if(Var_var(slave_id + "_monitor_id")==mon_id)
		{
			if(Var_var(slave_id + "_monitor_time_saved") == "true")
			{
				if(Var_var(slave_id + "_monitor_date") !== "" && Var_var(slave_id + "_monitor_time") !== "")
				{				
					//устанавливаем флаг защиты как обработанный				
					Lock();
						Var_var(slave_id + "_monitor_time_saved") = "false";
					Unlock();				
					
					//DebugLogString("----------Запускаем воспроизведение с сохраненной точки");
					//DebugLogString("----------mon_id: " + mon_id);
					//DebugLogString("----------cam_id: " + cam_id);
					//DebugLogString("----------Var_var(slave_id + _monitor_time_saved): " + Var_var(slave_id + "_monitor_time_saved"));
					//DebugLogString("----------Var_var(slave_id + _monitor_date): " + Var_var(slave_id + "_monitor_date"));
					//DebugLogString("----------Var_var(slave_id + _monitor_time): " + Var_var(slave_id + "_monitor_time"));
					//DebugLogString("----------Var_var(slave_id + _monitor_cam): " + Var_var(slave_id + "_monitor_cam"));
					
					//DoReactStr("MONITOR",mon_id,"KEY_PRESSED","key<MIC_OFF>");
					DoReactStr("MONITOR",mon_id,"KEY_PRESSED","key<MODE_VIDEO>");			 
					
					//Останавливаем воспроизведение звука предыдущей камеры				
					var previous_cam = Var_var(slave_id + "_monitor_cam");
					var arr_cams_mics = get_cams_mics_arr(previous_cam);
					//DebugLogString("----------arr_cams_mics.length: " + arr_cams_mics.length);
					if(arr_cams_mics.length > 0)
					{
						for(i=0; i<arr_cams_mics.length; i++)
						{
							DebugLogString("----------arr_cams_mics[" + i + "]: " + arr_cams_mics[i]);
							DoReactStr("OLXA_LINE",arr_cams_mics[i],"STOP_LISTEN","mon_id<" + mon_id + ">,slave_id<" + slave_id + ">,delay<1>");
							DoReactStr("SPEAKER",speaker_id,"STOP_REAL","mic_id<" + arr_cams_mics[i] + ">,delay<2>");
						}
					}

					//Переключаем монитор
					NotifyEventStr("MONITOR",mon_id,"ACTIVATE_OBJECT","cam<" + cam_id + ">,show<1>,slave_id<" + slave_id + ">");
					
					var ipstorage_id = "";
					ipstorage_id = get_monitor_cam_ip_storage(mon_id,cam_id);
					var params =  "";
					params =  "cam<" + cam_id + ">"
							+ ",date<" + Var_var(slave_id + "_monitor_date") + ">"
							+ ",time<" + Var_var(slave_id + "_monitor_time") + ">"
							+ ",__slave_id<" + slave_id + ">"
							+ ",delay<1>";
					
					if(ipstorage_id) params += ",mode<" + (Number(ipstorage_id) + 10) + ">";
					DebugLogString("params = " + params);
					
					//Устанавливаем время просмотра
					DoReactStr("MONITOR",mon_id,"ARCH_FRAME_TIME",params);			
				}
			}
		}		
		//DebugLogString("Var_var(slave_id + _monitor_time_saved) after exit :" + Var_var(slave_id + "_monitor_time_saved"));// + Var_var(slave_id + "_monitor_savePoint") + ">");
	}
} 
//по макрокоманде, воспроизводим запомненное время на активном мониторе
else if (Event.SourceType=="MACRO" && Event.SourceId == "4" && Event.Action=="RUN") // (Event.SourceType=="MACRO" && Event.SourceId == "540" && Event.Action=="RUN") // 
{
	var slave_id = Event.GetParam("slave_id");	
	//если скрипт запущен на сервере
	if(slave_id == "") slave_id = Event.GetParam("owner");

	//DebugLogString("---------------Var_var(slave_id + _monitor_id): " + Var_var(slave_id + "_monitor_id"));
	//DebugLogString("---------------Var_var(slave_id + _monitor_cam): " + Var_var(slave_id + "_monitor_cam"));
	//DebugLogString("---------------Var_var(slave_id + _monitor_date): " + Var_var(slave_id + "_monitor_date"));
	//DebugLogString("---------------Var_var(slave_id + _monitor_time): " + Var_var(slave_id + "_monitor_time"));
		
						
	if(Var_var(slave_id + "_monitor_date") !== "" && Var_var(slave_id + "_monitor_time") !== "")
	{				
		var mon_id = Var_var(slave_id + "_monitor_id");//Event.SourceId;// "106"; //
		var cam_id = Var_var(slave_id + "_monitor_cam");//Event.GetParam("cam"); //"79"; //  
		
		var ipstorage_id = "";
		ipstorage_id = get_monitor_cam_ip_storage(mon_id,cam_id);
		var params =  "";
		params =  "cam<" + cam_id + ">"
				+ ",date<" + Var_var(slave_id + "_monitor_date") + ">"
				+ ",time<" + Var_var(slave_id + "_monitor_time") + ">"
				+ ",__slave_id<" + slave_id + ">";				
		
		if(ipstorage_id) params += ",mode<" + (Number(ipstorage_id) + 10) + ">"; 
		DebugLogString("params = " + params);
		
		//Устанавливаем время просмотра
		DoReactStr("MONITOR",mon_id,"ARCH_FRAME_TIME",params);
		
		DoReactStr("MONITOR",mon_id,"KEY_PRESSED","key<PLAY>,__slave_id<" + slave_id + ">,delay<1>");			
	}			
	
}

//функция получения параметров настройки микрофонов камеры
function get_cams_mics_settings(cam_id)
{
	var settings = "";
	var msg = CreateMsg();
	msg.StringToMsg(GetObjectParams("CAM", cam_id));
	var cam_mics_count = 0;
	cam_mics_count = Number(msg.GetParam("AUDIO.mic_id.count"));
	if(cam_mics_count > 0)
	{
		settings = "AUDIO.mic_id.count<" + String(cam_mics_count) + ">";
		for(i=0; i<cam_mics_count; i++)
		{
			settings += ",AUDIO.mic_id." + i + "<" + msg.GetParam("AUDIO.mic_id." + i) + ">";			
		}
	}	
	return settings;
}

//функция получения массива id микрофонов камеры
function get_cams_mics_arr(cam_id)
{
	var arr_cams_mics = [];
	var msg = CreateMsg();
	msg.StringToMsg(GetObjectParams("CAM", cam_id));
	var cam_mics_count = 0;
	cam_mics_count = Number(msg.GetParam("AUDIO.mic_id.count"));
	if(cam_mics_count > 0)
	{		
		for(i=0; i<cam_mics_count; i++)
		{
			arr_cams_mics.push(msg.GetParam("AUDIO.mic_id."+i));
		}
	}	
	return arr_cams_mics;
}

//функция получает ID IP-хранилища в настройках камеры монитора
//если у камеры нет настроек IP-хранилища, возвращается пустое значение
function get_monitor_cam_ip_storage(mon_id, cam_id)
{
	var ipstorage_id = ""
	var cam_number = "";
	var cam_count; 
	
	var msg_mon = CreateMsg();
	msg_mon.StringToMsg(GetObjectParams("MONITOR", mon_id));
	
	cam_count = Number(msg_mon.GetParam("CAM.cam.count"));	
	
	//DebugLogString("cam_count = " + cam_count);
	
	if(cam_count)
	{
		for(i=0; i<cam_count; i++)
		{
			if(msg_mon.GetParam("CAM.cam." + String(i)) == cam_id)
			{
				cam_number = String(i);
				break;
			}
		}
	}

	if(cam_number)
	{
		ipstorage_id = msg_mon.GetParam("CAM.ipstorage." + cam_number);
		//DebugLogString("ipstorage_id = " + ipstorage_id);		
	}
	
	return ipstorage_id;
}
