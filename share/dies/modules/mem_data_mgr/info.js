{
	"Name": "mem-data-mgr",
	"Version": "0.2",
	"Title": "Dies memory based data manager",
	"Description": "Keeps the data of the diary entries in RAM and makes them accessible there.",
	
	"ExtensionPoints": {
	},
	
	"Extensions": [
		{
			"Path": "/dies/data-mgr",
			"Class": "dies/mem_data_mgr/mgr::Manager"
		}
	]
}
