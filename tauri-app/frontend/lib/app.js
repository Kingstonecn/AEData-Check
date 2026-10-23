/* ===================================================================
   AE数据分析 — app.js v2.0
   纯前端、本地处理。保留公式，分组展示、批量处理、导出新簿+CSV。
   =================================================================== */
'use strict';
const APP_VERSION='1.0.1';
// Auto-generated style template for GAP file generation
// Contains correct styles.xml, theme1.xml, and style index mapping
var GAP_STYLE_MAP={"0": 0, "2": 0, "4": 2, "5": 2, "6": 9, "7": 36, "8": 33, "9": 35, "10": 31, "11": 31, "12": 37, "13": 38, "14": 39, "21": 1, "22": 2, "23": 4, "24": 5, "25": 12, "26": 9, "27": 4, "28": 5, "29": 2, "30": 19, "31": 19, "32": 21, "33": 22, "34": 21, "35": 1, "36": 27, "37": 28, "38": 29, "50": 1, "51": 4, "52": 42, "53": 35, "54": 0, "55": 45, "56": 46, "57": 46, "58": 48, "59": 49, "60": 50, "61": 51, "62": 52, "63": 52, "64": 48, "65": 55, "66": 56, "67": 6, "68": 6, "69": 6, "70": 1, "71": 6, "72": 6, "73": 6, "74": 24, "75": 1, "76": 34, "225": 1, "340": 1, "390": 1};
var GAP_COL_STYLE_MAP={"6":10,"35":26,"54":44};
var GAP_STYLES="<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n\n<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\" mc:Ignorable=\"x14ac x16r2 xr\" xmlns:x14ac=\"http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac\" xmlns:x16r2=\"http://schemas.microsoft.com/office/spreadsheetml/2015/02/main\" xmlns:xr=\"http://schemas.microsoft.com/office/spreadsheetml/2014/revision\"><numFmts count=\"4\"><numFmt numFmtId=\"164\" formatCode=\"dd\\.mm\\.yyyy\\ hh:mm\"/><numFmt numFmtId=\"165\" formatCode=\"[hh]:mm\"/><numFmt numFmtId=\"166\" formatCode=\"#,##0.000\"/><numFmt numFmtId=\"167\" formatCode=\"yyyy/m/d\\ h:mm:ss\"/></numFmts><fonts count=\"6\" x14ac:knownFonts=\"1\"><font><sz val=\"10\"/><color theme=\"1\"/><name val=\"Arial\"/><family val=\"2\"/></font><font><sz val=\"11\"/><color theme=\"1\"/><name val=\"Aptos Narrow\"/><family val=\"2\"/><scheme val=\"minor\"/></font><font><b/><sz val=\"8\"/><name val=\"Arial\"/><family val=\"2\"/></font><font><sz val=\"8\"/><name val=\"Arial\"/><family val=\"2\"/></font><font><sz val=\"10\"/><name val=\"Arial\"/><family val=\"2\"/></font><font><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font></fonts><fills count=\"7\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill><fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFFFFFCC\"/></patternFill></fill><fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFF9C658\" tint=\"-0.14999847407452621\"/><bgColor indexed=\"64\"/></patternFill></fill><fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFE78F8E\" tint=\"-0.14999847407452621\"/><bgColor indexed=\"64\"/></patternFill></fill><fill><patternFill patternType=\"solid\"><fgColor rgb=\"FF96C593\" tint=\"-0.14999847407452621\"/><bgColor indexed=\"64\"/></patternFill></fill><fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFDDEBF7\"/></patternFill></fill></fills><borders count=\"2\"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style=\"hair\"><color auto=\"1\"/></left><right style=\"hair\"><color auto=\"1\"/></right><top style=\"hair\"><color auto=\"1\"/></top><bottom style=\"hair\"><color auto=\"1\"/></bottom><diagonal/></border></borders><cellStyleXfs count=\"3\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/><xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\"/><xf numFmtId=\"0\" fontId=\"5\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs><cellXfs count=\"58\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/><xf numFmtId=\"0\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyFont=\"1\"/><xf numFmtId=\"0\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"3\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"4\" fontId=\"3\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"164\" fontId=\"3\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"3\" fillId=\"3\" borderId=\"0\" xfId=\"1\" applyFont=\"1\" applyFill=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"3\" fillId=\"4\" borderId=\"0\" xfId=\"1\" applyFont=\"1\" applyFill=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"3\" fillId=\"5\" borderId=\"0\" xfId=\"1\" applyFont=\"1\" applyFill=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyFont=\"1\" applyProtection=\"1\"><protection locked=\"0\"/></xf><xf numFmtId=\"0\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyFont=\"1\" applyProtection=\"1\"><protection locked=\"0\"/></xf><xf numFmtId=\"0\" fontId=\"3\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyFont=\"1\"/><xf numFmtId=\"49\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\"><alignment horizontal=\"left\" wrapText=\"1\"/></xf><xf numFmtId=\"4\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"164\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"2\" fillId=\"3\" borderId=\"0\" xfId=\"1\" applyFont=\"1\" applyFill=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"2\" fillId=\"4\" borderId=\"0\" xfId=\"1\" applyFont=\"1\" applyFill=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"2\" fillId=\"5\" borderId=\"0\" xfId=\"1\" applyFont=\"1\" applyFill=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"49\" fontId=\"4\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"49\" fontId=\"4\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"4\" fontId=\"4\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"22\" fontId=\"4\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"4\" fontId=\"4\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"0\" fontId=\"4\" fillId=\"2\" borderId=\"1\" xfId=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"0\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"1\" applyFont=\"1\"/><xf numFmtId=\"0\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyFont=\"1\"/><xf numFmtId=\"49\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"4\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\"/><xf numFmtId=\"22\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\"/><xf numFmtId=\"0\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"4\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"0\" fontId=\"4\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"164\" fontId=\"4\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"165\" fontId=\"4\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"4\" fontId=\"4\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"0\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyFont=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"164\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"165\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"4\" fontId=\"4\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"0\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyFont=\"1\"/><xf numFmtId=\"4\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"4\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyProtection=\"1\"><protection locked=\"0\"/></xf><xf numFmtId=\"4\" fontId=\"4\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\" applyProtection=\"1\"><alignment wrapText=\"1\"/><protection locked=\"0\"/></xf><xf numFmtId=\"0\" fontId=\"5\" fillId=\"0\" borderId=\"0\" xfId=\"2\"/><xf numFmtId=\"1\" fontId=\"5\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"49\" fontId=\"5\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"49\" fontId=\"5\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"166\" fontId=\"5\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"1\" fontId=\"5\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\"/><xf numFmtId=\"49\" fontId=\"5\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\"/><xf numFmtId=\"166\" fontId=\"5\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyNumberFormat=\"1\"/><xf numFmtId=\"0\" fontId=\"5\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"0\" fontId=\"5\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"166\" fontId=\"5\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"0\" fontId=\"5\" fillId=\"2\" borderId=\"1\" xfId=\"2\" applyFill=\"1\" applyBorder=\"1\"/><xf numFmtId=\"0\" fontId=\"5\" fillId=\"0\" borderId=\"0\" xfId=\"2\" applyAlignment=\"1\"><alignment wrapText=\"1\"/></xf><xf numFmtId=\"167\" fontId=\"4\" fillId=\"6\" borderId=\"1\" xfId=\"2\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\"/></cellXfs><cellStyles count=\"3\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/><cellStyle name=\"Normal 2\" xfId=\"1\" xr:uid=\"{AB88A397-1CE0-4571-8A90-C72EC8921B06}\"/><cellStyle name=\"Normal 2 2\" xfId=\"2\" xr:uid=\"{7C7A46E6-CFFC-4F0C-AB97-7C1D4D96A85F}\"/></cellStyles><dxfs count=\"9\"><dxf><fill><patternFill patternType=\"solid\"><bgColor rgb=\"FFFFC7CE\"/></patternFill></fill></dxf><dxf><fill><patternFill patternType=\"solid\"><bgColor rgb=\"FFDDEBF7\"/></patternFill></fill></dxf><dxf><fill><patternFill patternType=\"solid\"><bgColor rgb=\"FFFFC7CE\"/></patternFill></fill></dxf><dxf><fill><patternFill patternType=\"solid\"><bgColor rgb=\"FFDDEBF7\"/></patternFill></fill></dxf><dxf><fill><patternFill patternType=\"solid\"><bgColor rgb=\"FFDDEBF7\"/></patternFill></fill></dxf><dxf><fill><patternFill patternType=\"solid\"><bgColor rgb=\"FFFFC7CE\"/></patternFill></fill></dxf><dxf><fill><patternFill patternType=\"solid\"><bgColor rgb=\"FFFFC7CE\"/></patternFill></fill></dxf><dxf><fill><patternFill patternType=\"solid\"><bgColor rgb=\"FFFFC7CE\"/></patternFill></fill></dxf><dxf><fill><patternFill patternType=\"solid\"><bgColor rgb=\"FFFFC7CE\"/></patternFill></fill></dxf></dxfs><tableStyles count=\"0\" defaultTableStyle=\"TableStyleMedium2\" defaultPivotStyle=\"PivotStyleLight16\"/><extLst><ext uri=\"{EB79DEF2-80B8-43e5-95BD-54CBDDF9020C}\" xmlns:x14=\"http://schemas.microsoft.com/office/spreadsheetml/2009/9/main\"><x14:slicerStyles defaultSlicerStyle=\"SlicerStyleLight1\"/></ext><ext uri=\"{9260A510-F301-46a8-8635-F512D64BE5F5}\" xmlns:x15=\"http://schemas.microsoft.com/office/spreadsheetml/2010/11/main\"><x15:timelineStyles defaultTimelineStyle=\"TimeSlicerStyleLight1\"/></ext></extLst></styleSheet>";
var GAP_THEME="<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n\n<a:theme xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" name=\"Office Theme\"><a:themeElements><a:clrScheme name=\"Office\"><a:dk1><a:sysClr val=\"windowText\" lastClr=\"000000\"/></a:dk1><a:lt1><a:sysClr val=\"window\" lastClr=\"FFFFFF\"/></a:lt1><a:dk2><a:srgbClr val=\"0E2841\"/></a:dk2><a:lt2><a:srgbClr val=\"E8E8E8\"/></a:lt2><a:accent1><a:srgbClr val=\"156082\"/></a:accent1><a:accent2><a:srgbClr val=\"E97132\"/></a:accent2><a:accent3><a:srgbClr val=\"196B24\"/></a:accent3><a:accent4><a:srgbClr val=\"0F9ED5\"/></a:accent4><a:accent5><a:srgbClr val=\"A02B93\"/></a:accent5><a:accent6><a:srgbClr val=\"4EA72E\"/></a:accent6><a:hlink><a:srgbClr val=\"467886\"/></a:hlink><a:folHlink><a:srgbClr val=\"96607D\"/></a:folHlink></a:clrScheme><a:fontScheme name=\"Office\"><a:majorFont><a:latin typeface=\"Aptos Display\" panose=\"02110004020202020204\"/><a:ea typeface=\"\"/><a:cs typeface=\"\"/><a:font script=\"Jpan\" typeface=\"\u6e38\u30b4\u30b7\u30c3\u30af Light\"/><a:font script=\"Hang\" typeface=\"\ub9d1\uc740 \uace0\ub515\"/><a:font script=\"Hans\" typeface=\"\u7b49\u7ebf Light\"/><a:font script=\"Hant\" typeface=\"\u65b0\u7d30\u660e\u9ad4\"/><a:font script=\"Arab\" typeface=\"Times New Roman\"/><a:font script=\"Hebr\" typeface=\"Times New Roman\"/><a:font script=\"Thai\" typeface=\"Tahoma\"/><a:font script=\"Ethi\" typeface=\"Nyala\"/><a:font script=\"Beng\" typeface=\"Vrinda\"/><a:font script=\"Gujr\" typeface=\"Shruti\"/><a:font script=\"Khmr\" typeface=\"MoolBoran\"/><a:font script=\"Knda\" typeface=\"Tunga\"/><a:font script=\"Guru\" typeface=\"Raavi\"/><a:font script=\"Cans\" typeface=\"Euphemia\"/><a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/><a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/><a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/><a:font script=\"Thaa\" typeface=\"MV Boli\"/><a:font script=\"Deva\" typeface=\"Mangal\"/><a:font script=\"Telu\" typeface=\"Gautami\"/><a:font script=\"Taml\" typeface=\"Latha\"/><a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Orya\" typeface=\"Kalinga\"/><a:font script=\"Mlym\" typeface=\"Kartika\"/><a:font script=\"Laoo\" typeface=\"DokChampa\"/><a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/><a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/><a:font script=\"Viet\" typeface=\"Times New Roman\"/><a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/><a:font script=\"Geor\" typeface=\"Sylfaen\"/><a:font script=\"Armn\" typeface=\"Arial\"/><a:font script=\"Bugi\" typeface=\"Leelawadee UI\"/><a:font script=\"Bopo\" typeface=\"Microsoft JhengHei\"/><a:font script=\"Java\" typeface=\"Javanese Text\"/><a:font script=\"Lisu\" typeface=\"Segoe UI\"/><a:font script=\"Mymr\" typeface=\"Myanmar Text\"/><a:font script=\"Nkoo\" typeface=\"Ebrima\"/><a:font script=\"Olck\" typeface=\"Nirmala UI\"/><a:font script=\"Osma\" typeface=\"Ebrima\"/><a:font script=\"Phag\" typeface=\"Phagspa\"/><a:font script=\"Syrn\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Syrj\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Syre\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Sora\" typeface=\"Nirmala UI\"/><a:font script=\"Tale\" typeface=\"Microsoft Tai Le\"/><a:font script=\"Talu\" typeface=\"Microsoft New Tai Lue\"/><a:font script=\"Tfng\" typeface=\"Ebrima\"/></a:majorFont><a:minorFont><a:latin typeface=\"Aptos Narrow\" panose=\"02110004020202020204\"/><a:ea typeface=\"\"/><a:cs typeface=\"\"/><a:font script=\"Jpan\" typeface=\"\u6e38\u30b4\u30b7\u30c3\u30af\"/><a:font script=\"Hang\" typeface=\"\ub9d1\uc740 \uace0\ub515\"/><a:font script=\"Hans\" typeface=\"\u7b49\u7ebf\"/><a:font script=\"Hant\" typeface=\"\u65b0\u7d30\u660e\u9ad4\"/><a:font script=\"Arab\" typeface=\"Arial\"/><a:font script=\"Hebr\" typeface=\"Arial\"/><a:font script=\"Thai\" typeface=\"Tahoma\"/><a:font script=\"Ethi\" typeface=\"Nyala\"/><a:font script=\"Beng\" typeface=\"Vrinda\"/><a:font script=\"Gujr\" typeface=\"Shruti\"/><a:font script=\"Khmr\" typeface=\"DaunPenh\"/><a:font script=\"Knda\" typeface=\"Tunga\"/><a:font script=\"Guru\" typeface=\"Raavi\"/><a:font script=\"Cans\" typeface=\"Euphemia\"/><a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/><a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/><a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/><a:font script=\"Thaa\" typeface=\"MV Boli\"/><a:font script=\"Deva\" typeface=\"Mangal\"/><a:font script=\"Telu\" typeface=\"Gautami\"/><a:font script=\"Taml\" typeface=\"Latha\"/><a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Orya\" typeface=\"Kalinga\"/><a:font script=\"Mlym\" typeface=\"Kartika\"/><a:font script=\"Laoo\" typeface=\"DokChampa\"/><a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/><a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/><a:font script=\"Viet\" typeface=\"Arial\"/><a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/><a:font script=\"Geor\" typeface=\"Sylfaen\"/><a:font script=\"Armn\" typeface=\"Arial\"/><a:font script=\"Bugi\" typeface=\"Leelawadee UI\"/><a:font script=\"Bopo\" typeface=\"Microsoft JhengHei\"/><a:font script=\"Java\" typeface=\"Javanese Text\"/><a:font script=\"Lisu\" typeface=\"Segoe UI\"/><a:font script=\"Mymr\" typeface=\"Myanmar Text\"/><a:font script=\"Nkoo\" typeface=\"Ebrima\"/><a:font script=\"Olck\" typeface=\"Nirmala UI\"/><a:font script=\"Osma\" typeface=\"Ebrima\"/><a:font script=\"Phag\" typeface=\"Phagspa\"/><a:font script=\"Syrn\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Syrj\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Syre\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Sora\" typeface=\"Nirmala UI\"/><a:font script=\"Tale\" typeface=\"Microsoft Tai Le\"/><a:font script=\"Talu\" typeface=\"Microsoft New Tai Lue\"/><a:font script=\"Tfng\" typeface=\"Ebrima\"/></a:minorFont></a:fontScheme><a:fmtScheme name=\"Office\"><a:fillStyleLst><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:gradFill rotWithShape=\"1\"><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:lumMod val=\"110000\"/><a:satMod val=\"105000\"/><a:tint val=\"67000\"/></a:schemeClr></a:gs><a:gs pos=\"50000\"><a:schemeClr val=\"phClr\"><a:lumMod val=\"105000\"/><a:satMod val=\"103000\"/><a:tint val=\"73000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:lumMod val=\"105000\"/><a:satMod val=\"109000\"/><a:tint val=\"81000\"/></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"5400000\" scaled=\"0\"/></a:gradFill><a:gradFill rotWithShape=\"1\"><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:satMod val=\"103000\"/><a:lumMod val=\"102000\"/><a:tint val=\"94000\"/></a:schemeClr></a:gs><a:gs pos=\"50000\"><a:schemeClr val=\"phClr\"><a:satMod val=\"110000\"/><a:lumMod val=\"100000\"/><a:shade val=\"100000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:lumMod val=\"99000\"/><a:satMod val=\"120000\"/><a:shade val=\"78000\"/></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"5400000\" scaled=\"0\"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w=\"12700\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:prstDash val=\"solid\"/><a:miter lim=\"800000\"/></a:ln><a:ln w=\"19050\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:prstDash val=\"solid\"/><a:miter lim=\"800000\"/></a:ln><a:ln w=\"25400\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:prstDash val=\"solid\"/><a:miter lim=\"800000\"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad=\"57150\" dist=\"19050\" dir=\"5400000\" algn=\"ctr\" rotWithShape=\"0\"><a:srgbClr val=\"000000\"><a:alpha val=\"63000\"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:solidFill><a:schemeClr val=\"phClr\"><a:tint val=\"95000\"/><a:satMod val=\"170000\"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape=\"1\"><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"93000\"/><a:satMod val=\"150000\"/><a:shade val=\"98000\"/><a:lumMod val=\"102000\"/></a:schemeClr></a:gs><a:gs pos=\"50000\"><a:schemeClr val=\"phClr\"><a:tint val=\"98000\"/><a:satMod val=\"130000\"/><a:shade val=\"90000\"/><a:lumMod val=\"103000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:shade val=\"63000\"/><a:satMod val=\"120000\"/></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"5400000\" scaled=\"0\"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults><a:lnDef><a:spPr/><a:bodyPr/><a:lstStyle/><a:style><a:lnRef idx=\"2\"><a:schemeClr val=\"accent1\"/></a:lnRef><a:fillRef idx=\"0\"><a:schemeClr val=\"accent1\"/></a:fillRef><a:effectRef idx=\"1\"><a:schemeClr val=\"accent1\"/></a:effectRef><a:fontRef idx=\"minor\"><a:schemeClr val=\"tx1\"/></a:fontRef></a:style></a:lnDef></a:objectDefaults><a:extraClrSchemeLst/><a:extLst><a:ext uri=\"{05A4C25C-085E-4340-85A3-A5531E510DB2}\"><thm15:themeFamily xmlns:thm15=\"http://schemas.microsoft.com/office/thememl/2012/main\" name=\"Office Theme\" id=\"{2E142A2C-CD16-42D6-873A-C26D2A0506FA}\" vid=\"{1BDDFF52-6CD6-40A5-AB3C-68EB2F1E4D0A}\"/></a:ext></a:extLst></a:theme>";

