const Lang = imports.lang;
const GLib = imports.gi.GLib;
const GObj = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const MainWnd = imports.dies.gnome.main_window;

GObj.type_init();
Gtk.init(null, null);

const Gui = new Lang.Class({
	Name: "DiesGnomeGui",
	Extends: Gtk.Application,
	
	_init: function() {
		this.parent({"application-id": "net.schoel.Dies",
					 "flags": Gio.ApplicationFlags.FLAGS_NONE,
					 "inactivity-timeout": 30000,
					 "register-session": true});
		this.register(null);
	},
	
	vfunc_startup: function() {
		this.parent();
		this.main_window = new MainWnd.MainWindow(this);
	},
	
	vfunc_activate: function() {
		this.parent();
		this.main_window.show();
	},
});

// We need this because in GJS we cannot easily use GDate in a ListStore

function __date_to_int (date)
{
	return (date.get_day () & 31) | ((date.get_month () & 15) << 5) | (date.get_year () << 9);
}


function __int_to_date (i)
{
	var day = i & 31;
	var month = (i >> 5) & 15;
	var year = i >> 9;
	var result = new GLib.Date ();
	result.set_dmy (day, month, year);
	return result;
}


function __make_date_string (date)
{
	var weekdays = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday"
	];
	var months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"Septembre",
		"Octobre",
		"Novembre",
		"Decembre"
	];
	
	var today_js = new Date ();
	var today = GLib.Date.new_dmy (today_js.getDate (), today_js.getMonth () + 1, today_js.getFullYear ());
	var diff = date.days_between (today);
	if (diff === 0)
		return "Today";
	if (diff === 1)
		return "Yesterday";
	if (diff <= 6 && diff > 0)
		return weekdays[date.get_weekday () - 1];
	return "{0}, {1}. {2} {3}".format (weekdays[date.get_weekday () - 1], date.get_day (), months[date.get_month () - 1], date.get_year ());
}


function __make_list_caption (item)
{
	var caption = "<b>" + __make_date_string (item.date) + "</b>";
	if (item.title)
		caption += "\n" + item.title;
	return caption;
}

