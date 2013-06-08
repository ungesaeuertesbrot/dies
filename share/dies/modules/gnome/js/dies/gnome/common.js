const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const MODULE_NAME = "gnome";

function makeDateString(date)
{
	let dateTime = GLib.DateTime.new(GLib.TimeZone.new_local(),
									 date.get_year(), date.get_month(), date.get_day(),
									 0, 0, 0);
	return dateTime.format("%A, %x");
}

