DIES
====

**Diary for intensive ethnographic research**

Introduction
------------

Dies is a diary application intended for facilitating ethnographic research. It
shall receive functionality that will make it particularly suited to that
purpose and will probably also make it into a very good travel diary. Currently
though, it is absolutely rudimentary and should be seen mainly as a
demonstration of the possibilities that Gjs provides in combination with MALUS
(https://github.com/ungesaeuertesbrot/malus.git).

Installing
----------

Currently there is no build system or script to automate installation. This is
so partly because I feel that there is excessively little need for such a
script. These are the steps to follow for a manual installation:

1. Make sure you have the following software installed on your system (if you
   are running GNOME version 3.6 or above they will already be present):
   1. Gjs >= 1.34
   2. GLib >= 2.? (didn't check the exact requirements)
   3. Gio
   4. GTK+ >= 3.0
2. Copy the files from the MALUS repository (see above) into a prefix of your
   choice (like /usr/local or your home directory).
3. Copy the files from the DIES repository
   (https://github.com/ungesaeuertesbrot/dies) into a prefix of your choice.
4. Edit the dies script inside bin in the prefix you chose for DIES and adjust
   the the paths of the prefixes according to the choices you have made above.
5. Run that script and enjoy DIES.

Structure
---------

Dies is built upon the malus framework. This means that it is made up of modules
containing extensions and extension points. The modules are:

* **main**: This is where execution of DIES beginns. It sets up some controling
  logic and instantiates a data manager and a UI.
* **gnome**: A user interface for the GNOME. It is based on GTK+3 and
  GApplication/GTKApplication.
* **json\_data\_mgr**: Handles data in memory and stores it in JSON format.