let COLS=[
{L:'A',type:'skip'},{L:'B',type:'skip'},{L:'C',type:'skip'},{L:'D',type:'shift'},{L:'E',type:'text'},
{L:'F',type:'line'},{L:'G',type:'status'},{L:'H',type:'product'},{L:'I',type:'asset'},
{L:'J',type:'num'},{L:'K',type:'num'},{L:'L',type:'num'},{L:'M',type:'num'},{L:'N',type:'time'},{L:'O',type:'time'},
{L:'P',type:'formula',noEdit:true},{L:'Q',type:'text'},{L:'R',type:'text'},{L:'S',type:'text'},{L:'T',type:'text'},
{L:'U',type:'oae'},{L:'V',type:'num'},{L:'W',type:'num'},{L:'X',type:'num'},{L:'Y',type:'formula'},
{L:'Z',type:'formula'},{L:'AA',type:'individual'},{L:'AB',type:'residual'}];
const SHIFT_ENUM=['早班','白班','夜班','中班'];const STATUS_ENUM=['生产','停机','升温','进料'];const LINE_PATTERN=/^\d+#$/;
let SYNONYMS={status:{'开机':'生产','运行':'生产','计划':'停机','停/':'停机'},shift:{'日班':'白班','晚班':'夜班'}};
const FW=String.fromCharCode(0x3000);
const dirty=s=>/\s/.test(s)||s.includes(FW);
const clean=s=>s.replace(/[\s　]+/g,' ').replace(/^[\s　]+|[\s　]+$/g,'');
const vis=(s)=>String(s==null?'':s).replace(/ /g,'␣').replace(/　/g,'␣');
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function esc(v){if(v==null)return'␣';if(typeof v=='string')return v;if(v instanceof Date)return v.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});return String(v)}
function escAA(v){return v==null||v===''?'␣':String(v)}
function escXml(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function toast(m,p){const t=$('#toast');t.innerHTML='<span class="toast-msg">'+escXml(m)+'</span>';t.classList.remove('toast-result');t.classList.add('show');clearTimeout(toast._t);if(!p)toast._t=setTimeout(()=>t.classList.remove('show'),2400)}
function toastResult(m){const t=$('#toast');t.innerHTML='<span class="toast-msg">'+escXml(m)+'</span><button class="toast-btn toast-btn-close">完成</button>';t.classList.add('toast-result');t.classList.add('show');clearTimeout(toast._t);t.querySelector('.toast-btn-close').addEventListener('click',()=>{t.classList.remove('show');t.classList.remove('toast-result')})}
function yieldUI(){return new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)))}
async function downloadBlob(blob,filename){if(window.__TAURI__&&window.__TAURI__.core&&window.__TAURI__.core.invoke){const buf=new Uint8Array(await blob.arrayBuffer());try{const ok=await window.__TAURI__.core.invoke('save_file',{name:filename,data:Array.from(buf)});return ok===true;}catch(e){console.warn('Tauri save failed:',e);toast('保存失败：'+(e&&e.message?e.message:e));return false}}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},1000);return true}
async function _step(msg,fn){toast(msg);await yieldUI();const t0=performance.now();fn();const elapsed=performance.now()-t0;if(elapsed<200)await new Promise(r=>setTimeout(r,200-elapsed))}
function serialToDate(n){const wd=Math.floor(n),frac=n-wd;return new Date(1899,11,30+(n<60?wd+1:wd),0,0,0,Math.round(frac*86400000))}
const S={wb:null,ws:null,fileName:'资产数据(GAP).xlsx',srcExt:'xlsx',dataStart:3,maxRow:0,catMap:{},origBuf:null,
  dict:{product:new Set(),asset:new Map(),individual:new Set(),workshops:new Set(),mergedF:new Set(),mergedA:new Set(),mergedMap:{}},
  shiftHours:new Map(),issues:[],curCol:null,filterYear:null,filterMonth:null};
function groupKey(i){if(i.demo)return i.col+'\x00'+i.type+'\x00*';return i.col+'\x00'+i.type+'\x00'+(i.suggest==null?'∅':String(i.suggest).slice(0,60))}
function initLoad(){const dz=$('#dropzone'),fi=$('#fileInput');
  $('#pickBtn').addEventListener('click',e=>{e.stopPropagation();fi.click()});dz.addEventListener('click',()=>fi.click());
  fi.addEventListener('change',()=>{if(fi.files[0])handleFile(fi.files[0])});
  ['dragover','dragenter'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag')}));
  ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag')}));
  dz.addEventListener('drop',e=>{if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0])});
  $('#todayStamp').textContent='版本：v'+APP_VERSION}
async function handleFile(file){try{
  toast('正在解析 '+file.name+'…');await yieldUI();const t0=performance.now();
  const buf=await file.arrayBuffer();S.origBuf=buf.slice(0);const wb=XLSX.read(buf,{type:'array',cellFormula:true,cellNF:true});
  const parseElapsed=performance.now()-t0;if(parseElapsed<200)await new Promise(r=>setTimeout(r,200-parseElapsed));
  if(!wb.SheetNames.includes('AE Data')){toast('未找到 AE Data 工作表');return}
  S.wb=wb;S.ws=wb.Sheets['AE Data'];S.fileName=file.name;S.srcExt=/\.xlsm$/i.test(file.name)?'xlsm':(/\.xlsx$/i.test(file.name)?'xlsx':'xls');
  await _step('正在读取表头…',readHeaders);
  await _step('正在构建字典…',buildDicts);
  await _step('正在检测合并单元格…',()=>{detectMergedCells();detectShiftHours()});
  await _step('正在扫描疑误…',()=>{S.issues=scanAll()});
  showReview();toast('已载入 '+file.name+'：共 '+S.issues.filter(isCounted).length+' 处疑误')
}catch(err){console.error(err);toast('载入失败：'+err.message)}}
function readHeaders(){const ws=S.ws;const r1=[],r2=[];
  for(let i=0;i<28;i++){r1[i]=ws[XLSX.utils.encode_cell({r:0,c:i})]?.v;r2[i]=ws[XLSX.utils.encode_cell({r:1,c:i})]?.v}
  const known=new Set(['Workshop','Month','Date','Shift','Shift leader','Line','Status','Product','Asset','Throughput','Actual','Unfinished Volume','Loss Volume','Start','End','Loss Time','Reason','OAE','SL','UL','BO','Main Category','Sub Category','Individual Category']);
  let enRow=0,cnRow=1;for(let i=0;i<28;i++){if(r1[i]&&known.has(String(r1[i]).trim())){enRow=0;cnRow=1;break}if(r2[i]&&known.has(String(r2[i]).trim())){enRow=1;cnRow=0;break}}
  const en=enRow===0?r1:r2,cn=enRow===0?r2:r1;const fb={'A':'车间','B':'月份','C':'日期','P':'损失时间','U':'OAE','Y':'主AE分类','Z':'次AE分类','R':'分类','S':'故障设备','T':'故障组件','AB':'(空残留)'};
  COLS.forEach((col,i)=>{if(!col.cn){col.cn=cn[i]||fb[col.L]||col.L;col.en=en[i]||col.L}if(col.L==='U')col.cn='OAE';if(col.L==='AB')col.cn='(空残留)'})}
