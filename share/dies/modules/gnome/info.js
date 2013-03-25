{
	"name": "gnome",
	"version": "0a",
	"title": "Dies GNOME user interface",
	"description": "A user interface for the dies programm using GTK+/GNOME 3.",
	
	"extension_points": {
	},
	
	"extensions": [
		{
			"extends": "/dies/gui",
			"extension_class": "dies/gnome/gui::Gui"
		}
	]
}
