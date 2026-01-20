import shutil
import subprocess
import sys
from pathlib import Path


def run(cmd):
    return (
        subprocess.run(
            cmd,
            cwd=Path.cwd(),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        ).returncode
        == 0
    )


if not shutil.which("git"):
    print("git not found; skip init")
    sys.exit(0)

if run(["git", "rev-parse", "--is-inside-work-tree"]):
    print("already in git repo; skip init")
    sys.exit(0)

subprocess.check_call(["git", "init"])
subprocess.check_call(["git", "add", "-A"])

name_ok = (
    subprocess.run(
        ["git", "config", "--get", "user.name"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    ).returncode
    == 0
)
email_ok = (
    subprocess.run(
        ["git", "config", "--get", "user.email"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    ).returncode
    == 0
)
if name_ok and email_ok:
    subprocess.check_call(["git", "commit", "-m", "chore: init"])
else:
    print("git user.name/email not set; skipping commit")
