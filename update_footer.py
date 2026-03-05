import os
import glob

html_files = glob.glob('*.html')

search_str = """            <div class="footer-left">
                <div class="footer-brand">
                    <img src="logo.png" alt="BlockerMax Logo" class="footer-logo-img">
                    <div class="footer-tagline-wrapper">
                        <h3 class="footer-tagline">Walking to light together</h3>
                    </div>
                </div>
            </div>"""

replace_str = """            <div class="footer-left">
                <div class="footer-brand">
                    <img src="logo.png" alt="BlockerMax Logo" class="footer-logo-img">
                    <div class="footer-tagline-wrapper">
                        <h3 class="footer-tagline">Walking to light together</h3>
                    </div>
                </div>
                <div class="footer-store-buttons">
                    <a href="https://apps.apple.com/us/app/porn-blocker-blocker-max/id6756876676" class="footer-store-btn">
                        <img src="Appstore2.svg" alt="Download on App Store">
                    </a>
                    <a href="https://play.google.com/store/apps/details?id=com.nane.blocker" class="footer-store-btn">
                        <img src="Googleplay2.svg" alt="Get it on Google Play">
                    </a>
                </div>
            </div>"""

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if search_str in content:
        new_content = content.replace(search_str, replace_str)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated {f}")
    else:
        print(f"Skipped {f} (pattern not found)")
