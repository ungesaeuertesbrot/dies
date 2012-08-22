{
	"name": "mem_data_mgr",
	"version": "0a",
	"title": "Dies memory based data manager",
	"description": "Keeps the data of the diary entries in RAM and makes them accessible there.",
	
	"extension_points": {
	},
	
	"extensions": [
		{
			"extends": "/dies/data_mgr",
			"extension_class": "dies/mem_data_mgr/mgr::Manager"
		}
	]
}
