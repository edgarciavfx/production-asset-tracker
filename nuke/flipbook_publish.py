"""Publish the current Nuke comp to Flipbook.

Stdlib-only so it runs in Nuke's bundled Python with zero pip installs. Snapshots
the current .nk (content-fingerprinted so identical scripts dedupe), reads the
selected Write node's output + frame range + project fps, and POSTs the payload
to the local Flipbook server.

Usage inside Nuke:
    import flipbook_publish
    flipbook_publish.publish()

Testing without Nuke (validates snapshot + POST against a running server):
    python flipbook_publish.py --fixture payload.json
"""

import datetime
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
import urllib.request

# Where the Flipbook server is listening. Override with FLIPBOOK_URL.
BASE_URL = os.environ.get("FLIPBOOK_URL", "http://127.0.0.1:3000")

# Where snapshotted .nk scripts are archived. Override with FLIPBOOK_SNAPSHOTS.
SNAPSHOTS_DIR = os.environ.get(
    "FLIPBOOK_SNAPSHOTS",
    os.path.join(os.path.expanduser("~"), ".flipbook", "snapshots"),
)


def snapshot_script(src_nk, snapshots_dir=SNAPSHOTS_DIR):
    """Copy src_nk into snapshots_dir under a content-fingerprinted name.

    Returns the absolute path of the snapshot. Identical scripts map to the same
    file, so re-publishing an unchanged comp doesn't pile up duplicates.
    """
    with open(src_nk, "rb") as fh:
        digest = hashlib.sha1(fh.read()).hexdigest()[:12]
    os.makedirs(snapshots_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(src_nk))[0]
    dest = os.path.join(snapshots_dir, "{0}_{1}.nk".format(base, digest))
    if not os.path.exists(dest):
        shutil.copy2(src_nk, dest)
    return dest


def _hashes_to_printf(path):
    """Convert a Nuke-style frame token (comp.####.exr) to printf (comp.%04d.exr)."""
    match = re.search(r"(#+)", path)
    if match:
        width = len(match.group(1))
        return path[: match.start()] + "%0{0}d".format(width) + path[match.end():]
    # Already printf-style, or a single frame.
    return path


def _detect_source_type(path):
    return "mov" if path.lower().endswith(".mov") else "seq"


def post_publish(payload, base_url=BASE_URL):
    """POST a publish payload to Flipbook. Returns the decoded JSON response."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        base_url.rstrip("/") + "/api/publish",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build_payload(write_node=None):
    """Read the current Nuke session into a publish payload."""
    import nuke  # imported lazily so the module also loads outside Nuke

    root = nuke.root()

    if write_node is None:
        selected = [n for n in nuke.selectedNodes() if n.Class() == "Write"]
        writes = selected or [n for n in nuke.allNodes("Write")]
        if not writes:
            raise RuntimeError("No Write node found to publish.")
        write_node = writes[0]

    raw_path = nuke.filename(write_node) or write_node["file"].value()
    if not raw_path:
        raise RuntimeError("Write node has no output path set.")
    source_path = _hashes_to_printf(nuke.filenameFilter(raw_path))
    source_type = _detect_source_type(source_path)

    first = int(root.firstFrame())
    last = int(root.lastFrame())
    fps = float(root["fps"].value()) if "fps" in root.knobs() else 24.0

    # Snapshot the current script (save first so unsaved edits are captured).
    script_path = root.name()
    if not script_path or script_path == "Root":
        script_path = os.path.join(tempfile.gettempdir(), "flipbook_untitled.nk")
    nuke.scriptSave(script_path)
    snapshot = snapshot_script(script_path)

    # Project/shot come from env overrides if set, else sensible defaults:
    # project falls back to the script's parent folder, shot to the .nk name.
    project = os.environ.get("FLIPBOOK_PROJECT") or os.path.basename(
        os.path.dirname(script_path)
    ) or "Nuke"
    shot = os.environ.get("FLIPBOOK_SHOT") or os.path.splitext(
        os.path.basename(script_path)
    )[0]

    return {
        "project": project,
        "shot": shot,
        "label": write_node.name(),
        "sourceType": source_type,
        "sourcePath": source_path,
        "frameStart": first,
        "frameEnd": last,
        "fps": fps,
        "nukeScriptPath": snapshot,
        "renderedAt": datetime.datetime.utcnow().isoformat() + "Z",
    }


def publish(write_node=None):
    """Full publish flow, called from the Nuke menu."""
    import nuke

    try:
        payload = build_payload(write_node)
        result = post_publish(payload)
        msg = "Published {0} to Flipbook.\n{1}".format(
            result.get("version", "?"), result.get("reviewUrl", "")
        )
        nuke.message(msg)
        return result
    except Exception as exc:  # noqa: BLE001 - surface any failure to the artist
        nuke.message("Flipbook publish failed:\n{0}".format(exc))
        raise


def _main(argv):
    """CLI entry point for testing the snapshot + POST path without Nuke."""
    if "--fixture" not in argv:
        print(__doc__)
        return 1
    fixture = argv[argv.index("--fixture") + 1]
    with open(fixture) as fh:
        payload = json.load(fh)
    # If the fixture points at a real .nk, snapshot it so we exercise that path.
    nk = payload.get("nukeScriptPath")
    if nk and os.path.exists(nk):
        payload["nukeScriptPath"] = snapshot_script(nk)
        print("Snapshotted script -> {0}".format(payload["nukeScriptPath"]))
    result = post_publish(payload)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv))
