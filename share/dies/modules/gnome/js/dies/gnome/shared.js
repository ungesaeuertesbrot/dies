const GLib = imports.gi.GLib;
const Context = imports.malus.context;

const MODULE_NAME = "gnome";

var module_dir = Context.modules.get_module_directory (MODULE_NAME);
var ui_dir = GLib.build_filenamev ([module_dir, "ui"]);

