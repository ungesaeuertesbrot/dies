const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const GObj = imports.gi.GObject;
const Pango = imports.gi.Pango;

const Context = imports.malus.context;

function Gui ()
{
	Gtk.init (null, null);
	this._init ();
}


Gui.prototype = {
	/*
	 * Sets up the object.
	 */
	_init: function () {
		Context.modules.add_extension_listener ("/dies/gui_gnome/overview", function (path, ext) {
			this.overview = Context.modules.get_extension_object (ext);
		}.bind (this));
		Context.modules.add_extension_listener ("/dies/gui_gnome/editor", function (path, ext) {
			this.editor = Context.modules.get_extension_object (ext);
		}.bind (this));
		this.__build_window ();
	},
	
	
	/*
	 * Creates the window and its contents and connects to signals.
	 */
	__build_window: function () {
		this.base_box = new Gtk.Paned ({orientation: Gtk.Orientation.HORIZONTAL, position: 0});
		this.base_box.pack1 (this.overview, false, false);
		this.base_box.pack2 (this.editor, true, false);
		this.base_box.show_all ();
	
		this.window = new Gtk.Window ({type: Gtk.WindowType.TOPLEVEL, title: "Dies"});
		this.window.connect ("delete-event", function (a, e) {this.quit ()}.bind (this));
		this.window.child = this.base_box;
	},
	
	present: function () {
		this.window.show ();
	},
	
	hide: function () {
		this.window.hide ();
	},
	
	run: function () {
		this.present ();
		Gtk.main ();
	},
	
	quit: function () {
		Gtk.main_quit ();
	},
};


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

