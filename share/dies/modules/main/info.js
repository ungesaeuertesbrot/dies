{
	"Name": "main",
	"Version": "0.2",
	"Title": "Dies main module",
	"Description": "The core of the dies programm. It provides the code necessary for starting the application.",
	
	"ExtensionPoints": {
		"/dies/gui": {
			"IsSingular": true,
			"TestArgs": {
				"run": "function",
				"quit": "function"
			}
		},
		
		"/dies/storage": {
			"TestArgs": {}
		},
		
		"/dies/data_mgr": {
			"TestArgs": {
				"id": "",
				"type": "string",
				"multi": "boolean",
				"storage": "",
				"createCollection": "function"
			}
		}
	},
	
	"Extensions": [
		{
			"Path": "/malus/root",
			"Class": "dies/root::Root"
		}
	]
}
