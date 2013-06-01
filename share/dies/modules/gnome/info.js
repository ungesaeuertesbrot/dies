{
	"name": "gnome",
	"version": "0.1",
	"title": "Dies GNOME user interface",
	"description": "A user interface for the dies programm using GTK+/GNOME 3.",
	
	"extension_points": {
		"/dies/gnome/editor/tab": {
			"test_args": {
				"getTab": "function",
				"tabTitle": "string"
			}
		}
	},
	
	"extensions": [
		{
			"extends": "/dies/gui",
			"extension_class": "dies/gnome/gui::Gui"
		}
	]
}
