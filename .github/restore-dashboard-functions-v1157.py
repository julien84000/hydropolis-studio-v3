from pathlib import Path
import subprocess,re

branch_path=Path("public/app.js")
branch=branch_path.read_text(encoding="utf-8")
main=subprocess.check_output(["git","show","origin/main:public/app.js"],text=True,encoding="utf-8")

restore=[
"renderBrandRail","syncBrandRail","renderV11Overview","updateNetworkStatus","availabilityInfo",
"productFromCompareKey","productFromCatalogSources","dashboardProductImage","findDashboardProduct",
"renderDashboardEcosystem","favoriteProductRows","renderFavoritesView","renderCompareView",
"openDashboardSearch","renderCompareDock","toggleCompare","openCompareModal","similarityWords",
"smartAlternativesFor","showSuggestionsForKey","currentSearchSignature","scheduleServerSearch",
"requestServerSearch","registerOfflineSupport","updateCatalogSidebar"
]

def extract_function(src,name):
    token="function "+name+"("
    start=src.find(token)
    if start<0:
        raise SystemExit(f"{name} missing in main")
    # These are top-level declarations in the V11.56.1 source; the next top-level
    # function declaration is the exact end boundary needed for restoration.
    nxt=src.find("\nfunction ",start+len(token))
    if nxt<0:
        raise SystemExit(f"next function boundary missing after {name}")
    return src[start:nxt]+"\n"

missing=[name for name in restore if ("function "+name+"(") not in branch]
if missing:
    marker="function initFilters(){"
    pos=branch.find(marker)
    if pos<0:
        raise SystemExit("initFilters marker missing in branch")
    payload="\n".join(extract_function(main,name) for name in missing)+"\n"
    branch=branch[:pos]+payload+branch[pos:]

# Moodboard remains intentionally outside the V11.57 scope.
for name in restore:
    if ("function "+name+"(") not in branch:
        raise SystemExit(f"failed to restore {name}")

branch_path.write_text(branch,encoding="utf-8")

test=Path("tests/v11.57-regression.test.js")
ts=test.read_text(encoding="utf-8")
if "Core dashboard/catalogue helpers remain present after V11.57 refactor" not in ts:
    checks="|".join(restore)
    ts += f"""

test('Core dashboard/catalogue helpers remain present after V11.57 refactor',()=>{{
  for(const name of {restore!r}){{
    assert.match(appSource,new RegExp('function\\\\s+'+name+'\\\\s*\\\\('),name+' must remain defined');
  }}
}});
"""
test.write_text(ts,encoding="utf-8")
