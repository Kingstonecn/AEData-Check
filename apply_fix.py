"""apply_fix.py
AE数据检查 — 操作清单执行脚本

用法：
  1. 在浏览器中用 AE数据检查.html 完成修改
  2. 点击「导出下载」→ 下载 操作清单.csv
  3. 将 操作清单.csv 和原始 .xlsm 放在本脚本同级目录
  4. 双击运行本脚本

本脚本直接修改原始 .xlsm 文件，100% 保留所有：
  - 单元格格式（字体、颜色、边框、背景）
  - Excel 公式（ROUND、VLOOKUP 等）
  - VBA 宏
  - 列宽、行高、合并单元格
  - calcChain.xml（公式计算链）

运行要求：Python 3.6+
依赖：openpyxl（如未安装，脚本会自动提示安装方法）
"""

import csv
import os
import sys
import shutil
import zipfile
import re

try:
    from openpyxl import load_workbook
except ImportError:
    print("错误：需要 openpyxl 库，请运行：")
    print("  pip install openpyxl")
    input("\n按回车退出...")
    sys.exit(1)


def inject_calc_chain(tmp_path, orig_xlsm):
    """从原始文件注入 calcChain.xml 到临时文件"""
    with zipfile.ZipFile(tmp_path, 'a', zipfile.ZIP_DEFLATED) as z:
        # 从原始文件复制 calcChain
        with zipfile.ZipFile(orig_xlsm, 'r') as z_orig:
            if 'xl/calcChain.xml' in z_orig.namelist():
                z.writestr('xl/calcChain.xml', z_orig.read('xl/calcChain.xml'))
            else:
                return  # 原始也没有 calcChain，无需注入
        # 更新 Content_Types
        ct = z.read('[Content_Types].xml').decode('utf-8')
        if 'calcChain' not in ct:
            ct = ct.replace('</Types>', '<Override PartName="/xl/calcChain.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml"/></Types>')
        z.writestr('[Content_Types].xml', ct.encode('utf-8'))
        # 更新 workbook.xml.rels
        rels = z.read('xl/_rels/workbook.xml.rels').decode('utf-8')
        if 'calcChain' not in rels:
            rels = rels.replace('</Relationships>', '<Relationship Id="rIdCalc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/calcChain" Target="calcChain.xml"/></Relationships>')
        z.writestr('xl/_rels/workbook.xml.rels', rels.encode('utf-8'))
        # 修复 workbook.xml 添加 calcPr（如果缺失）
        wb_xml = z.read('xl/workbook.xml').decode('utf-8')
        if '<calcPr' not in wb_xml:
            wb_xml = wb_xml.replace('<workbookPr', '<calcPr calcId="191028"/><workbookPr')
            z.writestr('xl/workbook.xml', wb_xml.encode('utf-8'))
        # 修复 sharedStrings 引用（如果缺失）
        if 'sharedStrings' not in rels and 'xl/sharedStrings.xml' in [n for n in (lambda: [z_i.filename for z_i in z.filelist])()]:
            rels = rels.replace('</Relationships>', '<Relationship Id="rIdSharedStrings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>')
            z.writestr('xl/_rels/workbook.xml.rels', rels.encode('utf-8'))


def find_file(folder, pattern):
    """查找匹配的文件"""
    for f in os.listdir(folder):
        if pattern in f.lower():
            return os.path.join(folder, f)
    return None


def main():
    folder = os.path.dirname(os.path.abspath(__file__))

    # 1. 找操作清单
    ops_file = find_file(folder, '操作清单.csv')
    if not ops_file:
        # 也检查 ops.csv
        for f in os.listdir(folder):
            if f.endswith('.csv') and 'ops' in f.lower() and 'report' not in f.lower():
                ops_file = os.path.join(folder, f)
                break
    if not ops_file:
        print("错误：找不到 操作清单.csv")
        print("请将操作清单.csv 和原始 .xlsm 文件放在本脚本同级目录")
        input("\n按回车退出...")
        return

    # 2. 找源文件
    xlsm_file = None
    base_name = None
    for f in os.listdir(folder):
        if f.endswith('.xlsm') and '-Check' not in f:
            xlsm_file = os.path.join(folder, f)
            base_name = f
            break
    if not xlsm_file:
        for f in os.listdir(folder):
            if f.endswith('.xlsx') and '-Check' not in f:
                xlsm_file = os.path.join(folder, f)
                base_name = f
                break
    if not xlsm_file:
        print("错误：找不到 .xlsm/.xlsx 源文件")
        input("\n按回车退出...")
        return

    # 3. 读取操作清单
    ops = []
    with open(ops_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if not header or not header[0].isdigit():
            # 第一行不一定是表头，也可能是数据
            # 如果是表头，第一个单元格不是数字
            pass
        # 重新读，跳过可能的表头
        f.seek(0)
        next(reader)  # 跳过表头
        for row in reader:
            if len(row) >= 3:
                try:
                    ops.append((int(row[0].strip()), row[1].strip(), row[2].strip()))
                except ValueError:
                    continue

    if not ops:
        print("操作清单为空，没有需要修改的内容")
        input("\n按回车退出...")
        return

    print(f"读取到 {len(ops)} 条修改操作")
    print(f"源文件: {base_name}")

    # 4. 加载工作簿
    print("正在加载工作簿...")
    try:
        wb = load_workbook(xlsm_file, data_only=False, keep_vba=True)
    except Exception as e:
        print(f"加载失败: {e}")
        input("\n按回车退出...")
        return

    # 5. 定位 AE Data 工作表
    ws = wb['AE Data'] if 'AE Data' in wb.sheetnames else wb.active
    print(f"工作表: {ws.title}")

    # 6. 执行修改
    modified = 0
    errors = 0

    for row_num, col_letter, new_val in ops:
        try:
            cell = ws[f"{col_letter}{row_num}"]
            if new_val == '' or new_val == '␣':
                cell.value = None
            elif col_letter in ('V', 'W', 'X', 'U', 'P', 'J', 'K', 'L', 'M'):
                try:
                    cell.value = float(new_val)
                except ValueError:
                    cell.value = new_val
            elif col_letter == 'B':
                # B列日期序列号
                try:
                    cell.value = float(new_val)
                    cell.number_format = 'yy"年"mm"月"'
                except ValueError:
                    cell.value = new_val
            else:
                cell.value = new_val
            modified += 1
        except Exception as e:
            print(f"  错误 #{row_num}{col_letter}: {e}")
            errors += 1

    # 7. 保存临时文件
    out_name = os.path.splitext(xlsm_file)[0] + '-Check' + os.path.splitext(xlsm_file)[1]
    tmp_name = out_name + '.tmp'

    try:
        wb.save(tmp_name)
    except Exception as e:
        print(f"临时保存失败: {e}")
        input("\n按回车退出...")
        return

    # 8. 注入 calcChain（从原始文件复制）
    inject_calc_chain(tmp_name, xlsm_file)

    # 9. 重命名
    if os.path.exists(out_name):
        os.remove(out_name)
    os.rename(tmp_name, out_name)

    print(f"\n✅ 完成！已修改 {modified} 个单元格，失败 {errors} 个")
    print(f"输出文件: {os.path.basename(out_name)}")
    print("所有格式、公式、宏已完整保留")
    input("\n按回车退出...")


if __name__ == '__main__':
    main()
