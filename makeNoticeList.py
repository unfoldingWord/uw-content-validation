#!/usr/bin/env python3

import os
import datetime


noticeList = []

for root, dirs, files in os.walk('.'):
    for name in files:
        if '/dist/' not in root \
        and name.endswith('.js') or name.endswith('.ts'):
            # print("file", name, os.path.join(root, name))
            with open(os.path.join(root, name), 'rt') as sourceFile:
                for n, line in enumerate(sourceFile, start=1):
                    if 'addNotice' in line and 'function addNotice' not in line \
                    and 'console.log' not in line and 'console.assert' not in line \
                    and 'noticeEntry' not in line \
                    and 'grammarCheckResult.error' not in line \
                    and '...' not in line:
                        strippedLine = line.strip()
                        # print("\n", os.path.join(root, name), strippedLine)
                        if strippedLine.endswith(');'): strippedLine = strippedLine[:-2]
                        if not strippedLine.startswith('//'):
                            cleanedLine = strippedLine.replace('addNoticePartial','') \
                                                .replace('addNotice6to7','') \
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
                            noticeList.append(f"{adjustedLine}\tfrom {name} line {n:,}")
    # for name in dirs:
    #     print("dir", name, os.path.join(root, name))


def makeKey(noticeLine):
    # Gives proper sorting of 2-3 digit priority numbers
    index = 0
    string = ''
    while noticeLine[index].isdigit():
        string += noticeLine[index]
        index += 1
    if string: return int(string)
    return 99999 # Return a big number for lines not starting with digits


filename = 'noticeList.txt'
with open(filename, 'wt') as outputFile:
    print(f"\nGot {len(noticeList)} notices:")
    outputFile.write(f"Last updated {datetime.datetime.now()} by makeNoticeList.py\n")
    outputFile.write(f"Got {len(noticeList)} notices:\n")
    for notice in sorted(noticeList, reverse=True, key=makeKey):
        print(f"  {notice}")
        outputFile.write(f"  {notice}\n")
print(f"Wrote {len(noticeList)} sorted notices to {filename}.")
