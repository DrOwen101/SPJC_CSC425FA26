"""Capture real local HTTP responses in Chromium and save reviewable evidence.

Requires Python 3.9+, Playwright, Google Chrome, Node.js, and installed server deps.
Run from any directory: python server/scripts/capture_attendance.py
"""

import argparse
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import subprocess

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", type=Path, default=ROOT / "server/evidence/attendance")
args = parser.parse_args()
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=True)


def git(*arguments):
    return subprocess.check_output(["git", *arguments], cwd=ROOT, text=True).strip()


runtime_paths = ["server/src", "server/package.json", "server/package-lock.json"]
if git("status", "--porcelain", "--", *runtime_paths):
    raise SystemExit("Commit the server runtime first so evidence identifies the tested version.")

source_commit = git("rev-parse", "HEAD")
branch = git("branch", "--show-current")
files = git("ls-files", "--", *runtime_paths).splitlines()
source_hashes = {
    name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
    for name in files
}
metadata = {
    "repository": "https://github.com/DrOwen101/SPJC_CSC425FA26",
    "branch": branch,
    "sourceCommit": source_commit,
    "capturedAtUTC": datetime.now(timezone.utc).isoformat(),
    "scope": "Local Express app, fictional fixtures, actual browser fetch; no deployment or PostgreSQL claim.",
    "sourceSHA256": source_hashes,
}

# A fresh process imports this checkout and listens on an available loopback port.
# It cannot accidentally hit an older application already running on port 3000.
server = subprocess.Popen(
    ["node", "--input-type=module", "-e",
     "import { app } from './server/src/app.js'; "
     "const server = app.listen(0, '127.0.0.1', () => "
     "console.log(JSON.stringify({ port: server.address().port })));"],
    cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
)

cases = [
    ("01-routes", "GET", "/", 200),
    ("02-status", "GET", "/api/status", 200),
    ("03-all-attendance", "GET", "/api/attendance", 200),
    *[(f"{index + 4:02}-student-{student_id}", "GET", f"/api/attendance/{student_id}", 200)
      for index, student_id in enumerate(["1001", "1002", "1003", "1004", "1005"])],
    ("09-present", "GET", "/api/attendance/1001/2026-10-12", 200),
    ("10-late", "GET", "/api/attendance/1001/2026-10-14", 200),
    ("11-absent", "GET", "/api/attendance/1001/2026-10-16", 200),
    ("12-missing-record", "GET", "/api/attendance/1001/2026-10-19", 404),
    ("13-unknown-student", "GET", "/api/attendance/9999", 404),
    ("14-invalid-id", "GET", "/api/attendance/abc", 400),
    ("15-invalid-date", "GET", "/api/attendance/1001/2026-02-30", 400),
    ("16-read-only", "POST", "/api/attendance/1001/2026-10-12", 405),
    ("17-no-records", "GET", "/api/attendance/1005/2026-10-12", 404),
    ("18-unknown-route", "GET", "/api/attendance/1001/2026-10-12/extra", 404),
]

style = """
body { margin: 0; padding: 36px; color: #172331; background: #eef2f6;
       font: 16px/1.5 system-ui, sans-serif; }
main { max-width: 1120px; margin: auto; }
h1 { margin: 0 0 16px; font-size: 26px; }
h2 { font-size: 20px; overflow-wrap: anywhere; }
.meta { color: #33485c; overflow-wrap: anywhere; }
article { background: white; border: 1px solid #b7c5d3; border-radius: 10px;
          padding: 24px; margin: 24px 0; break-inside: avoid; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; font: 16px/1.5 monospace;
      background: #f4f6f8; padding: 16px; }
.status { font-weight: 700; color: #153f68; }
"""


def document(content):
    return (
        '<!doctype html><html lang="en"><meta charset="utf-8">'
        '<title>Attendance API evidence</title><style>' + style + '</style><main>'
        '<h1>Attendance API · captured HTTP evidence</h1>'
        '<div class="meta">'
        f'Repository: {html.escape(metadata["repository"])}<br>'
        f'Branch: {html.escape(branch)}<br>'
        f'Tested source commit: {source_commit}<br>'
        f'Captured (UTC): {metadata["capturedAtUTC"]}<br>'
        'Actual browser fetch responses from a fresh local server. '
        'This page formats captured evidence; it is not an application screen.'
        '</div>' + content + '</main></html>'
    )


try:
    ready = server.stdout.readline()
    if not ready:
        raise RuntimeError("Server did not start: " + server.stderr.read())
    base_url = f'http://127.0.0.1:{json.loads(ready)["port"]}'
    metadata["baseURL"] = base_url
    results = []
    articles = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        try:
            request_page = browser.new_page()
            request_page.goto(base_url, wait_until="networkidle")
            view = browser.new_page(viewport={"width": 1280, "height": 1000}, device_scale_factor=1)
            for name, method, path, expected_status in cases:
                captured = request_page.evaluate(
                    """async ({path, method}) => {
                      const response = await fetch(path, { method, cache: 'no-store' });
                      return {
                        url: response.url, method, status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        rawBody: await response.text()
                      };
                    }""", {"path": path, "method": method},
                )
                assert captured["status"] == expected_status, captured
                assert "application/json" in captured["headers"]["content-type"], captured
                body = json.loads(captured["rawBody"])
                if name == "03-all-attendance":
                    assert body["count"] == len(body["records"]) == 12
                if name == "04-student-1001":
                    assert body["summary"]["attendancePercentage"] == 66.67
                if name == "08-student-1005":
                    assert body["records"] == [] and body["summary"]["attendancePercentage"] is None
                if name in ["12-missing-record", "17-no-records"]:
                    assert body["error"] == "ATTENDANCE_NOT_FOUND"
                captured["name"] = name
                captured["screenshot"] = f"{name}.png"
                results.append(captured)
                article = (
                    f'<article><h2>{html.escape(method + " " + captured["url"])}</h2>'
                    f'<p class="status">HTTP {captured["status"]} {html.escape(captured["statusText"])}</p>'
                    f'<p>Content-Type: {html.escape(captured["headers"]["content-type"])}</p>'
                    '<pre>' + html.escape(json.dumps(body, indent=2)) + '</pre></article>'
                )
                articles.append(article)
                view.set_content(document(article))
                view.screenshot(path=str(output / f"{name}.png"), full_page=True)
            # A missing lookup and a rejected write must not change any data.
            after = request_page.evaluate("async () => (await fetch('/api/attendance')).json()")
            initial = json.loads(next(result["rawBody"] for result in results if result["name"] == "03-all-attendance"))
            assert after == initial
            assert all(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest
                       for name, digest in source_hashes.items())
            metadata["browser"] = browser.version
            metadata["verifiedResponses"] = len(results)
            (output / "responses.json").write_text(json.dumps({"metadata": metadata, "responses": results}, indent=2) + "\n")
            (output / "index.html").write_text(document("".join(articles)))
        finally:
            browser.close()
finally:
    server.terminate()
    try:
        server.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server.kill()
        server.wait()

print(f"Captured {len(results)} verified responses and screenshots in {output}")
print(f"Branch: {branch}\nTested source commit: {source_commit}")
