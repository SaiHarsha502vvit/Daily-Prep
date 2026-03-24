import os

files = [
    r"e:\Dev_World\04_Practice\Daily-Prep\15_React_Frontend\10_Custom_Hooks_Library.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\15_React_Frontend\09_React_Deep_Reasoning.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\15_React_Frontend\08_React_Performance.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\15_React_Frontend\06_React_Router.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\15_React_Frontend\05_React_TypeScript.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\15_React_Frontend\03_Hooks_Deep_Dive.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\15_React_Frontend\01_React_Fundamentals.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\19_Frontend_Integration\07_Web_Accessibility_A11y.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\19_Frontend_Integration\06_Web_Performance_CoreWebVitals.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\19_Frontend_Integration\04_Frontend_Mental_Models_UI.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\19_Frontend_Integration\03_Build_Tools_Ecosystem.md",
    r"e:\Dev_World\04_Practice\Daily-Prep\19_Frontend_Integration\02_Frontend_Debugging.md",
]

replacements = {
    '╔': '┌',
    '╗': '┐',
    '╚': '└',
    '╝': '┘',
    '═': '─',
    '║': '│',
    '╠': '├',
    '╣': '┤',
    '╦': '┬',
    '╩': '┴',
    '╬': '┼'
}

for fp in files:
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
            
        modified = False
        for k, v in replacements.items():
            if k in content:
                content = content.replace(k, v)
                modified = True
                
        if modified:
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {os.path.basename(fp)}")
    else:
        print(f"File not found: {fp}")