function buildDicts(){const wb=S.wb,d=S.dict;
  if(wb.SheetNames.includes('Product')){d.product=new Set();XLSX.utils.sheet_to_json(wb.Sheets['Product'],{header:1,raw:1}).forEach((r,i)=>{if(i&&r[0])d.product.add(String(r[0]).trim())})}
  if(wb.SheetNames.includes('Asset')){d.asset=new Map();d.workshops=new Set();XLSX.utils.sheet_to_json(wb.Sheets['Asset'],{header:1,raw:1}).forEach((r,i)=>{const c=r[1]?String(r[1]).trim():null,sh=r[0]?String(r[0]).trim():null;if(c&&sh){d.asset.set(sh+'|'+c,1);d.workshops.add(sh)}else if(c)d.asset.set(c,1)})}
  if(wb.SheetNames.includes('Category')){d.individual=new Set();S.catMap={};
    XLSX.utils.sheet_to_json(wb.Sheets['Category'],{header:1,raw:1}).forEach((r,i)=>{if(!i)return;const ind=r[3]?String(r[3]).trim():null;if(ind){d.individual.add(ind);S.catMap[ind]={main:r[4]?String(r[4]).trim():'',sub:r[5]?String(r[5]).trim():''}}})}}
/* 日期 key 归一化：Date/序列号/字符串统一为 y-m-d，与 scanAll 的 dayKey 口径一致 */
function _dayKeyOf(cv){
  if(cv instanceof Date&&!isNaN(cv.getTime()))return cv.getFullYear()+'-'+(cv.getMonth()+1)+'-'+cv.getDate();
  if(typeof cv==='number'){const d=serialToDate(cv);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
  return String(cv==null?'':cv).trim();
}
function detectShiftHours(){const ws=S.ws,max=getMaxRow();S.maxRow=max;const ghm=new Map();
  for(let r=S.dataStart;r<=max;r++){const l=String(getMergedVal(ws,'F',r)||'').trim(),s=getMergedVal(ws,'D',r),w=String(getMergedVal(ws,'A',r)||'').trim(),dk=_dayKeyOf(r2v(ws,'C',r));if(s&&String(s).trim().includes('中班')){if(l)ghm.set(dk+'|'+w+'|'+l,1);ghm.set(dk+'|'+w,1)}}
  /* 有产线编号的行只查线级标记（同车间其他产线的中班不传染）；无产线行用车间级兜底 */
  for(let r=S.dataStart;r<=max;r++){const l=String(getMergedVal(ws,'F',r)||'').trim(),w=String(getMergedVal(ws,'A',r)||'').trim(),dk=_dayKeyOf(r2v(ws,'C',r));S.shiftHours.set(r,(l?ghm.get(dk+'|'+w+'|'+l):ghm.get(dk+'|'+w))?8:12)}}
function detectMergedCells(){const ws=S.ws;S.dict.mergedF=new Set();S.dict.mergedA=new Set();S.dict.mergedMap={};if(!ws['!merges'])return;ws['!merges'].forEach(mr=>{if(mr.s.c===mr.e.c){const col=XLSX.utils.encode_col(mr.s.c);if(!S.dict.mergedMap[col])S.dict.mergedMap[col]={};for(let r=mr.s.r;r<=mr.e.r;r++){const row=r+1;S.dict.mergedMap[col][row]=mr.s.r+1;if(col==='F')S.dict.mergedF.add(row);if(col==='A')S.dict.mergedA.add(row)}}})}
function getMergedVal(ws,col,row){const v=r2s(ws,col,row);if(v!=null&&v!=='')return v;const mm=S.dict.mergedMap[col];if(mm&&mm[row]){return r2s(ws,col,mm[row])}return v}
function getMaxRow(){const ref=S.ws['!ref'];if(!ref)return 0;const rng=XLSX.utils.decode_range(ref);return rng.e.r+1}
function r2s(ws,col,row){const c=ws[col+row];if(!c)return null;return c.v==null?null:String(c.v)}
function r2v(ws,col,row){const c=ws[col+row];return c?c.v:null}
function r2n(ws,col,row){const v=r2v(ws,col,row);if(v==null)return 0;if(typeof v==='number')return v;const n=Number(v);return isNaN(n)?0:n}
/* 日期有效性检查 */
function isValidDate(v){
  if(v==null||v==='')return false;
  if(v instanceof Date)return !isNaN(v.getTime());
  if(typeof v==='number'){const d=serialToDate(v);return d instanceof Date&&!isNaN(d.getTime())&&d.getFullYear()>2000;}
  if(typeof v==='string'){
    const t=v.trim();
    const fmts=[/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/];
    for(const f of fmts){const m=t.match(f);if(m){
      let y,mo,d;
      if(m[1].length===4){y=m[1];mo=m[2];d=m[3]}else{y=m[3].length<=2?'20'+m[3]:m[3];mo=m[1];d=m[2]}
      const dt=new Date(+y,mo-1,+d);
      if(!isNaN(dt.getTime())&&dt.getFullYear()===+y&&dt.getMonth()===mo-1&&dt.getDate()===+d)return true;
    }}
    /* 形如 yyyy-m-d / m-d-yyyy 但未通过严格校验的（如2024-02-30）直接判无效；其余格式交给 Date.parse */
    if(/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(t))return false;
    return !!Date.parse(t);
  }
  return false;
}
/* 从日期值提取 "yy年mm月" */
function fmtMonthFromDate(v){
  if(v==null)return null;
  let d=null;
  if(v instanceof Date)d=v;
  else if(typeof v==='number')d=serialToDate(v);
  else if(typeof v==='string'){
    const t=v.trim();
    const m=t.match(/^(\d{4})[-/](\d{1,2})[-/]\d{1,2}$/);
    if(m)return m[1].slice(2)+'年'+m[2].padStart(2,'0')+'月';
    const m2=t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if(m2){const yy=m2[3].length<=2?m2[3]:m2[3].slice(2);return yy+'年'+m2[1].padStart(2,'0')+'月';}
    d=new Date(t);
  }
  if(d&&!isNaN(d.getTime()))return String(d.getFullYear()).slice(2)+'年'+String(d.getMonth()+1).padStart(2,'0')+'月';
  return null;
}
function isMergedF(r){return S.dict.mergedF.has(r)}
/* 扫描 */
function scanAll(){const ws=S.ws,max=S.maxRow,issues=[];let id=0;const daySum={};
  const push=(r,c,t,reason,cur,sug)=>{issues.push({id:++id,row:r,col:c,type:t,reason,current:(cur==null||cur===''?'␣':String(cur)),suggest:sug==null?'␣':String(sug),value:sug==null?'␣':String(sug),resolved:null,manualVal:null,demo:true})};
  const push1=(r,c,t,reason,cur,sug)=>{issues.push({id:++id,row:r,col:c,type:t,reason,current:(cur==null||cur===''?'␣':String(cur)),suggest:sug==null?'␣':String(sug),value:sug==null?'␣':String(sug),resolved:null,manualVal:null,demo:false})};
  for(let r=S.dataStart;r<=max;r++){
    const dv=r2v(ws,'D',r);
    if(dv==null||dv==='')push(r,'D','missing','班次为空','-','-');
    else{const s=String(dv);if(SYNONYMS.shift[s])push(r,'D','synonym','同义词«'+vis(s.trim())+'»→',s,SYNONYMS.shift[s]);else if(!SHIFT_ENUM.includes(s))push(r,'D','unknown','不在词库['+SHIFT_ENUM.join('/')+']',s,'-')}
    const ev=r2v(ws,'E',r);if(ev&&typeof ev==='string'&&dirty(ev))push(r,'E','dirty','含空白字符',vis(ev),clean(ev));
    const fv=r2v(ws,'F',r);
    if(fv==null||fv===''){if(!isMergedF(r))push(r,'F','missing','产线为空（可忽略）','-','-')}else{const s=String(fv);if(dirty(s))push1(r,'F','dirty','含空格',vis(s),clean(s));else if(!LINE_PATTERN.test(s))push(r,'F','unknown','格式异常',s,'-')}
    const gv=r2v(ws,'G',r);
    if(gv!=null&&gv!==''){const s=String(gv);if(dirty(s))push(r,'G','dirty','含空白字符',vis(s),clean(s));else if(STATUS_ENUM.includes(s)){}else{const syn=SYNONYMS.status[s];if(syn)push(r,'G','synonym','同义词«'+vis(s)+'»→',s,syn)}}
    const hv=r2v(ws,'H',r),kv=r2v(ws,'K',r);
    const hasProd=hv!=null&&hv!==''&&!(typeof hv==='string'&&/^\s+$/.test(hv));
    const hasActual=kv!=null&&kv!==''&&!(typeof kv==='string'&&/^\s+$/.test(kv))&&r2n(ws,'K',r)>0;
    if(!hasProd&&hasActual)push(r,'H','missing','有实际产量但产品为空','-','-');
    else if(hasProd&&!hasActual)push(r,'H','unexpected','无实际产量但有产品名',String(hv),'');
    else if(hasProd){const s=String(hv);if(dirty(s))push(r,'H','dirty','含空白字符',vis(s),clean(s));else if(!S.dict.product.has(s)){let hit=0;for(const p of S.dict.product)if(p.toLowerCase()===s.toLowerCase()){hit=1;push(r,'H','case','大小写不符',s,p);break}if(!hit)push(r,'H','unknown','不在Product字典',s,'-')}}
    /* C列日期检查 */
    const cv=r2v(ws,'C',r);
    if(cv==null||cv==='')push(r,'C','missing','日期为空','-','-');
    else if(!isValidDate(cv))push(r,'C','date-invalid','日期格式无效',esc(cv),'-');
    else if(typeof cv==='string'&&dirty(cv))push(r,'C','dirty','含空白字符',vis(cv),clean(cv));
    /* B列月份检查（参考C列日期） */
    const bv=r2v(ws,'B',r);
    const expectedMonth=isValidDate(cv)?fmtMonthFromDate(cv):null;
    if(bv!=null&&bv!==''){
      const s=String(bv).trim();
      if(/^\d{2}年\d{2}月$/.test(s)){
        if(expectedMonth&&s!==expectedMonth)push(r,'B','month-mismatch','月份与C列日期不符：C列='+esc(cv),s,expectedMonth);
      }else{
        push(r,'B','month-format','月份格式应为「yy年mm月」',s,expectedMonth||null);
      }
      if(typeof bv==='string'&&dirty(bv))push(r,'B','dirty','含空白字符',vis(bv),clean(bv));
    }
    /* A列车间检查 */
    const av=r2v(ws,'A',r);
    if(av!=null&&av!==''){
      const s=String(av).trim();
      if(typeof av==='string'&&dirty(av))push(r,'A','dirty','含空白字符',vis(av),clean(av));
      if(S.dict.workshops.size&&!S.dict.workshops.has(s))push(r,'A','workshop','车间不在Asset表字典中',s,'-');
    }
    const iv=r2v(ws,'I',r),rs=String(getMergedVal(ws,'A',r)||'').trim();
    if(iv==null||iv==='')push(r,'I','missing','资产为空','-','-');else{const s=String(iv);if(dirty(s))push(r,'I','dirty','含空格',vis(s),clean(s));const st=s.trim();if(S.dict.asset.size&&st&&!S.dict.asset.has(rs+'|'+st)&&!S.dict.asset.has(st))push1(r,'I','unknown','本车间无此资产',rs+'/'+st,'-')}
    ['J','K','L','M'].forEach(L=>{const nv=r2v(ws,L,r);if(nv!=null&&typeof nv==='string'&&nv.trim()!==''){if(dirty(nv))push1(r,L,'dirty','含空格字符串',vis(nv),clean(nv));else if(!isNaN(Number(nv)))push1(r,L,'numstr','文本型数字',nv,Number(nv));else push(r,L,'nonnum','非数字',nv,'-')}});
    const nv=r2v(ws,'N',r),ov=r2v(ws,'O',r);
    if(typeof nv==='string'&&/^\s+$/.test(nv))push(r,'N','whitespace','开始时间为空白字符',vis(nv),'');
    if(typeof ov==='string'&&/^\s+$/.test(ov))push(r,'O','whitespace','结束时间为空白字符',vis(ov),'');
    if((nv==null||nv==='')&&(ov!=null&&ov!==''))push(r,'N','timealone','存在结束时间但开始时间为空','␣→'+String(ov),'-')
    if((ov==null||ov==='')&&(nv!=null&&nv!==''))push(r,'O','timealone','存在开始时间但结束时间为空',String(nv)+'→␣','-')
    // 字符串时间：尝试解析为标准格式
    const parseTime=s=>{
      if(!s||typeof s!=='string'||s.trim()==='')return null;
      let t=s.trim();let r=null;
      if(/[;：]/.test(t)){t=t.replace(/[;：]+/g,':').replace(/:+/g,':');r='含异常分隔符，建议修复为「'+t+'」';}
      const fmts=[
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
        /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
      ];
      for(const f of fmts){const m=t.match(f);if(m){
        let y,mo,d;
        if(m[1].length===4){y=m[1];mo=m[2];d=m[3]}else{y=m[3].length===2?'20'+m[3]:m[3];mo=m[1];d=m[2]}
        const h=m[4].padStart(2,'0'),mi=m[5],se=m[6]||'00';return {sug:y+'-'+mo.padStart(2,'0')+'-'+d.padStart(2,'0')+' '+h+':'+mi+':'+se};
      }}
      if(r)return{sug:t,reason:r};
      return null;
    };
    if(nv&&typeof nv==='string'){
      const p=parseTime(nv);
      if(p)push(r,'N','type','开始时间为字符串'+(p.reason?'（'+p.reason+'）':''),vis(nv),p.sug);
      else push(r,'N','type','开始时间为字符串（无法解析）',vis(nv),'-');
    }
    if(ov&&typeof ov==='string'){
      const p=parseTime(ov);
      if(p)push(r,'O','type','结束时间为字符串'+(p.reason?'（'+p.reason+'）':''),vis(ov),p.sug);
      else push(r,'O','type','结束时间为字符串（无法解析）',vis(ov),'-');
    }
    const nSer=readTimeSerial(ws,'N',r),oSer=readTimeSerial(ws,'O',r);
    if(nSer!=null&&oSer!=null&&oSer<nSer){const _fmt=s=>serialToDate(s).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});push(r,'O','reverse','结束早于开始',_fmt(nSer)+' > '+_fmt(oSer),'-')}
    const pc=ws['P'+r];if(pc&&pc.f){const pf=String(pc.f).replace(/\s/g,'');if(!pf.startsWith('ROUND((O')&&!/O\d+-N\d+/.test(pf))push1(r,'P','formula','公式异常',pc.f,'-')}
    const pv=r2v(ws,'P',r);if(typeof pv==='number'&&pv<0)push1(r,'P','negtime','值为负',String(pv),'-')
    ['Q','R','S','T'].forEach(L=>{const tv=r2v(ws,L,r);if(tv!=null&&typeof tv==='string'&&dirty(tv))push(r,L,'dirty','含空白字符',vis(tv),clean(tv))})
    const uc=ws['U'+r];if(uc&&uc.f){const m=String(uc.f).match(/^(?:=\s*)?(\d+)\s*-/);if(m){const base=parseInt(m[1]),exp=S.shiftHours.get(r)||12;if(base!==exp){const sug=+(exp-r2n(ws,'V',r)-r2n(ws,'W',r)-r2n(ws,'X',r)).toFixed(2);push1(r,'U','oaebase','基数='+base+'与班制('+exp+'h)不符','='+base+'-V-W-X',sug)}}}
    ['V','W','X'].forEach(L=>{const nv2=r2v(ws,L,r);if(nv2!=null&&typeof nv2==='string'&&nv2.trim()!==''){if(dirty(nv2))push1(r,L,'dirty','含空格',vis(nv2),clean(nv2));else if(!isNaN(Number(nv2)))push1(r,L,'numstr','文本型数字',nv2,Number(nv2));else push1(r,L,'nonnum','非数字',nv2,'-')}})
    const aav=r2v(ws,'AA',r);
    if(aav!=null&&aav!==''){const s=String(aav).trim();if(typeof aav==='string'&&/^\s+$/.test(aav))push(r,'AA','whitespace','含空白字符',vis(aav),'');else if(!S.dict.individual.has(s))push1(r,'AA','unknown','不在Category字典',s,'-')}
    const ab=ws['AB'+r];if(ab&&ab.v!=null&&ab.v!=='')push1(r,'AB','residual','列本应空','值:'+String(ab.v),'')
    /* 跨列复合校验 */
    const slv=r2n(ws,'V',r),ulv=r2n(ws,'W',r),box=r2n(ws,'X',r),yv=r2s(ws,'Y',r);
    if(slv>0&&ulv>0)push1(r,'Y','sl+ul','同一行不能同时存在SL和UL',slv+'/'+ulv,'-')
    else if(slv>0&&yv!=='SL')push1(r,'Y','sl→cat','存在SL损失时间但主AE分类≠SL',yv||'(空)','SL')
    else if(ulv>0&&yv!=='UL')push1(r,'Y','ul→cat','存在UL损失时间但主AE分类≠UL',yv||'(空)','UL')
    const uvc=r2n(ws,'U',r);
    if(uvc>0||slv>0||ulv>0||box>0){
      const _wsv=String(getMergedVal(ws,'A',r)||'').trim(),_asv=String(getMergedVal(ws,'I',r)||'').trim();
      let _dk;const _cv=r2v(ws,'C',r);
      if(_cv instanceof Date)_dk=_cv.getFullYear()+'-'+(_cv.getMonth()+1)+'-'+_cv.getDate();
      else if(typeof _cv==='number'){const _cd=serialToDate(_cv);_dk=_cd.getFullYear()+'-'+(_cd.getMonth()+1)+'-'+_cd.getDate();}
      else _dk=String(_cv||'').trim();
      const dayKey=_wsv+'|'+_asv+'|'+_dk;if(!daySum[dayKey])daySum[dayKey]={rows:[],total:0,wa:_wsv+'\x00'+_asv};daySum[dayKey].rows.push(r);daySum[dayKey].total+=uvc+slv+ulv+box}
    if(aav!=null&&aav!==''){const ind=String(aav).trim();const cat=S.catMap[ind];if(!cat)push1(r,'Y','nomap','AE分类不在Category字典',vis(ind),'-');else{const zv2=r2s(ws,'Z',r);if(yv!==null&&yv!==''&&cat.main&&yv!==cat.main)push1(r,'Y','main-mismatch','主AE分类应为「'+cat.main+'」',yv,cat.main);if(zv2!==null&&zv2!==''&&cat.sub&&zv2!==cat.sub)push1(r,'Z','sub-mismatch','次AE分类应为「'+cat.sub+'」',zv2,cat.sub)}}
  }
  /* 不足24h仅在"该车间+资产存在≈24h运转日"时才报缺班，避免非全天候运行的资产每日误报；超24h恒报 */
  const fullDay={};Object.keys(daySum).forEach(k=>{if(Math.abs(daySum[k].total-24)<=0.05)fullDay[daySum[k].wa]=1});
  Object.keys(daySum).forEach(function(k){const d=daySum[k];if(d.total>24.05||(d.total<23.95&&fullDay[d.wa]))push1(d.rows[0],'Y','sum≠24','同日OAE+SL+UL+BO='+d.total+'≠24h（行#'+d.rows.join(',')+'）',d.total,'-');if(d.total>30){var cv=r2v(ws,'C',d.rows[0]);var cs=cv instanceof Date?esc(cv):typeof cv==='number'?serialToDate(cv).toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'}):String(cv);push1(d.rows[0],'C','date-suspect','单日总时间超24h，可能存在重复班次或日期错误',cs,'-')}});
  return issues}
/* 渲染 */
/* 行号→{B,C修订值} 缓存；疑误 resolved/value 变更处自增 S._fixSeq 使缓存失效 */
function _rowFixMap(){
  if(!S._rfCache||S._rfCache.seq!==S._fixSeq){
    const m={};
    for(const x of S.issues){
      if(x.resolved!=='accept'&&x.resolved!=='manual')continue;
      if(x.value==null||x.value==='␣'||x.value==='-')continue;
      if(x.col!=='B'&&x.col!=='C')continue;
      (m[x.row]||(m[x.row]={}))[x.col]=x.value;
    }
    S._rfCache={seq:S._fixSeq,m};
  }
  return S._rfCache.m;
}
function getIssueMonth(i){
  const ws=S.ws;
  const rf=_rowFixMap()[i.row]||{};
  const cv=rf.C!==undefined?rf.C:r2v(ws,'C',i.row);
  const m=fmtMonthFromDate(cv);
  if(m)return m;
  const bv=rf.B!==undefined?rf.B:r2v(ws,'B',i.row);
  if(bv!=null){const s=String(bv).trim();if(/^\d{2}年\d{2}月$/.test(s))return s}
  return null;
}
function getFilteredIssues(){if(!S.filterYear&&!S.filterMonth)return S.issues;return S.issues.filter(i=>{const m=getIssueMonth(i);if(!m)return false;if(S.filterYear&&!m.startsWith(S.filterYear+'年'))return false;if(S.filterMonth&&!m.endsWith(S.filterMonth+'月'))return false;return true})}
function initDateFilter(){const years=new Set(),months=new Set();S.issues.forEach(i=>{const m=getIssueMonth(i);if(!m)return;const ym=m.match(/^(\d{2})年(\d{2})月$/);if(ym){years.add(ym[1]);months.add(ym[2])}});const ys=$('#filterYear'),ms=$('#filterMonth');ys.innerHTML='<option value="">全部年份</option>';[...years].sort().forEach(y=>ys.innerHTML+='<option value="'+y+'">20'+y+'年</option>');ms.innerHTML='<option value="">全部月份</option>';[...months].sort().forEach(mo=>ms.innerHTML+='<option value="'+mo+'">'+parseInt(mo)+'月</option>');S.filterYear=null;S.filterMonth=null;ys.value='';ms.value=''}
function showReview(){$('#stage-load').classList.remove('active');$('#epigraph').style.display='none';$('#viewToggle').style.display='flex';initDateFilter();renderChart('ws-asset');renderTabs();renderIssues();updateCounts();$('#exportBtn').addEventListener('click',openExport);$('#reloadBtn').addEventListener('click',()=>location.reload());$('#exportCancel').addEventListener('click',closeExport);$('#exportGo').addEventListener('click',doExport);$('#filterApply').addEventListener('click',()=>{S.filterYear=$('#filterYear').value||null;S.filterMonth=$('#filterMonth').value||null;renderChart(S.chartDim||'ws-asset');renderTabs();renderIssues();updateCounts()});$('#filterClear').addEventListener('click',()=>{S.filterYear=null;S.filterMonth=null;$('#filterYear').value='';$('#filterMonth').value='';renderChart(S.chartDim||'ws-asset');renderTabs();renderIssues();updateCounts()});$$('.ct-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.ct-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderChart(btn.dataset.dim)}));const gb=$('#gapBtn');if(gb)gb.addEventListener('click',openGAP);const gc=$('#gapCancel');if(gc)gc.addEventListener('click',closeGAP);const gg=$('#gapGo');if(gg)gg.addEventListener('click',generateGAP);const grc=$('#gapReportClose');if(grc)grc.addEventListener('click',()=>{$('#gapReportModal').classList.remove('open');$('#gapReportModal').setAttribute('aria-hidden','true')});
  $$('#viewToggle .vt-btn').forEach(btn=>btn.addEventListener('click',()=>{const v=btn.dataset.view;if(v==='analysis')switchToAnalysis();else switchToReview()}));
  switchToAnalysis()}
function renderChart(dim){const area=$('#chartArea');if(!area)return;S.chartDim=dim;const ws=S.ws;
  const issues=getFilteredIssues().filter(isCounted);
  let groups=[];
  if(dim==='ws-asset'){
    const map={};
    for(let r=S.dataStart;r<=S.maxRow;r++){const ws_k=String(getMergedVal(ws,'A',r)||'(空)').trim(),as_k=String(getMergedVal(ws,'I',r)||'(空)').trim();const k=ws_k+'\x00'+as_k;if(!(k in map))map[k]=0}
    issues.forEach(i=>{const ws_k=String(getMergedVal(ws,'A',i.row)||'(空)').trim(),as_k=String(getMergedVal(ws,'I',i.row)||'(空)').trim();const k=ws_k+'\x00'+as_k;if(!(k in map))map[k]=0;map[k]++});
    const byWs={};Object.entries(map).forEach(([k,v])=>{const[ws_k,as_k]=k.split('\x00');if(!byWs[ws_k])byWs[ws_k]=[];byWs[ws_k].push({sub:as_k,val:v})});
    groups=Object.entries(byWs).sort((a,b)=>a[0].localeCompare(b[0])).map(([gk,items])=>({group:gk,items:items.sort((a,b)=>{const am=a.sub.match(/^(\D*)(\d+)/),bm=b.sub.match(/^(\D*)(\d+)/);if(am&&bm&&am[1]===bm[1])return parseInt(am[2])-parseInt(bm[2]);return a.sub.localeCompare(b.sub)})}));
  }else if(dim==='yr-mon'){
    const map={};issues.forEach(i=>{const m=getIssueMonth(i);if(!m)return;const ym=m.match(/^(\d{2})年(\d{2})月$/);if(!ym)return;const yr_k='20'+ym[1]+'年',mo_k=parseInt(ym[2])+'月';const k=yr_k+'\x00'+mo_k;if(!map[k])map[k]=0;map[k]++});
    const byYr={};Object.entries(map).forEach(([k,v])=>{const[yr_k,mo_k]=k.split('\x00');if(!byYr[yr_k])byYr[yr_k]=[];byYr[yr_k].push({sub:mo_k,val:v})});
    const allYrs=Object.keys(byYr).sort();const recentYrs=allYrs.slice(-3);
    groups=recentYrs.map(gk=>({group:gk,items:byYr[gk].sort((a,b)=>parseInt(a.sub)-parseInt(b.sub))}));
    if(allYrs.length>3)groups._extra='仅显示最近3年（共'+allYrs.length+'年），可横向滚动查看';
  }else return;
  if(!groups.length){area.innerHTML='<p style="color:var(--ink-faded);padding:1rem 0">暂无数据</p>';return}
  let maxVal=0;groups.forEach(g=>g.items.forEach(it=>{if(it.val>maxVal)maxVal=it.val}));
  let html='<div class="bar-chart">';
  groups.forEach(g=>{
    html+='<div class="bar-group">';
    g.items.forEach(it=>{
      const h=maxVal>0?Math.round(it.val/maxVal*90):0;
      html+='<div class="bar-item"><div class="bar-fill" style="height:'+h+'%"><span class="bar-val">'+it.val+'</span></div><div class="bar-sub">'+escXml(it.sub)+'</div></div>';
    });
    html+='<div class="bar-grp-bracket"></div><div class="bar-grp-label">'+escXml(g.group)+'</div></div>';
  });
  html+='</div><div class="chart-xaxis"></div>';
  if(groups._extra)html+='<p style="font-size:.78rem;color:var(--ink-faded);margin-top:.4rem;font-family:var(--serif-cn)">'+groups._extra+'</p>';
  area.innerHTML=html}
function isCounted(i){return i.type!=='month-format'&&!(i.col==='F'&&i.type==='missing')&&!(i.col==='H'&&i.type==='unexpected')&&!(i.col==='G'&&i.type==='dirty')}
function renderTabs(){const wrap=$('#colTabs');wrap.innerHTML='';const filtered=getFilteredIssues();const byCol={};filtered.forEach(i=>{(byCol[i.col]||(byCol[i.col]=[])).push(i)});S.curCol=null;
  COLS.forEach(col=>{const arr=(byCol[col.L]||[]);const cnt=arr.filter(isCounted).length;if(!arr.length)return;const t=document.createElement('div');t.className='col-tab';t.innerHTML='<span class="ct-letter">'+col.L+'</span><span>'+(col.cn||col.L)+'</span><span class="ct-badge">'+cnt+'</span>';t.addEventListener('click',()=>{S.curCol=col.L;renderIssues(col.L);$$('.col-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active')});wrap.appendChild(t)})
  const all=document.createElement('div');all.className='col-tab active';all.style.background='#1a1410';all.style.color='#f3ecdc';all.innerHTML='<span>全</span><span>全部</span><span class="ct-badge" style="background:#b1281e">'+filtered.filter(isCounted).length+'</span>';all.style.order='-1';all.addEventListener('click',()=>{S.curCol=null;renderIssues();$$('.col-tab').forEach(x=>x.classList.remove('active'));all.classList.add('active')});wrap.insertBefore(all,wrap.firstChild)}
function renderIssues(filterCol){const stream=$('#issuesStream');stream.innerHTML='';const filtered=getFilteredIssues();const groups={};filtered.forEach(i=>{if(!filterCol||i.col===filterCol){(groups[i.col]||(groups[i.col]=[])).push(i)}})
  COLS.forEach(col=>{const arr=groups[col.L];if(!arr||!arr.length)return;const cnt=arr.filter(isCounted).length;const g=document.createElement('div');g.className='col-group';g.dataset.col=col.L;const h=document.createElement('div');h.className='cg-head';h.innerHTML='<span class="cg-letter">'+col.L+'</span><span class="cg-title">'+(col.cn||col.L)+'</span><span class="cg-en">'+(col.en||'')+'</span><span class="cg-count">疑误 <b>'+cnt+'</b> 处</span>';g.appendChild(h);const sub={};arr.forEach(i=>{const k=groupKey(i);(sub[k]||(sub[k]=[])).push(i)});Object.keys(sub).forEach(k=>g.appendChild(renderGroup(sub[k],col)));stream.appendChild(g)})}
function renderGroup(issues,col){const el=document.createElement('div');el.className='issue-group';el._issues=issues;el.dataset.type=issues[0].type;if(issues.every(i=>i.resolved))el.classList.add('dismissed')
  const first=issues[0],cnt=issues.length,hasSug=first.suggest!=null&&first.suggest!=='␣'&&first.suggest!=='-',isMulti=cnt>1,lbl=typeLabel(first.type)
  const rows=cnt<=5?issues.map(i=>'#'+i.row).join(' '):issues.slice(0,5).map(i=>'#'+i.row).join(' ')+' …等 '+cnt+' 行'
  el.innerHTML='<div class="ig-head"><div class="ig-left"><span class="ig-type">'+lbl+'</span>'+
    (!col.noEdit?'<span class="ig-count">'+cnt+'处'+(!isCounted(first)?'(不统计)':'')+'</span>':'')+'</div><div class="ig-rows">'+rows+'</div></div>'+
    '<div class="ig-body"><div class="issue-reason">'+escXml(first.reason)+'</div>'+
    (hasSug?'<div class="issue-vals"><span class="lbl">原文</span><span class="old-val">'+escXml(esc(first.current))+'</span><span class="arrow">→</span><span class="lbl">修订为</span><span class="new-val">'+(first.suggest===''?'null':escXml(esc(first.suggest)))+'</span>'+(isMulti?'<span class="demo-badge">示例</span>':'')+'</div>'
           :'<div class="issue-vals"><span class="lbl">原文</span><span class="old-val">'+escXml(esc(first.current))+'</span>'+(isMulti?'<span class="demo-badge">示例</span>':'')+'</div>')+
    '</div><div class="ig-actions">'+
    (col.noEdit?'<button class="iact" data-act="ignore" style="min-width:auto"><span>全部忽略</span></button>'
      :'<button class="iact bulk-acc" data-act="bulk-accept"'+(hasSug?'':'disabled')+'><span>全部接受</span></button><button class="iact" data-act="yeditor"><span>手动修改</span></button><button class="iact" data-act="ignore"><span>全部忽略</span></button>')+
    '</div>'
  el.querySelectorAll('.iact').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const act=btn.dataset.act;
    if(act==='yeditor'){const todo=issues.filter(i=>!i.resolved);renderYEditor(todo.length?todo:issues);return}
    if(act==='bulk-accept'){issues.filter(i=>i.resolved!=='manual'&&i.suggest!=null&&i.suggest!=='␣'&&i.suggest!=='-').forEach(i=>{i.resolved='accept';i.value=i.suggest})}
    else if(act==='ignore'){issues.filter(i=>i.resolved!=='manual').forEach(i=>{i.resolved='ignore'})}
    S._fixSeq=(S._fixSeq||0)+1;
el.classList.toggle('dismissed',issues.every(i=>i.resolved));updateCounts()}))
  return el}
