import re
import io
from typing import Dict, Any, List, Tuple
from pypdf import PdfReader
from docx import Document

TECH_KEYWORDS = [
    "Java", "Spring Boot", "Spring", "Kotlin", "Scala",
    "Python", "Django", "FastAPI", "Flask", "Pandas", "PyTorch",
    "JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Node.js",
    "Go", "Golang", "Rust", "C#", ".NET", "C++", "C言語", "PHP", "Laravel", "Ruby", "Ruby on Rails",
    "Swift", "Flutter", "iOS", "Android",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible", "Linux",
    "MySQL", "PostgreSQL", "Oracle", "SQL Server", "MongoDB", "Redis",
    "GraphQL", "REST API", "Microservices", "CI/CD", "GitHub Actions",
    "Salesforce", "SAP", "ServiceNow"
]

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([p.text for p in doc.paragraphs if p.text])
        return text.strip()
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        return ""

def extract_skills_from_text(text: str) -> List[str]:
    found = []
    text_lower = text.lower()
    for kw in TECH_KEYWORDS:
        pattern = r'(?i)(?:\b|_)' + re.escape(kw.lower()) + r'(?:\b|_|\s|[0-9]|$)'
        if kw.lower() in ["c#", "c++", ".net"]:
            pattern = re.escape(kw.lower())
        if re.search(pattern, text_lower):
            if kw not in found:
                found.append(kw)
    return found

def classify_email(subject: str, body: str) -> str:
    text = f"{subject}\n{body}"
    if re.search(r'【(?:案件|案件情報|業務内容|求人|募集)】', subject):
        return "project"
    if re.search(r'【(?:要員|人材|技術者|エンジニア|ご提案|要員情報)】', subject):
        return "engineer"
    
    project_score = len(re.findall(r'(?:案件名|募集職種|必須スキル|尚可スキル|精算幅|募集人数|勤務地|単価|精算)', text))
    engineer_score = len(re.findall(r'(?:イニシャル|氏名|最寄駅|稼働時期|希望単価|スキル要約|経歴要約|業務経歴|年齢|性別)', text))
    
    if project_score > engineer_score and project_score >= 2:
        return "project"
    elif engineer_score > project_score and engineer_score >= 2:
        return "engineer"
    
    if "案件" in subject or "募集" in subject:
        return "project"
    if "人材" in subject or "要員" in subject or "提案" in subject:
        return "engineer"
        
    return "project" if project_score >= engineer_score else "engineer"

def parse_project_text(subject: str, body: str) -> Dict[str, Any]:
    text = f"{subject}\n{body}"
    
    title = ""
    # Check for 【案件名】... or 【案件】...
    m = re.search(r'【(?:案件名|案件)】\s*[:：]?\s*([^\n\r]+)', text)
    if m:
        title = m.group(1).strip()
    elif "■ 案件名：" in text or "■ 案件：" in text:
        m = re.search(r'■\s*案件(?:名)?[:：]\s*([^\n\r]+)', text)
        if m:
            title = m.group(1).strip()
    else:
        # Clean subject
        cleaned = re.sub(r'^[ReFwd:\s\[\]【】\s]*(?:案件|案件情報|急募)?\s*[:：】\]]?\s*', '', subject).strip()
        title = cleaned if cleaned else "システム開発案件"

    skills = extract_skills_from_text(text)
    
    remote_pref = "リモート併用"
    if re.search(r'フルリモート|完全リモート|完全在宅|テレワークのみ', text):
        remote_pref = "フルリモート"
    elif re.search(r'出社\s*(?:中心|メイン)|常駐', text):
        remote_pref = "常駐/オンサイト"
    elif re.search(r'週([1-4])日(?:リモート|出社)', text):
        m_r = re.search(r'週([1-4])日(?:リモート|出社)', text)
        remote_pref = f"週{m_r.group(1)}日リモート/出社"

    location = "都内（リモート可）"
    loc_match = re.search(r'(?:勤務地|場所|最寄駅)[:：\s]*([^\n\r]+)', text)
    if loc_match:
        location = loc_match.group(1).strip()
        location = re.sub(r'[\(（].*?[\)）]', '', location).strip()

    min_rate, max_rate = None, None
    rate_matches = re.findall(r'(\d{2,3})\s*(?:万|万円)?\s*[〜~～\-－]\s*(\d{2,3})\s*万', text)
    if rate_matches:
        try:
            min_rate = int(rate_matches[0][0])
            max_rate = int(rate_matches[0][1])
        except Exception:
            pass
    else:
        single_rate = re.findall(r'(?:単価|予算|精算)[:：\s]*.*?(\d{2,3})\s*万', text)
        if single_rate:
            try:
                max_rate = int(single_rate[0])
                min_rate = max_rate - 10
            except Exception:
                pass

    start_date = "即日"
    date_match = re.search(r'(?:稼働時期|開始時期|期間)[:：\s]*([^\n\r]+)', text)
    if date_match:
        start_date = date_match.group(1).strip()
    elif re.search(r'即日', text):
        start_date = "即日"
    elif re.search(r'(\d{1,2}月[〜~～初旬中旬下旬]*)', text):
        m_d = re.search(r'(\d{1,2}月[〜~～初旬中旬下旬]*)', text)
        start_date = m_d.group(1)

    payment_terms = "140h-180h"
    pay_match = re.search(r'(\d{2,3}[hH時間]?\s*[-〜~]\s*\d{2,3}[hH時間]?)', text)
    if pay_match:
        payment_terms = pay_match.group(1)

    return {
        "title": title[:100],
        "required_skills": skills[:6],
        "preferred_skills": skills[6:10] if len(skills) > 6 else [],
        "location": location[:50],
        "remote_pref": remote_pref,
        "start_date": start_date[:30],
        "min_rate": min_rate or 65,
        "max_rate": max_rate or 80,
        "payment_terms": payment_terms,
        "raw_text": body
    }

