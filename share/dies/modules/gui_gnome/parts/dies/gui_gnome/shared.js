const GLib = imports.gi.GLib;
const Context = imports.malus.Context;

const MODULE_NAME = "gui_gnome";

var module_dir = Context.module_manager.get_module_directory (MODULE_NAME);
var ui_dir = GLib.build_filenamev ([module_dir, "ui"]);

