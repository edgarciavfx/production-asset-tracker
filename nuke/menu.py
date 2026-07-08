# Flipbook — Nuke menu integration.
#
# Drop this file (and flipbook_publish.py) into ~/.nuke, or add this directory
# to your NUKE_PATH environment variable. It adds a "Publish to Flipbook" item
# under a top-level "Flipbook" menu and to the node-graph right-click menu.

import nuke
import flipbook_publish


def _publish():
    flipbook_publish.publish()


# Top menu: Flipbook > Publish to Flipbook  (F8)
menubar = nuke.menu("Nuke")
flipbook_menu = menubar.addMenu("Flipbook")
flipbook_menu.addCommand("Publish to Flipbook", _publish, "F8")

# Also expose it on the node-graph context menu for quick access.
nuke.menu("Nodes").addCommand("Flipbook/Publish to Flipbook", _publish)