def parse_engineer_text(subject: str, body: str) -> Dict[str, Any]:
    text = f"{subject}\n{body}"
    
    name = ""
    # Check for 【イニシャル】: K.Y or 【技術者名】: Y.T or ■ 氏名：H.N
    name_patterns = [
        r'(?:【(?:イニシャル|氏名|名前|技術者名|要員名)】|■\s*(?:イニシャル|氏名|名前|技術者名))\s*[:：]?\s*([A-Za-z\.\s]+|[^\n\r\s\(\)（）]{2,8})',
        r'(?:イニシャル|氏名|技術者名)[:：\s]+([A-Za-z\.\s]+|[^\n\r\s\(\)（）]{2,8})',
        r'【(?:要員|人材|技術者)】\s*([A-Za-z\.\s]+|[^\s\(\)（）\n\r]{2,8})'
    ]
    for p in name_patterns:
        m = re.search(p, text)
        if m:
            candidate = m.group(1).strip()
            # filter out false positives
            if candidate and not any(bad in candidate for bad in ["情報", "お送り", "提案", "各位", "技術", "様"]):
                name = candidate
                break

    if not name:
        # Extract initial-like string e.g. T.K or K.Y or 山田
        m_init = re.search(r'([A-Z]\.[A-Z]\b)', text)
        if m_init:
            name = m_init.group(1)
        else:
            name = "技術者候補"

    age = None
    age_match = re.search(r'(\d{2})\s*(?:歳|代)', text)
    if age_match:
        try:
            age = int(age_match.group(1))
        except Exception:
            pass

    skills = extract_skills_from_text(text)
    
    title = "フルスタックエンジニア"
    if skills:
        top_skill = skills[0]
        if top_skill in ["Java", "Spring Boot", "Kotlin"]:
            title = f"{top_skill} バックエンドエンジニア"
        elif top_skill in ["Python", "Django", "FastAPI"]:
            title = f"{top_skill} / データ基盤エンジニア"
        elif top_skill in ["React", "TypeScript", "Vue.js", "Next.js"]:
            title = f"{top_skill} フロントエンドエンジニア"
        elif top_skill in ["AWS", "GCP", "Kubernetes", "Terraform"]:
            title = f"{top_skill} クラウドインフラ/SREエンジニア"
        elif top_skill in ["Go", "Golang"]:
            title = f"{top_skill} サーバーサイドエンジニア"
        elif top_skill in ["PHP", "Laravel"]:
            title = f"{top_skill} Webアプリケーションエンジニア"

    nearest_station = "都内近郊"
    station_match = re.search(r'(?:【最寄駅】|■\s*最寄駅|最寄駅|居住地|最寄り)[:：\s]*([^\n\r]+)', text)
    if station_match:
        nearest_station = station_match.group(1).strip()

    remote_pref = "リモート希望（週1-2出社可）"
    if re.search(r'フルリモート希望|完全在宅', text):
        remote_pref = "フルリモート希望"
    elif re.search(r'常駐可|出社可', text):
        remote_pref = "オンサイト/常駐可"

    available_from = "即日"
    avail_match = re.search(r'(?:【稼働開始】|【稼働時期】|■\s*稼働時期|開始日|入場可能時期)[:：\s]*([^\n\r]+)', text)
    if avail_match:
        available_from = avail_match.group(1).strip()
    elif re.search(r'即日', text):
        available_from = "即日"
    elif re.search(r'(\d{1,2}月[〜~～初旬中旬下旬]*)', text):
        m_a = re.search(r'(\d{1,2}月[〜~～初旬中旬下旬]*)', text)
        available_from = m_a.group(1)

    min_rate, max_rate = None, None
    rate_matches = re.findall(r'(\d{2,3})\s*(?:万|万円)?\s*[〜~～\-－]\s*(\d{2,3})\s*万', text)
    if rate_matches:
        try:
            min_rate = int(rate_matches[0][0])
            max_rate = int(rate_matches[0][1])
        except Exception:
            pass
    else:
        single_rate = re.findall(r'(?:単価|希望単価)[:：\s]*.*?(\d{2,3})\s*万', text)
        if single_rate:
            try:
                min_rate = int(single_rate[0])
                max_rate = min_rate + 5
            except Exception:
                pass

    years = 5.0
    exp_match = re.search(r'(?:IT経験|経験年数|エンジニア歴)[:：\s]*(\d+(?:\.\d+)?)\s*年', text)
    if exp_match:
        try:
            years = float(exp_match.group(1))
        except Exception:
            pass

    return {
        "name": name[:50],
        "age": age or 32,
        "title": title,
        "experience_years": years,
        "skills": skills[:10],
        "nearest_station": nearest_station[:50],
        "remote_pref": remote_pref,
        "available_from": available_from[:30],
        "min_rate": min_rate or 65,
        "max_rate": max_rate or 75,
        "notes": body[:200]
    }
