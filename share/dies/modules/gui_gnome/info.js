{
	"name": "gui_gnome",
	"version": "0a",
	"title": "Dies GNOME user interface",
	"description": "A user interface for the dies programm using GTK+/GNOME 3.",
	
	"extension_points": {
		"/dies/gui_gnome/editor": {
			"test_args": {
				"set_contents": "function",
				"get_contents": "function",
				"changed": "gsignal"
			}
		},
		
		"/dies/gui_gnome/overview": {
			"test_args": {
				"set_date": "function",
				"get_date": "function",
				"date-selected": "gsignal",
				"date-add": "gsignal"
			}
		}
	},
	
	"extensions": [
		{
			"extends": "/dies/gui",
			"extension_class": "dies/gui_gnome/gui::Gui"
		},
		
		{
			"extends": "/dies/gui_gnome/editor",
			"extension_class": "dies/gui_gnome/basic_editor::Editor"
		},
		
		{
			"extends": "/dies/gui_gnome/overview",
			"extension_class": "dies/gui_gnome/calendar_pane::Overview"
		}
	]
}
