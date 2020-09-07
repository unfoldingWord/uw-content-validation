#!/usr/bin/env python3

import os

noticeList = []

for root, dirs, files in os.walk('.'):
    for name in files:
        if name.endswith('.js') or name.endswith('.ts'):
            # print("file", name, os.path.join(root, name))
            with open(os.path.join(root, name), 'rt') as sourceFile:
                for line in sourceFile:
                    if 'addNotice' in line and 'function addNotice' not in line \
                    and 'console.assert' not in line and 'noticeEntry.priority' not in line:
                        strippedLine = line.strip()
                        if strippedLine.endswith(');'): strippedLine = strippedLine[:-2]
                        if not strippedLine.startswith('//'):
                            cleanedLine = strippedLine.replace('addNotice6to9','').replace('addNotice6to7','') \
                                                .replace('addNotice6','').replace('addNotice8','').replace('addNotice9','') \
                                                .replace('addNoticeCV8','').replace('addNotice10','')
                            if cleanedLine.startswith('('): cleanedLine = cleanedLine[1:]
                            adjustedLine = cleanedLine.replace(', ourAtString','').replace(', atString','') \
                                                .replace(', ourLocation','').replace(', ourRowLocation','') \
                                                .replace('${ourRowLocation}','') \
                                                .replace('{priority:','').replace('message:','')
                            noticeList.append(adjustedLine.strip())
    # for name in dirs:
    #     print("dir", name, os.path.join(root, name))

print(f"Got {len(noticeList)} notices:")
for notice in sorted(noticeList, reverse=True):
    print(f"  {notice}")