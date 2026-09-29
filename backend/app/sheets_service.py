import csv
import io
import re
import requests
import openpyxl
from typing import List, Dict, Any, Tuple
from app.parser import extract_skills_from_text

def parse_spreadsheet_csv(csv_text: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    CSVテキストから人材一覧または案件一覧をパース。
    ヘッダーから人材用か案件用かを自動判別。
    """
    reader = csv.reader(io.StringIO(csv_text.strip()))
    rows = list(reader)
    if not rows or len(rows) < 2:
        return [], "unknown"

    header = [h.strip() for h in rows[0]]
    header_lower = [h.lower() for h in header]
    
    # Check if engineer sheet or project sheet
    is_engineer = any(k in "".join(header_lower) for k in ["人材", "技術者", "要員", "エンジニア", "氏名", "名前", "イニシャル", "経歴"])
    is_project = any(k in "".join(header_lower) for k in ["案件", "募集", "求人", "必須スキル", "案件名", "単価"])
    
    sheet_type = "engineer" if is_engineer or not is_project else "project"
    
    items = []
    
    for row in rows[1:]:
        if not row or not any(row):
            continue
        row_dict = {}
        for idx, col in enumerate(header):
            val = row[idx].strip() if idx < len(row) else ""
            row_dict[col] = val

        if sheet_type == "engineer":
            items.append(_extract_engineer_from_row(row_dict))
        else:
            items.append(_extract_project_from_row(row_dict))

    return items, sheet_type

def parse_spreadsheet_excel(file_bytes: bytes) -> Tuple[List[Dict[str, Any]], str]:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    sheet = wb.active
    rows = []
    for row in sheet.iter_rows(values_only=True):
        if any(row):
            rows.append([str(c).strip() if c is not None else "" for c in row])
            
    if not rows or len(rows) < 2:
        return [], "unknown"
        
    csv_buf = io.StringIO()
    writer = csv.writer(csv_buf)
    writer.writerows(rows)
    return parse_spreadsheet_csv(csv_buf.getvalue())

def import_from_google_sheet_url(url: str) -> Tuple[List[Dict[str, Any]], str]:
    # Extract spreadsheet id
    match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
    if not match:
        raise ValueError("無効なGoogleスプレッドシートのURLです。")
    sheet_id = match.group(1)
    
    # Check if gid is present
    gid_match = re.search(r'[#&]gid=([0-9]+)', url)
    gid_param = f"&gid={gid_match.group(1)}" if gid_match else ""
    
    export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv{gid_param}"
    
    res = requests.get(export_url, timeout=10)
    if res.status_code != 200:
        raise ValueError(f"スプレッドシートの取得に失敗しました (ステータス: {res.status_code})。共有設定が「リンクを知っている全員」になっているか確認してください。")
    
    return parse_spreadsheet_csv(res.text)

def _find_val(row: Dict[str, str], candidates: List[str], default: str = "") -> str:
    for k, v in row.items():
        for cand in candidates:
            if cand in k.lower():
                return v
    return default

def _extract_engineer_from_row(row: Dict[str, str]) -> Dict[str, Any]:
    name = _find_val(row, ["氏名", "名前", "イニシャル", "技術者", "要員"], "候補技術者")
    title = _find_val(row, ["職種", "役割", "ポジション", "タイトル"], "エンジニア")
    skills_raw = _find_val(row, ["スキル", "言語", "技術", "経験スキル"], "")
    skills = extract_skills_from_text(skills_raw)
    if not skills and skills_raw:
        skills = [s.strip() for s in re.split(r'[,/、\s]+', skills_raw) if s.strip()]
        
    rate_raw = _find_val(row, ["単価", "希望単価", "金額", "月額"], "70")
    m = re.search(r'(\d{2,3})', rate_raw)
    min_rate = int(m.group(1)) if m else 70

    station = _find_val(row, ["最寄", "駅", "居住地", "場所"], "都内")
    remote = _find_val(row, ["リモート", "稼働形態", "勤務形態"], "リモート可")
    avail = _find_val(row, ["稼働時期", "開始時期", "入場", "時期"], "即日")
    exp_raw = _find_val(row, ["経験年数", "年数", "歴"], "5")
    m_exp = re.search(r'(\d+(?:\.\d+)?)', exp_raw)
    years = float(m_exp.group(1)) if m_exp else 5.0
    
    resume_text = _find_val(row, ["経歴書", "経歴", "職務経歴", "詳細", "備考"], "")
    
    return {
        "name": name,
        "title": title,
        "skills": skills,
        "nearest_station": station,
        "remote_pref": remote,
        "available_from": avail,
        "min_rate": min_rate,
        "max_rate": min_rate + 10,
        "experience_years": years,
        "notes": resume_text,
        "resume_text": resume_text,
        "source": "spreadsheet"
    }

def _extract_project_from_row(row: Dict[str, str]) -> Dict[str, Any]:
    title = _find_val(row, ["案件名", "タイトル", "募集", "業務内容", "案件"], "SES開発案件")
    client = _find_val(row, ["会社", "企業", "顧客", "クライアント", "元請"], "パートナー企業")
    skills_raw = _find_val(row, ["必須スキル", "スキル", "必須要件", "言語"], "")
    skills = extract_skills_from_text(skills_raw)
    if not skills and skills_raw:
        skills = [s.strip() for s in re.split(r'[,/、\s]+', skills_raw) if s.strip()]
        
    pref_raw = _find_val(row, ["尚可スキル", "尚可要件", "歓迎スキル"], "")
    pref_skills = extract_skills_from_text(pref_raw)

    rate_raw = _find_val(row, ["単価", "予算", "金額", "報酬"], "80")
    m = re.findall(r'(\d{2,3})', rate_raw)
    if len(m) >= 2:
        min_rate = int(m[0])
        max_rate = int(m[1])
    elif len(m) == 1:
        max_rate = int(m[0])
        min_rate = max_rate - 10
    else:
        min_rate, max_rate = 65, 80

    loc = _find_val(row, ["勤務地", "場所", "最寄り", "最寄駅"], "都内")
    remote = _find_val(row, ["リモート", "稼働形態", "テレワーク"], "リモート併用")
    start_date = _find_val(row, ["開始時期", "稼働時期", "期間", "時期"], "即日")
    terms = _find_val(row, ["精算", "精算幅", "基準時間"], "140h-180h")

    return {
        "title": title,
        "client_company": client,
        "required_skills": skills,
        "preferred_skills": pref_skills,
        "location": loc,
        "remote_pref": remote,
        "start_date": start_date,
        "min_rate": min_rate,
        "max_rate": max_rate,
        "payment_terms": terms,
        "source": "spreadsheet"
    }
