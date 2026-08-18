from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
MAIN_PAGES = {
    "index.html",
    "services.html",
    "cases.html",
    "pricing.html",
    "approach.html",
    "contacts.html",
    "privacy.html",
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hrefs: list[str] = []
        self.sources: list[str] = []
        self.ids: list[str] = []
        self.h1_count = 0
        self.title_count = 0
        self.has_viewport = False
        self.has_description = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if tag == "a" and values.get("href"):
            self.hrefs.append(values["href"] or "")
        if tag in {"script", "img"} and values.get("src"):
            self.sources.append(values["src"] or "")
        if tag == "link" and values.get("href"):
            self.sources.append(values["href"] or "")
        if tag == "h1":
            self.h1_count += 1
        if tag == "title":
            self.title_count += 1
        if tag == "meta" and values.get("name") == "viewport":
            self.has_viewport = True
        if tag == "meta" and values.get("name") == "description" and values.get("content"):
            self.has_description = True


def local_target(source: str, current: Path) -> Path | None:
    if not source or source.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    parsed = urlsplit(source)
    if parsed.scheme or parsed.netloc:
        return None
    clean_path = unquote(parsed.path)
    if not clean_path:
        return None
    return (current.parent / clean_path).resolve()


def main() -> int:
    errors: list[str] = []
    pages = sorted(ROOT.glob("*.html"))
    found_main = {page.name for page in pages if page.name in MAIN_PAGES}
    missing_pages = MAIN_PAGES - found_main
    if missing_pages:
        errors.append(f"Missing pages: {', '.join(sorted(missing_pages))}")

    for page in pages:
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))

        if page.name in MAIN_PAGES and parser.h1_count != 1:
            errors.append(f"{page.name}: expected 1 h1, found {parser.h1_count}")
        if parser.title_count != 1:
            errors.append(f"{page.name}: expected 1 title, found {parser.title_count}")
        if not parser.has_viewport:
            errors.append(f"{page.name}: missing viewport meta")
        if page.name in MAIN_PAGES and not parser.has_description:
            errors.append(f"{page.name}: missing description meta")

        duplicate_ids = sorted({value for value in parser.ids if parser.ids.count(value) > 1})
        if duplicate_ids:
            errors.append(f"{page.name}: duplicate ids: {', '.join(duplicate_ids)}")

        for source in parser.hrefs + parser.sources:
            target = local_target(source, page)
            if target is not None and not target.exists():
                errors.append(f"{page.name}: broken local reference: {source}")

    css = ROOT / "assets" / "styles.css"
    javascript = ROOT / "assets" / "app.js"
    if not css.exists() or css.stat().st_size < 10_000:
        errors.append("assets/styles.css is missing or unexpectedly small")
    if not javascript.exists() or javascript.stat().st_size < 3_000:
        errors.append("assets/app.js is missing or unexpectedly small")

    if errors:
        print("SITE_CHECK=FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("SITE_CHECK=PASS")
    print(f"HTML_PAGES={len(pages)}")
    print(f"MAIN_PAGES={len(found_main)}")
    print("BROKEN_LOCAL_REFERENCES=0")
    print("DUPLICATE_IDS=0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
