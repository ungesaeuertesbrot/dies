const Context = imports.malus.context;


function Root ()
{
	this._init ();
}

Root.prototype = {
	
	_init: function () {
		Context.modules.add_extension_listener ("/dies/gui", function (pt, ext) {
			Context.gui = Context.modules.get_extension_object (ext);
		});
		Context.modules.add_extension_listener ("/dies/data_mgr", function (pt, ext) {
			Context.data_mgr = Context.modules.get_extension_object (ext);
		});
		if (!Context.gui)
			throw new Error ("No user interface found!");
		if (!Context.data_mgr)
			throw new Error ("No data manager found!");
		
		Context.active_collection = Context.data_mgr.create_collection ();
	},
	
	run: function () {
		Context.gui.present ();
		Context.gui.run ();
	}
};

