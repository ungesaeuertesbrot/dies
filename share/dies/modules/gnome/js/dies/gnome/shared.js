const GLib = imports.gi.GLib;
const Context = imports.malus.context;

const MODULE_NAME = "gnome";

var module_dir = Context.modules.get_module_directory (MODULE_NAME);
var ui_dir = GLib.build_filenamev ([module_dir, "ui"]);



function make_date_string (date)
{
	let date_time = GLib.DateTime.new(GLib.TimeZone.new_local(),
									  date.get_year(), date.get_month(), date.get_day(),
									  0, 0, 0);
	return date_time.format("%A, %x");
}


function make_list_caption (item)
{
	var caption = "<b>" + make_date_string (item.date) + "</b>";
	if (item.title)
		caption += "\n" + item.title;
	return caption;
}

