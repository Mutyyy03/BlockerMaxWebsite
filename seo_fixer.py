import os
import glob
from datetime import datetime

html_files = glob.glob('*.html')
date_today = "2026-04-26"

sitemap_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">"""

for file_name in html_files:
    # 1. Canonical injection
    with open(file_name, 'r', encoding='utf-8') as f:
        content = f.read()

    canonical_str = f'<link rel="canonical" href="https://blockermax.com/{file_name if file_name != "index.html" else ""}" />'
    
    if '<link rel="canonical"' not in content and '<head>' in content:
        # Find where to inject (right after <head> is easiest)
        content = content.replace('<head>', f'<head>\n    {canonical_str}')
        with open(file_name, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added canonical to {file_name}")

    # 2. Sitemap generation
    url_loc = f"https://blockermax.com/{file_name if file_name != 'index.html' else ''}"
    
    # priority logic
    if file_name == 'index.html':
        priority = "1.0"
    elif file_name in ['download.html', 'landing.html', 'getapp.html']:
        priority = "0.9"
    elif file_name == 'blog.html' or file_name == 'parental-blog.html':
        priority = "0.8"
    elif file_name.startswith('blog-post') or file_name.startswith('parental-blog-post') or "guide" in file_name or "story" in file_name or "app" in file_name:
        priority = "0.7"
    else:
        priority = "0.5"

    sitemap_xml += f"""
    <url>
        <loc>{url_loc}</loc>
        <lastmod>{date_today}</lastmod>
        <priority>{priority}</priority>
    </url>"""

sitemap_xml += "\n</urlset>"

with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write(sitemap_xml)
print("sitemap.xml updated successfully.")
