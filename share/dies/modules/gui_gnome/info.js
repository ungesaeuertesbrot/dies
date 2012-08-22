{
	"name": "gui_gnome",
	"version": "0a",
	"title": "Dies GNOME user interface",
	"description": "A user interface for the dies programm using GTK+/GNOME 3.",
	
	"extension_points": {
		"/dies/gui_gnome/editor": {
			"test_args": {
				"widget": "",
				"set_contents": "function",
				"get_contents": "function",
				"changed": "event"
			}
		},
		
		"/dies/gui_gnome/pane": {
			"test_args": {
				"widget": "",
				"set_date": "function",
				"get_date": "function",
				"date_selected": "event",
				"date_add": "event"
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
			"extends": "/dies/gui_gnome/pane",
			"extension_class": "dies/gui_gnome/calendar_pane::Pane"
		}
	]
}
