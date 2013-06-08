{
	"Name": "gnome",
	"Version": "0.2",
	"Title": "Dies GNOME user interface",
	"Description": "A user interface for the dies programm using GTK+/GNOME 3.",
	
	"ExtensionPoints": {
		"/dies/gnome/editor/tab": {
			"TestArgs": {
				"getTab": "function",
				"tabTitle": "string"
			}
		}
	},
	
	"Extensions": [
		{
			"Path": "/dies/gui",
			"Class": "dies/gnome/gui::Gui"
		}
	]
}