function typeLabel(t){const m={'missing':'数据缺失','unexpected':'多余产品','dirty':'数据格式','whitespace':'空白字符','type':'格式','synonym':'同义词','unknown':'未知','case':'大小写','format':'格式','mismatch':'不一致','numstr':'文本数字','nonnum':'非数字','reverse':'倒序','formula':'公式','negtime':'负值','oaebase':'常数','residual':'残留','timealone':'不配套','dup':'重复','workshop':'车间','date-invalid':'日期无效','month-format':'月份格式','month-mismatch':'月份不符','sl+ul':'SL,UL冲突','sl→cat':'SL不匹配','ul→cat':'UL不匹配','sum≠24':'日和≠24h','date-suspect':'日期疑误','nomap':'无映射','main-mismatch':'主类错','sub-mismatch':'次类错'};return m[t]||t}
function updateCounts(){const ci=getFilteredIssues().filter(isCounted);const a=ci.filter(i=>i.resolved==='accept').length,m=ci.filter(i=>i.resolved==='manual').length,ig=ci.filter(i=>i.resolved==='ignore').length
  $('#cntDataRows').textContent=S.maxRow-S.dataStart+1;$('#cntTotal').textContent=ci.length;$('#cntAccept').textContent=a;$('#cntManual').textContent=m;$('#cntIgnore').textContent=ig;$('#cntPending').textContent=ci.length-a-m-ig;$('#exportBtn').style.opacity='1';$('#exportBtn').disabled=false;const gb=$('#gapBtn');if(gb){gb.style.opacity='1';gb.disabled=false}const nm=$('#newName');if(nm)nm.textContent=S.fileName.replace(/\.xlsx?m?$/,'')+'-Check.'+S.srcExt;const om=$('#origName');if(om)om.textContent=S.fileName}
