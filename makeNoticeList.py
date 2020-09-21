#!/usr/bin/env python3

import os

noticeList = []

for root, dirs, files in os.walk('.'):
    for name in files:
        if '/dist/' not in root \
        and name.endswith('.js') or name.endswith('.ts'):
            # print("file", name, os.path.join(root, name))
            with open(os.path.join(root, name), 'rt') as sourceFile:
                for line in sourceFile:
                    if 'addNotice' in line and 'function addNotice' not in line \
                    and 'console.assert' not in line and 'noticeEntry.priority' not in line \
                    and 'grammarCheckResult.error' not in line \
                    and '...' not in line:
                        strippedLine = line.strip()
                        # print("\n", os.path.join(root, name), strippedLine)
                        if strippedLine.endswith(');'): strippedLine = strippedLine[:-2]
                        if not strippedLine.startswith('//'):
                            cleanedLine = strippedLine.replace('addNoticePartial','') \
                                                .replace('addNotice6to9','').replace('addNotice6to7','') \
                                                .replace('addNotice5','').replace('addNotice6','').replace('addNotice8','').replace('addNotice9','') \
                                                .replace('addNoticeCV8','').replace('addNotice10','') \
                                                .replace('addNotice','')
                            if cleanedLine.startswith('('): cleanedLine = cleanedLine[1:]
                            cleanedLine = cleanedLine.replace('{','').replace('}','')
                            adjustedLine = cleanedLine.replace(', ourAtString','').replace(', atString','') \
                                                .replace(', ourLocation','').replace(', ourRowLocation','') \
                                                .replace('${ourRowLocation}','') \
                                                .replace('priority:','').replace('message:','')
                            adjustedLine = adjustedLine.strip().replace('  ',' ')
                            print("adjustedLine", adjustedLine)
                            if not adjustedLine: halt
                            noticeList.append(adjustedLine)
    # for name in dirs:
    #     print("dir", name, os.path.join(root, name))

print(f"\nGot {len(noticeList)} notices:")
for notice in sorted(noticeList, reverse=True):
    print(f"  {notice}")