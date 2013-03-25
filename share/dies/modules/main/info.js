{
	"name": "main",
	"version": "0a",
	"title": "Dies main module",
	"description": "The core of the dies programm. It provides the code necessary for starting the application.",
	
	"extension_points": {
		"/dies/gui": {
			"is_singular": true,
			"test_args": {
				"present": "function",
				"hide": "function",
				"run": "function",
				"quit": "function"
			}
		},
		
		"/dies/storage": {
			"test_args": {}
		},
		
		"/dies/data_mgr": {
			"test_args": {
				"id": "",
				"type": "string",
				"multi": "boolean",
				"storage": "",
				"create_collection": "function"
			}
		}
	},
	
	"extensions": [
		{
			"extends": "/",
			"extension_class": "dies/root::Root"
		}
	]
}