function openExport(){$('#exportModal').classList.add('open');$('#exportModal').setAttribute('aria-hidden','false')}
function closeExport(){$('#exportModal').classList.remove('open');$('#exportModal').setAttribute('aria-hidden','true')}
const NUMERIC_COLS=new Set(['J','K','L','M','P','U','V','W','X']);
/* 值 → Excel 日期序列号；无法解析为日期时返回 null。YMD 格式按本地时间逐段解析，避免 new Date('YYYY-MM-DD') 按 UTC 解析导致日期偏移 */
function _cellDateSerial(value){
  if(value instanceof Date&&!isNaN(value.getTime()))return toExcelSerial(value);
  if(typeof value==='number'&&isFinite(value))return value;
  if(typeof value==='string'){
    const t=value.trim().replace(/：/g,':');if(!t)return null;
    const m=t.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if(m){const d=new Date(+m[1],m[2]-1,+m[3],+(m[4]||0),+(m[5]||0),+(m[6]||0));if(!isNaN(d.getTime()))return toExcelSerial(d)}
    const d=new Date(t);if(!isNaN(d.getTime()))return toExcelSerial(d);
  }
  return null;
}
function escapeXml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
/* 解析 styles.xml：判断各 cellXf 样式是否为日期/时间显示格式 */
function _dtStyleInfo(stylesXml){
  const numFmt={};let m;
  const nfRe=/<numFmt numFmtId="(\d+)" formatCode="([^"]*)"/g;
  while((m=nfRe.exec(stylesXml))!==null)numFmt[m[1]]=m[2];
  const cx=stylesXml.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/);
  const xfIds=[];
  if(cx){const xRe=/<xf\b[^>]*?numFmtId="(\d+)"/g;while((m=xRe.exec(cx[1]))!==null)xfIds.push(+m[1])}
  const builtIn={14:'m/d/yy',15:'d-mmm-yy',16:'d-mmm',17:'mmm-yy',18:'h:mm AM/PM',19:'h:mm:ss AM/PM',20:'h:mm',21:'h:mm:ss',22:'m/d/yy h:mm'};
  const codeOf=id=>numFmt[id]||builtIn[id]||((+id>=27&&+id<=36)||(+id>=50&&+id<=58)?'ymd':(+id>=45&&+id<=47?'hms':''));
  const clean=fc=>fc.replace(/"[^"]*"/g,'').replace(/\[[^\]]*\]/g,'').replace(/\\./g,'');
  return{numFmt,xfIds,isDate(s){return/[dy]/i.test(clean(codeOf(xfIds[s])))},hasTime(s){return/[hs]/i.test(clean(codeOf(xfIds[s])))}};
}
function applyMod(addr,attrs,content,col,value,dtStyles){
  const stripT=()=>attrs.replace(/\s*t="[^"]*"/g,'');
  if(value==='\u2423'||value==='-')return null;
  if(value===''||value==null)return'<c r="'+addr+'"'+stripT()+'/>';
  /* C(日期)/N/O(起止时间) 写回日期序列号而非字符串，避免重导入时被再次报错；
     单元格原样式非日期/时间格式（或新增单元格无样式）时替换为可用样式，防止 Excel 显示纯数字 */
  if(col==='C'||col==='N'||col==='O'){
    const ds=_cellDateSerial(value);
    if(ds!=null){
      let a2=stripT();
      if(dtStyles){
        const needDt=col!=='C';
        const sm=a2.match(/\bs="(\d+)"/),cur=sm?+sm[1]:null;
        const ok=cur!=null&&(needDt?(dtStyles.si.isDate(cur)&&dtStyles.si.hasTime(cur)):(dtStyles.si.isDate(cur)&&!dtStyles.si.hasTime(cur)));
        if(!ok){const fb=needDt?dtStyles.dtStyle:dtStyles.dateStyle;a2=a2.replace(/\s*s="\d+"/,'');if(fb>=0)a2+=' s="'+fb+'"'}
      }
      return'<c r="'+addr+'"'+a2+'><v>'+ds+'</v></c>'
    }
  }
  if(NUMERIC_COLS.has(col)){const nv=Number(value);if(!isNaN(nv))return'<c r="'+addr+'"'+stripT()+'><v>'+nv+'</v></c>'}
  return'<c r="'+addr+'"'+stripT()+' t="inlineStr"><is><t>'+escapeXml(value)+'</t></is></c>'
}
async function exportPatchedFile(){
  if(!S.origBuf){toast('无原始文件数据');return}
  if(S.srcExt==='xls'){toast('暂不支持 .xls 旧格式的修正文件导出，请另存为 .xlsx 后重新导入');return false}
  toast('正在生成修正文件…');
  try{
    const zip=await JSZip.loadAsync(S.origBuf);
    /* 按工作表名经 workbook.xml+rels 定位 AE Data 对应的 sheet 文件，避免假定 sheet1.xml */
    let sheetPath='xl/worksheets/sheet1.xml';
    try{
      const wbXml=await zip.file('xl/workbook.xml').async('string');
      const sm=wbXml.match(/<sheet[^>]*name="AE Data"[^>]*r:id="(rId\d+)"/)||wbXml.match(/<sheet[^>]*r:id="(rId\d+)"[^>]*name="AE Data"/);
      if(sm){
        const relsXml=await zip.file('xl/_rels/workbook.xml.rels').async('string');
        const rm=relsXml.match(new RegExp('<Relationship[^>]*Id="'+sm[1]+'"[^>]*Target="([^"]+)"'))||relsXml.match(new RegExp('<Relationship[^>]*Target="([^"]+)"[^>]*Id="'+sm[1]+'"'));
        if(rm){let t=rm[1];if(t.charAt(0)==='/')t=t.slice(1);else if(!t.startsWith('xl/'))t='xl/'+t;if(zip.file(t))sheetPath=t}
      }
    }catch(e){console.warn('AE Data 工作表定位失败，回退 sheet1.xml',e)}
    let sheetXml=await zip.file(sheetPath).async('string');
    /* C/N/O 写回序列号需要日期/时间样式：检测现有样式，不足时向 styles.xml 追加 */
    let dtStyles=null;
    const stylesEntry=zip.file('xl/styles.xml');
    if(stylesEntry){
      let stylesXml=await stylesEntry.async('string');
      const si=_dtStyleInfo(stylesXml);
      let dateStyle=-1,dtStyle=-1;
      for(let i=0;i<si.xfIds.length;i++){
        if(dateStyle<0&&si.isDate(i)&&!si.hasTime(i))dateStyle=i;
        if(dtStyle<0&&si.isDate(i)&&si.hasTime(i))dtStyle=i;
      }
      if(dateStyle<0||dtStyle<0){
        const nfAdds=[],xfAdds=[];let nextNf=163;
        Object.keys(si.numFmt).forEach(k=>{if(+k>=nextNf)nextNf=+k+1});
        if(nextNf<164)nextNf=164;
        if(dateStyle<0){nfAdds.push('<numFmt numFmtId="'+nextNf+'" formatCode="yyyy/m/d"/>');xfAdds.push('<xf numFmtId="'+nextNf+'" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>');dateStyle=si.xfIds.length;si.xfIds.push(nextNf);nextNf++}
        if(dtStyle<0){nfAdds.push('<numFmt numFmtId="'+nextNf+'" formatCode="yyyy/m/d\\ h:mm"/>');xfAdds.push('<xf numFmtId="'+nextNf+'" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>');dtStyle=si.xfIds.length;si.xfIds.push(nextNf)}
        if(stylesXml.indexOf('<numFmts')>=0)stylesXml=stylesXml.replace(/<numFmts count="(\d+)">/,(m,c)=>'<numFmts count="'+(parseInt(c)+nfAdds.length)+'">'+nfAdds.join(''));
        else stylesXml=stylesXml.replace(/<fonts/,'<numFmts count="'+nfAdds.length+'">'+nfAdds.join('')+'</numFmts><fonts');
        stylesXml=stylesXml.replace(/<cellXfs count="(\d+)">/,(m,c)=>'<cellXfs count="'+(parseInt(c)+xfAdds.length)+'">');
        stylesXml=stylesXml.replace('</cellXfs>',xfAdds.join('')+'</cellXfs>');
        zip.file('xl/styles.xml',stylesXml);
      }
      dtStyles={si,dateStyle,dtStyle};
    }
    const mods=new Map();
    /* 同 row+col 多条已解决疑误时，语义修订类优先于 dirty/whitespace 等清理类，避免月份修正等被空格清理覆盖 */
    const _mrk={dirty:0,whitespace:0,numstr:1};
    const _rnk=t=>_mrk[t]!==undefined?_mrk[t]:2;
    const _setMod=(key,col,val,type)=>{const p=mods.get(key);if(!p||_rnk(type)>=_rnk(p.type))mods.set(key,{col,value,type})};
    S.issues.slice().sort((a,b)=>_rnk(a.type)-_rnk(b.type)).forEach(i=>{
      if(i.resolved!=='accept'&&i.resolved!=='manual')return;
      if(i.resolved==='manual'&&i.manualVal){
        try{const f=JSON.parse(i.manualVal);
          if(f&&typeof f==='object'){['U','V','W','X','Y','Z','AA'].forEach(c=>{if(f[c]!==undefined)_setMod(c+i.row,c,f[c],i.type)});return}
        }catch(e){}
      }
      _setMod(i.col+i.row,i.col,i.value,i.type);
    });
    console.log('Modifications to apply:',mods.size);
    const cellRe=/<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>|<c r="([A-Z]+\d+)"([^>]*)\/>/g;
    let modCount=0;const applied=new Set();
    sheetXml=sheetXml.replace(cellRe,(m,addr1,attrs1,content,addr2,attrs2)=>{
      const addr=addr1||addr2,attrs=attrs1!=null?attrs1:(attrs2||''),inner=content||'';
      const mod=mods.get(addr);if(!mod)return m;
      const result=applyMod(addr,attrs,inner,mod.col,mod.value,dtStyles);
      if(result===null)return m;applied.add(addr);modCount++;return result;
    });
    /* 原XML中不存在的空单元格：按列序插入对应<row>，行缺失则插新行 */
    const colNum=c=>{let n=0;for(let i=0;i<c.length;i++)n=n*26+(c.charCodeAt(i)-64);return n};
    mods.forEach((mod,addr)=>{
      if(applied.has(addr))return;
      const mm=addr.match(/^([A-Z]+)(\d+)$/);const cn=colNum(mm[1]),rn=mm[2];
      const cellStr=applyMod(addr,'','',mod.col,mod.value,dtStyles);
      if(cellStr===null)return;
      const rowReSC=new RegExp('<row\\b[^>]*\\br="'+rn+'"[^>]*/>');
      const rowReOpen=new RegExp('(<row\\b[^>]*\\br="'+rn+'"[^>]*>)([\\s\\S]*?)(</row>)');
      if(rowReSC.test(sheetXml)){
        sheetXml=sheetXml.replace(rowReSC,m=>m.replace(/\/>$/,'>')+cellStr+'</row>');
        applied.add(addr);modCount++;return;
      }
      if(rowReOpen.test(sheetXml)){
        sheetXml=sheetXml.replace(rowReOpen,(m,o1,inner,o2)=>{
          const cRe=/<c r="([A-Z]+)\d+"/g;let cm,insertAt=inner.length;
          while((cm=cRe.exec(inner))!==null){if(colNum(cm[1])>cn){insertAt=cm.index;break}}
          return o1+inner.substring(0,insertAt)+cellStr+inner.substring(insertAt)+o2;
        });
        applied.add(addr);modCount++;return;
      }
      const rowsRe=/<row\b[^>]*\br="(\d+)"/g;let rm,insertPos=-1;
      while((rm=rowsRe.exec(sheetXml))!==null){if(parseInt(rm[1])>rn){insertPos=rm.index;break}}
      const newRow='<row r="'+rn+'">'+cellStr+'</row>';
      if(insertPos>=0)sheetXml=sheetXml.substring(0,insertPos)+newRow+sheetXml.substring(insertPos);
      else sheetXml=sheetXml.replace('</sheetData>',newRow+'</sheetData>');
      applied.add(addr);modCount++;
    });
    console.log('Cells modified:',modCount);
    zip.file(sheetPath,sheetXml);
    toast('正在压缩打包…');
    const mimeType=S.srcExt==='xlsm'?'application/vnd.ms-excel.sheet.macroEnabled.12':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob=await zip.generateAsync({type:'blob',mimeType:mimeType,compression:'DEFLATE',compressionOptions:{level:9}});
    const ext=S.srcExt==='xlsm'?'.xlsm':'.xlsx';
    const name=S.fileName.replace(/\.(xlsx|xlsm)$/,'')+'-Check'+ext;
    const ok=await download(blob,name);
    if(!ok){toast('已取消保存 '+name);return false}
    toast('已导出 '+name+'（修改 '+modCount+' 个单元格）');
    return true;
  }catch(err){console.error('exportPatchedFile error:',err);toast('导出失败：'+err.message);return false}
}
async function doExport(){closeExport()
  const ok1=await exportPatchedFile();
  const ok2=await exportCSV();
  if(ok1&&ok2)toast('已导出修正文件及报告 CSV');
  else if(!ok1&&!ok2)toast('已取消保存');
  else toast(ok1?'已导出修正文件':'已导出报告 CSV')}
async function download(blob,name){if(window.__TAURI__&&window.__TAURI__.core&&window.__TAURI__.core.invoke){const buf=new Uint8Array(await blob.arrayBuffer());try{const ok=await window.__TAURI__.core.invoke('save_file',{name:name,data:Array.from(buf)});return ok===true;}catch(e){console.warn('Tauri save failed:',e);toast('保存失败：'+(e&&e.message?e.message:e));return false}}const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},2000);return true}
async function exportCSV(bookName){const rows=[['编号','行','列字母','列名','类型','问题描述','原值','订后值','处理方式']];const colMap={};COLS.forEach(c=>colMap[c.L]=c)
  S.issues.forEach(i=>rows.push([i.id,i.row,i.col,colMap[i.col]?colMap[i.col].cn:'',i.type,i.reason,esc(i.current),esc(i.value),i.resolved||'待批']))
  const csv='﻿'+rows.map(r=>r.map(c=>{const s=String(c==null?'':c);if(/[",\n]/.test(s))return'"'+s.replace(/"/g,'""')+'"';return s}).join(',')).join('\r\n')
  return download(new Blob([csv],{type:'text/csv;charset=utf-8'}),(bookName||S.fileName).replace(/\.xlsx?m?$/,'')+'-report.csv')}
initLoad();

/* ===== GAP 表格生成 ===== */
/* 构建 行号→{列:修订值} 的疑误修订映射；manualVal 仅当解析为对象时走多列，否则回退单列 */
function _buildIssueFixMap(){
  const fix={};
  /* 与 exportPatchedFile 同口径：清理类疑误先应用，语义修订类后覆盖 */
  const _mrk={dirty:0,whitespace:0,numstr:1};
  const sorted=S.issues.slice().sort((a,b)=>(_mrk[a.type]!==undefined?_mrk[a.type]:2)-(_mrk[b.type]!==undefined?_mrk[b.type]:2));
  for(const i of sorted){
    if(i.resolved!=='accept'&&i.resolved!=='manual')continue;
    let multi=false;
    if(i.resolved==='manual'&&i.manualVal){
      try{const f=JSON.parse(i.manualVal);if(f&&typeof f==='object'){const m=fix[i.row]||(fix[i.row]={});for(const c in f)m[c]=f[c];multi=true}}catch(e){}
    }
    if(!multi)(fix[i.row]||(fix[i.row]={}))[i.col]=i.value;
  }
  return fix;
}
/* 读取行的修订值：本行→合并首行→undefined 表示无修订；'␣'/'-' 归一为 null(空) */
function _issueFixCell(fix,row,col){
  const m=fix[row];
  if(m&&m[col]!==undefined)return m[col]==='␣'||m[col]==='-'?null:m[col];
  const mm=S.dict.mergedMap&&S.dict.mergedMap[col];
  const lead=mm&&mm[row];
  if(lead&&fix[lead]&&fix[lead][col]!==undefined){const v=fix[lead][col];return v==='␣'||v==='-'?null:v}
  return undefined;
}
function openGAP(){
  if(!S.wb.SheetNames.includes('Asset')){toast('未找到 Asset 工作表');return}
  const assetWs=S.wb.Sheets['Asset'];
  const assetRows=XLSX.utils.sheet_to_json(assetWs,{header:1,raw:1});
  /* 默认上月第一天和最后一天（或记忆上次选择） */
  const fmtLocal=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(!S.gapDateCache){
    const now=new Date();const lastMonthEnd=new Date(now.getFullYear(),now.getMonth(),0);
    const lastMonthStart=new Date(now.getFullYear(),now.getMonth()-1,1);
    S.gapDateCache={start:fmtLocal(lastMonthStart),end:fmtLocal(lastMonthEnd)}
  }
  $('#gapStartDate').value=S.gapDateCache.start;
  $('#gapEndDate').value=S.gapDateCache.end;
  /* 统计 AE Data 中每个 车间+资产 有多少条数据（应用已采纳的疑误修订） */
  const ws=S.ws,max=S.maxRow;
  const fix=_buildIssueFixMap();
  const dataCount=new Set();
  for(let r=S.dataStart;r<=max;r++){
    const wF=_issueFixCell(fix,r,'A'),aF=_issueFixCell(fix,r,'I');
    const w=wF!==undefined?wF:getMergedVal(ws,'A',r),a=aF!==undefined?aF:getMergedVal(ws,'I',r);
    if(w&&a)dataCount.add(String(w).trim()+'\x00'+String(a).trim())
  }
  /* 按车间分组 */
  const byWs={};
  for(let i=1;i<assetRows.length;i++){
    const r=assetRows[i];if(!r[0]&&!r[1])continue;
    const workshop=String(r[0]||'').trim(),asset=String(r[1]||'').trim(),filename=String(r[2]||'').trim();
    if(!filename)continue;
    if(!dataCount.has(workshop+'\x00'+asset))continue;
    if(!byWs[workshop])byWs[workshop]=[];
    byWs[workshop].push({idx:i,name:asset,filename})
  }
  const list=$('#gapAssetList');list.innerHTML='';
  Object.keys(byWs).sort().forEach(wsName=>{
    const group=document.createElement('div');group.className='gap-ws-group';
    const items=byWs[wsName];
    const allChecked=items.map(it=>it.idx).join(',');
    group.innerHTML='<label class="gap-ws-head"><input type="checkbox" class="gap-ws-check" data-indices="'+allChecked+'" checked><span>'+escXml(wsName)+'</span><span class="gap-ws-count">('+items.length+')</span></label>';
    const sub=document.createElement('div');sub.className='gap-ws-items';
    items.forEach(it=>{
      const div=document.createElement('label');div.className='gap-asset-item';
      div.innerHTML='<input type="checkbox" value="'+it.idx+'" checked><span>'+escXml(it.name+(it.filename?' ('+it.filename+')':''))+'</span>';
      sub.appendChild(div)
    });
    group.appendChild(sub);
    list.appendChild(group)
  });
  /* 车间全选/取消联动 */
  $$('.gap-ws-check').forEach(cb=>cb.addEventListener('change',e=>{
    const indices=cb.dataset.indices.split(',');
    cb.closest('.gap-ws-group').querySelectorAll('.gap-asset-item input').forEach(inp=>{
      inp.checked=cb.checked
    })
  }));
  /* 资产勾选反向联动车间全选框 */
  $$('.gap-asset-item input').forEach(cb=>cb.addEventListener('change',()=>{
    const grp=cb.closest('.gap-ws-group');
    const items=[...grp.querySelectorAll('.gap-asset-item input')];
    grp.querySelector('.gap-ws-check').checked=items.length>0&&items.every(i=>i.checked)
  }));
  $('#gapModal').classList.add('open');$('#gapModal').setAttribute('aria-hidden','false')
}
function closeGAP(){$('#gapModal').classList.remove('open');$('#gapModal').setAttribute('aria-hidden','true')}
function toExcelSerial(d){return(d.getTime()-d.getTimezoneOffset()*60000-Date.UTC(1899,11,30))/86400000}
function readTimeSerial(ws,col,row){
  const v=r2v(ws,col,row);if(v==null||v==='')return null;
  if(typeof v==='number')return v;
  if(v instanceof Date)return toExcelSerial(v);
  if(typeof v==='string')return _cellDateSerial(v);
  return null
}
function lookupProduct(map,name,colIdx){
  const e=map[String(name).trim()];if(!e)return null;return e[colIdx]||''
}
async function generateGAP(){
  const checked=$$('#gapAssetList .gap-asset-item input:checked').map(cb=>parseInt(cb.value)).filter(n=>!isNaN(n));
  if(!checked.length){toast('请至少选择一个资产');return}
  closeGAP();
  if(!S.origBuf){toast('无原始文件数据');return}
  toast('正在准备模板数据…');
  try{
    const assetWs=S.wb.Sheets['Asset'];
    const assetRows=XLSX.utils.sheet_to_json(assetWs,{header:1,raw:1});
    const sdVal=$('#gapStartDate').value,edVal=$('#gapEndDate').value;
    if(!sdVal||!edVal){toast('请设置日期范围');return}
    const startDate=new Date(sdVal+'T00:00:00'),endDate=new Date(edVal+'T00:00:00');
    if(!(startDate<=endDate)){toast('开始日期不能晚于结束日期');return}
  S.gapDateCache={start:sdVal,end:edVal};
    const startSerial=toExcelSerial(startDate),endSerial=toExcelSerial(endDate);
    /* Product lookup */
    const prodMap={};
    if(S.wb.SheetNames.includes('Product')){
      XLSX.utils.sheet_to_json(S.wb.Sheets['Product'],{header:1,raw:1}).forEach((r,i)=>{
        if(i&&r[0])prodMap[String(r[0]).trim()]={2:r[1]||'',3:r[2]||''}
      })
    }
    const nop2=lookupProduct(prodMap,'NOP',2),nop3=lookupProduct(prodMap,'NOP',3);
    /* Category lookup */
    const catMap=S.catMap||{};
    let boLookup='';
    if(S.wb.SheetNames.includes('Category')){
      XLSX.utils.sheet_to_json(S.wb.Sheets['Category'],{header:1,raw:1}).forEach((r,i)=>{
        if(!i)return;
        if(r[1]&&String(r[1]).trim()==='No dem')boLookup=r[2]||''
      })
    }
    /* AE Data cache（应用数据检查中已接受/手动修改的值） */
    const ws=S.ws,max=S.maxRow;
    const gapFix=_buildIssueFixMap();
    const fixCell=(row,col)=>_issueFixCell(gapFix,row,col);
    const serOf=v=>{if(v==null||v==='')return null;if(typeof v==='number')return v;if(v instanceof Date)return toExcelSerial(v);if(typeof v==='string'){const ds=_cellDateSerial(v);if(ds!=null)return ds}return null};
    const numFx=(row,col,raw)=>{const v=fixCell(row,col);return v!==undefined?(v==null||v===''?0:+v||0):raw};
    const strFx=(row,col,raw)=>{const v=fixCell(row,col);return v!==undefined?(v==null?'':String(v)):raw};
    const aeData=[];
    for(let r=S.dataStart;r<=max;r++){
      const wsRaw=fixCell(r,'A');const wsVal=wsRaw!==undefined?wsRaw:getMergedVal(ws,'A',r);
      const asRaw=fixCell(r,'I');const asVal=asRaw!==undefined?asRaw:getMergedVal(ws,'I',r);
      const cFx=fixCell(r,'C');const dateVal=cFx!==undefined?cFx:r2v(ws,'C',r);
      const dateSerial=serOf(dateVal);
      const nFx=fixCell(r,'N'),oFx=fixCell(r,'O'),pFx=fixCell(r,'P');
      const startSer=nFx!==undefined?serOf(nFx):readTimeSerial(ws,'N',r);
      const endSer=oFx!==undefined?serOf(oFx):readTimeSerial(ws,'O',r);
      let lossT=numFx(r,'P',r2n(ws,'P',r));
      /* N/O 被修订后原表 P 列公式(#VALUE!)读数为 0：按新起止时间重算损失时长 */
      if(pFx===undefined&&(nFx!==undefined||oFx!==undefined)&&startSer!=null&&endSer!=null&&endSer>=startSer){
        lossT=+((endSer-startSer)*24).toFixed(2);
      }
      aeData.push({
        r,workshop:wsVal?String(wsVal).trim():'',asset:asVal?String(asVal).trim():'',
        dateSerial,product:strFx(r,'H',r2s(ws,'H',r)),actual:numFx(r,'K',r2n(ws,'K',r)),
        startSerial:startSer,endSerial:endSer,
        lossTime:lossT,reason:strFx(r,'Q',r2s(ws,'Q',r)),
        sl:numFx(r,'V',r2n(ws,'V',r)),ul:numFx(r,'W',r2n(ws,'W',r)),bo:numFx(r,'X',r2n(ws,'X',r)),
        individual:strFx(r,'AA',r2s(ws,'AA',r))
      })
    }
    const timeStamp=formatTimeStamp(new Date());
    let count=0;
    /* setXmlCell: replace cell value in sheet XML while preserving style (s attribute)；目标单元格不存在时计数告警 */
    var strMap={},allStrs=[],ssOrigCount=0,setXmlMisses=0;
    function setXmlCell(xml,addr,val,isNum){
      const re=new RegExp('<c r="'+addr+'"([^>]*)/>|<c r="'+addr+'"([^>]*)>.*?</c>','g');
      const m=re.exec(xml);
      if(!m){setXmlMisses++;console.warn('setXmlCell: 未找到单元格 '+addr);return xml}
      const attrs=(m[1]||m[2]||'');
      const sMatch=attrs.match(/s="(\d+)"/);
      const sAttr=sMatch?' s="'+sMatch[1]+'"':'';
      let rep;
      if(val==null||val===''){
        rep='<c r="'+addr+'"'+sAttr+'/>';
      }else if(isNum){
        rep='<c r="'+addr+'"'+sAttr+'><v>'+val+'</v></c>';
      }else{
        var str=String(val);
        var idx;
        if(strMap[str]!=null){idx=strMap[str]}else{idx=ssOrigCount+allStrs.length;strMap[str]=idx;allStrs.push(str)}
        rep='<c r="'+addr+'"'+sAttr+' t="s"><v>'+idx+'</v></c>';
      }
      return xml.substring(0,m.index)+rep+xml.substring(m.index+m[0].length);
    }
    function colToNum(col){var n=0;for(var i=0;i<col.length;i++)n=n*26+(col.charCodeAt(i)-64);return n}
    function prepareSheetXml(xml,firstDataRow,neededRows,maxCol,rowSpans){
      const sdMatch=xml.match(/<sheetData>([\s\S]*?)<\/sheetData>/);
      if(!sdMatch)return xml;
      const rowRe=/<row\b[^>]*>[\s\S]*?<\/row>|<row\b[^>]*\/>/g;
      const rows=sdMatch[1].match(rowRe)||[];
      let headerRows=[],templateRow=null;
      for(const row of rows){
        const rM=row.match(/r="(\d+)"/);const r=rM?parseInt(rM[1]):0;
        if(r<firstDataRow)headerRows.push(row);
        else if(r===firstDataRow)templateRow=row;
      }
      if(!templateRow)return xml;
      var maxDataNum=colToNum(maxCol||'H');
      var spansAttr=rowSpans||'1:186';
      const dataRows=[];
      for(let i=0;i<neededRows;i++){
        const tr=firstDataRow+i;
        let cloned=templateRow.replace(/r="\d+"/,'r="'+tr+'"');
        cloned=cloned.replace(/r="([A-Z]+)\d+"/g,(m,col)=>'r="'+col+tr+'"');
        cloned=cloned.replace(/<c r="([^"]*)"([^>]*)>(?:[\s\S]*?<\/c>)?/g,(m,addr,attrs)=>{
          const sM=attrs.match(/s="(\d+)"/);return'<c r="'+addr+'"'+(sM?' s="'+sM[1]+'"':'')+'/>';
        });
        var cellRe=/<c r="([A-Z]+)\d+"[^>]*\/>/g,cm,lastKeptEnd=0;
        while((cm=cellRe.exec(cloned))!==null){
          var cn=colToNum(cm[1]);
          if(cn<=maxDataNum)lastKeptEnd=cm.index+cm[0].length;
          else break;
        }
        if(lastKeptEnd>0){
          var rowEnd=cloned.lastIndexOf('</row>');
          cloned=cloned.substring(0,lastKeptEnd)+cloned.substring(rowEnd);
        }
        if(i>0){
          cloned=cloned.replace(/ customFormat="1"/,'');
        }
        cloned=cloned.replace(/spans="\d+:\d+"/,'spans="'+spansAttr+'"');
        if(!/x14ac:dyDescent=/.test(cloned)){
          cloned=cloned.replace(/<row r="(\d+)"/,'<row r="$1" x14ac:dyDescent="0.25"');
        }
        dataRows.push(cloned);
      }
      const lastRow=Math.max(firstDataRow+neededRows-1,firstDataRow);
      let result=xml.replace(/<sheetData>[\s\S]*?<\/sheetData>/,'<sheetData>'+headerRows.join('')+dataRows.join('')+'</sheetData>');
      result=result.replace(/<dimension ref="([A-Z]+)\d+:([A-Z]+)\d+"/,(m,c1,c2)=>'<dimension ref="'+c1+'1:'+c2+lastRow+'"');
      return result;
    }
    /* Pre-read template sheet XMLs that need modification or relocation */
    toast('正在加载模板XML…');
    const tplZip=await JSZip.loadAsync(S.origBuf);
    /* GAP 生成依赖模板固定结构：先校验必需部件，避免静默产出残缺文件 */
    const needParts=['xl/worksheets/sheet5.xml','xl/worksheets/sheet6.xml','xl/worksheets/sheet7.xml','xl/worksheets/sheet8.xml','xl/worksheets/sheet9.xml','xl/sharedStrings.xml'];
    for(const p of needParts){if(!tplZip.file(p)){toast('模板缺少 '+p+'，无法生成 GAP 文件');return}}
    const tplSheet5=await tplZip.file('xl/worksheets/sheet5.xml').async('string');
    const tplSheet6=await tplZip.file('xl/worksheets/sheet6.xml').async('string');
    const tplSheet7=await tplZip.file('xl/worksheets/sheet7.xml').async('string');
    const tplSheet8=await tplZip.file('xl/worksheets/sheet8.xml').async('string');
    const tplSheet9=await tplZip.file('xl/worksheets/sheet9.xml').async('string');
    const tplShared=await tplZip.file('xl/sharedStrings.xml').async('string');
    /* Parse original sharedStrings entries */
    var origSiRe=/<si>([\s\S]*?)<\/si>/g,origStrs=[],sM;
    while((sM=origSiRe.exec(tplShared))!==null){origStrs.push(sM[1])}
    ssOrigCount=origStrs.length;
    /* Remap template style indices to correct file style indices using GAP_STYLE_MAP */
    function remapSheetStyles(xml){
      return xml.replace(/s="(\d+)"/g,function(m,idx){
        var ni=GAP_STYLE_MAP[parseInt(idx)];
        return ni!=null?'s="'+ni+'"':m;
      }).replace(/style="(\d+)"/g,function(m,idx){
        var ni=GAP_COL_STYLE_MAP[parseInt(idx)];
        if(ni!=null)return'style="'+ni+'"';
        ni=GAP_STYLE_MAP[parseInt(idx)];
        return ni!=null?'style="'+ni+'"':m;
      });
    }
    /* Build remapping: scan a sheet XML for t="s" indices, remap to new compact indices */
    function rebuildSharedStrings(sheetXmls){
      var usedSet=new Set(),idxMap={};
      sheetXmls.forEach(function(xml){
        var re=/t="s"><v>(\d+)<\/v>/g,m;
        while((m=re.exec(xml))!==null){usedSet.add(parseInt(m[1]))}
      });
      /* Also include strings set via setXmlCell (already in allStrs with their own indices) */
      /* Build new sharedStrings: first the used original strings (remapped), then new strings */
      var newEntries=[],newIdx=0;
      usedSet.forEach(function(oldIdx){
        if(oldIdx<origStrs.length){
          idxMap[oldIdx]=newIdx++;
          newEntries.push('<si>'+origStrs[oldIdx]+'</si>');
        }
      });
      /* Add new strings from setXmlCell */
      allStrs.forEach(function(s,i){
        var origIdx=strMap[s];
        if(origIdx>=origStrs.length){
          idxMap[origIdx]=newIdx++;
          newEntries.push('<si><t>'+escapeXml(s)+'</t></si>');
        }
      });
      /* Remap indices in all sheets */
      var remapped=sheetXmls.map(function(xml){
        return xml.replace(/t="s"><v>(\d+)<\/v>/g,function(m,idx){
          var ni=idxMap[parseInt(idx)];
          return ni!=null?'t="s"><v>'+ni+'</v>':m;
        });
      });
      var sstXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="'+newIdx+'" uniqueCount="'+newIdx+'">'+newEntries.join('')+'</sst>';
      return {sheets:remapped,sst:sstXml};
    }
    const dlZip=new JSZip();
    const total=checked.length;
    for(let ci=0;ci<total;ci++){const assetIdx=checked[ci];
      const ar=assetRows[assetIdx];if(!ar)continue;
      const workshop=String(ar[0]||'').trim(),asset=String(ar[1]||'').trim();
      const filename=String(ar[2]||'').trim(),config=String(ar[3]||'');
      if(!filename)continue;
      const batchName=String(ar[4]||'').replace(/_/g,' '),sheetName=String(ar[5]||'Production');
      strMap={};allStrs=[];
      /* Modify Production sheet XML */
      const numDays=Math.round((endDate-startDate)/86400000)+1;
      let prodXml=prepareSheetXml(tplSheet5,7,numDays,'H','1:186');
      prodXml=setXmlCell(prodXml,'B3',filename,false);
      prodXml=setXmlCell(prodXml,'B4',config,false);
      let prodRow=7;
      const prodData=[];
      for(let d=new Date(startDate);d<=endDate;d.setDate(d.getDate()+1)){
        const dateSer=toExcelSerial(d);
        const dateStr=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
        let actualSum=0,productSet=false,prodName=nop2,prodCode=nop3;
        for(const ae of aeData){
          if(ae.workshop===workshop&&ae.asset===asset&&ae.dateSerial!=null&&Math.abs(ae.dateSerial-dateSer)<0.5&&ae.product){
            if(!productSet){
              const p2=lookupProduct(prodMap,ae.product,2),p3=lookupProduct(prodMap,ae.product,3);
              if(p2)prodName=p2;if(p3)prodCode=p3;productSet=true
            }
            actualSum+=ae.actual
          }
        }
        if(actualSum===0){prodName=nop2;prodCode=nop3}
        const startDT=dateSer+8/24,endDT=dateSer+1+8/24;
        prodXml=setXmlCell(prodXml,'A'+prodRow,batchName+' '+dateStr,false);
        prodXml=setXmlCell(prodXml,'B'+prodRow,prodName||'',false);
        prodXml=setXmlCell(prodXml,'C'+prodRow,prodCode||'',false);
        prodXml=setXmlCell(prodXml,'D'+prodRow,'KG',false);
        prodXml=setXmlCell(prodXml,'F'+prodRow,startDT,true);
        prodXml=setXmlCell(prodXml,'G'+prodRow,endDT,true);
        prodXml=setXmlCell(prodXml,'H'+prodRow,actualSum,true);
        prodData.push({row:prodRow,startDT,endDT,prodName});
        prodRow++
      }
      /* Collect loss entries first to know row count */
      const lossEntries=[];
      const lossByProdRow={};
      const wStart=startSerial+8/24,wEnd=endSerial+1+8/24;
      for(const ae of aeData){
        if(ae.workshop!==workshop||ae.asset!==asset)continue;
        if(ae.lossTime<=0)continue;
        if(ae.startSerial==null||ae.endSerial==null)continue;
        /* 与导出窗口完全不重叠才丢弃；部分越界的损失按窗口截断而非整条丢失 */
        if(ae.endSerial<=wStart||ae.startSerial>=wEnd)continue;
        const st=Math.max(ae.startSerial,wStart),en=Math.min(ae.endSerial,wEnd);
        const adj=(st===ae.startSerial&&en===ae.endSerial)?ae:Object.assign({},ae,{startSerial:st,endSerial:en,lossTime:+(Math.max(0,en-st)*24).toFixed(2)});
        let prodR=0;
        for(const pd of prodData){if(st>=pd.startDT-1/86400&&st<pd.endDT){prodR=pd.row;break}}
        lossEntries.push({prodR,ae:adj});
        lossByProdRow[prodR]=true;
      }
      for(const pd of prodData){
        if(pd.prodName!=='NOP')continue;
        if(lossByProdRow[pd.row])continue;
        lossEntries.push({prodR:pd.row,nop:true,pd});
      }
      /* Modify Loss Details sheet XML */
      let lossXml=prepareSheetXml(tplSheet6,2,Math.max(lossEntries.length,1),'R','1:18');
      let lossRow=2;
      for(const entry of lossEntries){
        if(entry.nop){
          lossXml=setXmlCell(lossXml,'A'+lossRow,entry.prodR,true);
          lossXml=setXmlCell(lossXml,'B'+lossRow,'ATL',false);
          lossXml=setXmlCell(lossXml,'C'+lossRow,'BO',false);
          lossXml=setXmlCell(lossXml,'D'+lossRow,'No dem',false);
          lossXml=setXmlCell(lossXml,'E'+lossRow,boLookup,false);
          lossXml=setXmlCell(lossXml,'F'+lossRow,boLookup,false);
          lossXml=setXmlCell(lossXml,'G'+lossRow,entry.pd.startDT,true);
          lossXml=setXmlCell(lossXml,'H'+lossRow,entry.pd.endDT,true);
          lossXml=setXmlCell(lossXml,'I'+lossRow,(entry.pd.endDT-entry.pd.startDT),true);
        }else{
          const ae=entry.ae;
          lossXml=setXmlCell(lossXml,'A'+lossRow,entry.prodR,true);
          lossXml=setXmlCell(lossXml,'B'+lossRow,'ATL',false);
          if(ae.individual){
            const cat=catMap[String(ae.individual).trim()];
            if(cat){
              lossXml=setXmlCell(lossXml,'C'+lossRow,cat.main||'',false);
              lossXml=setXmlCell(lossXml,'D'+lossRow,cat.sub||'',false);
            }
            lossXml=setXmlCell(lossXml,'E'+lossRow,ae.individual,false);
            lossXml=setXmlCell(lossXml,'F'+lossRow,ae.individual,false)
          }else if(ae.bo===ae.lossTime){
            lossXml=setXmlCell(lossXml,'C'+lossRow,'BO',false);
            lossXml=setXmlCell(lossXml,'D'+lossRow,'No dem',false);
            lossXml=setXmlCell(lossXml,'E'+lossRow,boLookup,false);
            lossXml=setXmlCell(lossXml,'F'+lossRow,boLookup,false)
          }
          lossXml=setXmlCell(lossXml,'G'+lossRow,ae.startSerial,true);
          lossXml=setXmlCell(lossXml,'H'+lossRow,ae.endSerial,true);
          lossXml=setXmlCell(lossXml,'I'+lossRow,ae.lossTime/24,true);
          lossXml=setXmlCell(lossXml,'M'+lossRow,ae.reason||'',false);
        }
        lossRow++
      }
      /* Rebuild sharedStrings: minimal set with only used strings, remap indices */
      var rbResult=rebuildSharedStrings([prodXml,lossXml,tplSheet7,tplSheet8,tplSheet9]);
      prodXml=rbResult.sheets[0];lossXml=rbResult.sheets[1];
      var sheet3Xml=rbResult.sheets[2],sheet4Xml=rbResult.sheets[3],sheet5Xml=rbResult.sheets[4];
      var updatedSS=rbResult.sst;
      /* Remap style indices from template to correct file's style table */
      prodXml=remapSheetStyles(prodXml);lossXml=remapSheetStyles(lossXml);
      sheet3Xml=remapSheetStyles(sheet3Xml);sheet4Xml=remapSheetStyles(sheet4Xml);sheet5Xml=remapSheetStyles(sheet5Xml);
      /* Build new xlsx zip from scratch with only needed files */
      const outZip=new JSZip();
      outZip.file('[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
        '<Default Extension="xml" ContentType="application/xml"/>'+
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
        '<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
        '<Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
        '<Override PartName="/xl/worksheets/sheet5.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
        '<Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'+
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
        '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'+
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'+
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'+
        '</Types>');
      outZip.file('_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'+
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'+
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'+
        '</Relationships>');
      outZip.file('xl/workbook.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '+
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
        '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="20000" windowHeight="10000" activeTab="0"/></bookViews>'+
        '<sheets>'+
        '<sheet name="'+escXml(sheetName)+'" sheetId="1" r:id="rId1"/>'+
        '<sheet name="Loss Details" sheetId="2" r:id="rId2"/>'+
        '<sheet name="Multi Product PS" sheetId="3" r:id="rId3"/>'+
        '<sheet name="MEW Data" sheetId="4" r:id="rId4"/>'+
        '<sheet name="MEW Loss Data" sheetId="5" r:id="rId5"/>'+
        '</sheets>'+
        '<definedNames>'+
        '<definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'+"'"+escXml(sheetName)+"'!$A$6:$H$6"+'</definedName>'+
        '<definedName name="_xlnm._FilterDatabase" localSheetId="1" hidden="1">'+"'Loss Details'!$A$1:$R$1"+'</definedName>'+
        '<definedName name="_xlnm._FilterDatabase" localSheetId="2" hidden="1">'+"'Multi Product PS'!$A$1:$G$1"+'</definedName>'+
        '<definedName name="_xlnm._FilterDatabase" localSheetId="3" hidden="1">'+"'MEW Data'!$A$1:$F$1"+'</definedName>'+
        '<definedName name="_xlnm._FilterDatabase" localSheetId="4" hidden="1">'+"'MEW Loss Data'!$A$1:$I$1"+'</definedName>'+
        '<definedName name="TemplateVersion" comment="The version number of the template. Do not Change!" hidden="1">"1.2"</definedName>'+
        '</definedNames></workbook>');
      outZip.file('xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'+
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>'+
        '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>'+
        '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet5.xml"/>'+
        '<Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>'+
        '<Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+
        '<Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'+
        '</Relationships>');
      outZip.file('xl/worksheets/sheet1.xml',prodXml);
      outZip.file('xl/worksheets/sheet2.xml',lossXml);
      outZip.file('xl/worksheets/sheet3.xml',sheet3Xml);
      outZip.file('xl/worksheets/sheet4.xml',sheet4Xml);
      outZip.file('xl/worksheets/sheet5.xml',sheet5Xml);
      outZip.file('xl/styles.xml',GAP_STYLES);
      outZip.file('xl/theme/theme1.xml',GAP_THEME);
      outZip.file('xl/sharedStrings.xml',updatedSS);
      outZip.file('docProps/core.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>AE Data Analysis</dc:creator><cp:lastModifiedBy>AE Data Analysis</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">'+new Date().toISOString()+'</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">'+new Date().toISOString()+'</dcterms:modified></cp:coreProperties>');
      outZip.file('docProps/app.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>AE Data Analysis</Application></Properties>');
      toast('正在生成 '+filename+' ('+(ci+1)+'/'+total+')…');
      const blob=await outZip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',compression:'DEFLATE',compressionOptions:{level:9}});
      /* 不同资产配置相同 filename 时 ZIP 内同名会互相覆盖，自动加序号去重 */
      let zipName=filename+'_'+timeStamp+'.xlsx';
      for(let zi=2;dlZip.file(zipName);zi++)zipName=filename+'_'+timeStamp+'_'+zi+'.xlsx';
      dlZip.file(zipName,blob);
      count++
    }
    toast('正在打包ZIP文件…');
    const dlBlob=await dlZip.generateAsync({type:'blob',mimeType:'application/zip',compression:'DEFLATE',compressionOptions:{level:9}});
    const dlOk=await download(dlBlob,'GAP_'+timeStamp+'.zip');
    /* 统计影响GAP文件内容的疑误 */
    const gapCols=new Set(['A','C','H','I','K','N','O','P','Q','X','AA']);
    const colNames={'A':'车间','C':'日期','H':'产品','I':'资产','K':'实际产量','N':'开始时间','O':'结束时间','P':'损失时间','Q':'原因','X':'BO','AA':'AE分类'};
    const selectedAssets=new Set();
    for(const assetIdx of checked){const ar=assetRows[assetIdx];if(!ar)continue;selectedAssets.add(String(ar[0]||'').trim()+'\x00'+String(ar[1]||'').trim())}
    const gapIssues=[];
    for(const i of S.issues){
      if(i.resolved==='accept'||i.resolved==='manual'||i.resolved==='ignore')continue;
      if(!isCounted(i))continue;
      if(!gapCols.has(i.col))continue;
      /* 与上方 aeData 口径一致：按已应用修订后的车间/资产/日期判断归属 */
      const wFx=fixCell(i.row,'A'),aFx=fixCell(i.row,'I');
      const ws=wFx!==undefined?wFx:getMergedVal(S.ws,'A',i.row),as=aFx!==undefined?aFx:getMergedVal(S.ws,'I',i.row);
      if(!selectedAssets.has(String(ws||'').trim()+'\x00'+String(as||'').trim()))continue;
      const cFx=fixCell(i.row,'C');
      const dv=cFx!==undefined?cFx:r2v(S.ws,'C',i.row);
      const dSer=serOf(dv);
      if(dSer==null||dSer<startSerial-0.5||dSer>endSerial+0.5)continue;
      gapIssues.push(i)
    }
    /* 按列+类型分组统计 */
    const groups={};
    for(const i of gapIssues){
      const key=i.col+'\x00'+i.type;
      if(!groups[key])groups[key]={col:i.col,type:i.type,reason:i.reason,count:0};
      groups[key].count++
    }
    const sortedKeys=Object.keys(groups).sort((a,b)=>{
      const ca=groups[a].col,cb=groups[b].col;
      if(ca!==cb)return COLS.findIndex(c=>c.L===ca)-COLS.findIndex(c=>c.L===cb);
      return groups[b].count-groups[a].count
    });
    let reportHtml='<table style="width:100%;border-collapse:collapse;font-size:.9rem">';
    reportHtml+='<thead><tr style="border-bottom:2px solid var(--ink)"><th style="text-align:left;padding:.3rem .4rem">列</th><th style="text-align:left;padding:.3rem .4rem">类型</th><th style="text-align:left;padding:.3rem .4rem">说明</th><th style="text-align:right;padding:.3rem .4rem">数量</th></tr></thead><tbody>';
    for(const key of sortedKeys){
      const g=groups[key];
      reportHtml+='<tr style="border-bottom:1px dashed var(--rule-soft)"><td style="padding:.3rem .4rem">'+escXml(g.col+' '+colNames[g.col])+'</td><td style="padding:.3rem .4rem">'+escXml(g.type)+'</td><td style="padding:.3rem .4rem;color:var(--ink-soft)">'+escXml(g.reason)+'</td><td style="text-align:right;padding:.3rem .4rem;font-weight:700;color:var(--vermillion)">'+g.count+'</td></tr>'
    }
    reportHtml+='</tbody></table>';
    $('#gapReportSummary').textContent='共 '+gapIssues.length+' 处未处理疑误影响 '+count+' 个GAP文件的内容：';
    $('#gapReportBody').innerHTML=reportHtml;
    $('#gapReportModal').classList.add('open');
    $('#gapReportModal').setAttribute('aria-hidden','false');
    toast(dlOk?('已生成 '+count+' 个GAP文件，已打包ZIP下载'+(setXmlMisses?'（'+setXmlMisses+' 处单元格未命中模板，详见控制台）':'')):'已取消保存 GAP ZIP')
  }catch(err){console.error('generateGAP error:',err);toast('生成失败：'+err.message)}
}
function formatTimeStamp(d){const p=n=>String(n).padStart(2,'0');return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes())}