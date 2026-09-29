import os
import json
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import init_db, get_db, row_to_dict
from app.models import (
    Engineer, EngineerCreate, Project, ProjectCreate,
    EmailMessage, EmailParseRequest, GenerateProposalRequest,
    EngineerProjectMatch, CrossMatchPair, ProposalEmail
)
from app.parser import (
    classify_email, parse_project_text, parse_engineer_text,
    extract_text_from_pdf, extract_text_from_docx, extract_skills_from_text
)
from app.ai_matcher import calculate_match_score, generate_proposal_email
from app.sheets_service import import_from_google_sheet_url, parse_spreadsheet_csv, parse_spreadsheet_excel
from app.seed_data import seed_database

app = FastAPI(title="SES AI Matcher API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()
    seed_database()

@app.get("/api/health")
def health():
    return {"status": "ok", "message": "SES AI Matcher backend is running."}

# ==========================================
# 1. Engineers API (人材管理 & 経歴書)
# ==========================================
@app.get("/api/engineers")
def get_engineers(source: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    if source:
        cursor.execute("SELECT * FROM engineers WHERE source = ? ORDER BY id DESC", (source,))
    else:
        cursor.execute("SELECT * FROM engineers ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@app.get("/api/engineers/{engineer_id}")
def get_engineer(engineer_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM engineers WHERE id = ?", (engineer_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Engineer not found")
    return row_to_dict(row)

@app.post("/api/engineers")
def create_engineer(eng: EngineerCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO engineers (
        name, age, title, experience_years, skills, nearest_station,
        remote_pref, available_from, min_rate, max_rate, notes,
        resume_text, resume_filename, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        eng.name, eng.age, eng.title, eng.experience_years,
        json.dumps(eng.skills), eng.nearest_station, eng.remote_pref,
        eng.available_from, eng.min_rate, eng.max_rate,
        eng.notes, eng.resume_text, eng.resume_filename, eng.source
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": new_id, "message": "Engineer registered successfully"}

@app.post("/api/engineers/{engineer_id}/upload-resume")
async def upload_resume(engineer_id: int, file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "resume"
    extracted_text = ""
    
    if filename.lower().endswith(".pdf"):
        extracted_text = extract_text_from_pdf(content)
    elif filename.lower().endswith(".docx"):
        extracted_text = extract_text_from_docx(content)
    else:
        try:
            extracted_text = content.decode("utf-8")
        except Exception:
            extracted_text = content.decode("shift-jis", errors="ignore")
            
    if not extracted_text:
        raise HTTPException(status_code=400, detail="経歴書ファイルからテキストを抽出できませんでした。")

    new_skills = extract_skills_from_text(extracted_text)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT skills FROM engineers WHERE id = ?", (engineer_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="技術者が見つかりません。")
        
    cur_skills = json.loads(row["skills"]) if row["skills"] else []
    merged_skills = list(dict.fromkeys(cur_skills + new_skills))

    cursor.execute('''
    UPDATE engineers
    SET resume_text = ?, resume_filename = ?, skills = ?
    WHERE id = ?
    ''', (extracted_text, filename, json.dumps(merged_skills), engineer_id))
    conn.commit()
    conn.close()

    return {
        "message": "経歴書を取り込みました。",
        "skills_detected": new_skills,
        "resume_length": len(extracted_text)
    }

# ==========================================
# 2. Projects API (案件管理)
# ==========================================
@app.get("/api/projects")
def get_projects(source: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    if source:
        cursor.execute("SELECT * FROM projects WHERE source = ? ORDER BY id DESC", (source,))
    else:
        cursor.execute("SELECT * FROM projects ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@app.get("/api/projects/{project_id}")
def get_project(project_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return row_to_dict(row)

# ==========================================
# 3. Emails API (メール取込・解析)
# ==========================================
@app.get("/api/emails")
def get_emails():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM emails ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/emails/parse-raw")
def parse_raw_email(req: EmailParseRequest):
    category = classify_email(req.subject or "", req.text)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO emails (subject, sender, body, category, is_parsed)
    VALUES (?, ?, ?, ?, 1)
    ''', (req.subject or "【受信メール】", req.sender or "partner@ses.co.jp", req.text, category))
    email_id = cursor.lastrowid

    parsed_entity = None
    if category == "project":
        p = parse_project_text(req.subject or "", req.text)
        cursor.execute('''
        INSERT INTO projects (
            title, client_company, required_skills, preferred_skills,
            location, remote_pref, start_date, min_rate, max_rate,
            payment_terms, raw_text, source, email_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'email', ?)
        ''', (
            p["title"], req.sender.split('@')[0], json.dumps(p["required_skills"]),
            json.dumps(p["preferred_skills"]), p["location"], p["remote_pref"],
            p["start_date"], p["min_rate"], p["max_rate"],
            p["payment_terms"], req.text, email_id
        ))
        parsed_entity = p
        parsed_entity["id"] = cursor.lastrowid
    elif category == "engineer":
        e = parse_engineer_text(req.subject or "", req.text)
        cursor.execute('''
        INSERT INTO engineers (
            name, age, title, experience_years, skills, nearest_station,
            remote_pref, available_from, min_rate, max_rate, notes,
            resume_text, source, email_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'email', ?)
        ''', (
            e["name"], e["age"], e["title"], e["experience_years"],
            json.dumps(e["skills"]), e["nearest_station"], e["remote_pref"],
            e["available_from"], e["min_rate"], e["max_rate"],
            e["notes"], req.text, email_id
        ))
        parsed_entity = e
        parsed_entity["id"] = cursor.lastrowid

    conn.commit()
    conn.close()

    return {
        "email_id": email_id,
        "category": category,
        "parsed": parsed_entity,
        "message": f"メールを解析し【{ '案件' if category == 'project' else '人材' }】として登録しました。"
    }

# ==========================================
# 4. 機能１ & 機能２-B: 人材起点マッチング & 提案メール自動作成
# ==========================================
@app.get("/api/match/engineer/{engineer_id}")
def match_engineer_to_projects(
    engineer_id: int,
    only_email_projects: bool = Query(True, description="受信メール由来の案件に限定するか"),
    limit: int = Query(10, description="取得件数 (Top N)")
):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM engineers WHERE id = ?", (engineer_id,))
    eng_row = cursor.fetchone()
    if not eng_row:
        conn.close()
        raise HTTPException(status_code=404, detail="技術者が見つかりません。")
    engineer = row_to_dict(eng_row)

    if only_email_projects:
        cursor.execute("SELECT * FROM projects WHERE source = 'email' ORDER BY id DESC")
    else:
        cursor.execute("SELECT * FROM projects ORDER BY id DESC")
    proj_rows = cursor.fetchall()
    conn.close()

    matches = []
    for prj_row in proj_rows:
        project = row_to_dict(prj_row)
        score_info = calculate_match_score(engineer, project)
        matches.append({
            "project": project,
            "match": score_info.dict()
        })

    matches.sort(key=lambda x: x["match"]["score"], reverse=True)
    top_matches = matches[:limit]

    return {
        "engineer": engineer,
        "total_projects_scanned": len(proj_rows),
        "matches": top_matches,
        "high_match_count": sum(1 for m in matches if m["match"]["score"] >= 60)
    }

# ==========================================
# 5. 機能２-A: 案件起点マッチング (10人候補)
# ==========================================
@app.get("/api/match/project/{project_id}")
def match_project_to_engineers(
    project_id: int,
    only_email_engineers: bool = Query(True, description="メーリングリストの人材メールに限定するか"),
    limit: int = Query(10, description="取得候補人数")
):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    proj_row = cursor.fetchone()
    if not proj_row:
        conn.close()
        raise HTTPException(status_code=404, detail="案件が見つかりません。")
    project = row_to_dict(proj_row)

    if only_email_engineers:
        cursor.execute("SELECT * FROM engineers WHERE source = 'email' ORDER BY id DESC")
    else:
        cursor.execute("SELECT * FROM engineers ORDER BY id DESC")
    eng_rows = cursor.fetchall()
    conn.close()

    candidates = []
    for eng_row in eng_rows:
        engineer = row_to_dict(eng_row)
        score_info = calculate_match_score(engineer, project)
        candidates.append({
            "engineer": engineer,
            "match": score_info.dict()
        })

    candidates.sort(key=lambda x: x["match"]["score"], reverse=True)
    top_candidates = candidates[:limit]

    return {
        "project": project,
        "total_engineers_scanned": len(eng_rows),
        "candidates": top_candidates
    }

# ==========================================
# 6. 機能３: メールの「案件」×「人材」全自動クロスマッチング
# ==========================================
@app.get("/api/match/cross")
def cross_match_emails(min_score: int = Query(60, description="最低適合度")):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projects WHERE source = 'email' ORDER BY id DESC")
    projects = [row_to_dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM engineers WHERE source = 'email' ORDER BY id DESC")
    engineers = [row_to_dict(r) for r in cursor.fetchall()]
    conn.close()

    results = []
    for eng in engineers:
        for prj in projects:
            score_info = calculate_match_score(eng, prj)
            if score_info.score >= min_score:
                results.append({
                    "engineer": eng,
                    "project": prj,
                    "score": score_info.score,
                    "match_reasons": score_info.match_reasons,
                    "concern_points": score_info.concern_points,
                    "proposal_email": score_info.proposal_email.dict() if score_info.proposal_email else None
                })

    results.sort(key=lambda x: x["score"], reverse=True)

    return {
        "total_email_projects": len(projects),
        "total_email_engineers": len(engineers),
        "matched_pairs_count": len(results),
        "pairs": results
    }

# ==========================================
# 7. スプレッドシート連携 API
# ==========================================
@app.post("/api/sheets/import-url")
def import_sheets_url(url: str = Form(...)):
    try:
        items, sheet_type = import_from_google_sheet_url(url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    conn = get_db()
    cursor = conn.cursor()
    inserted_count = 0

    if sheet_type == "engineer":
        for eng in items:
            cursor.execute('''
            INSERT INTO engineers (
                name, title, experience_years, skills, nearest_station,
                remote_pref, available_from, min_rate, max_rate, notes,
                resume_text, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'spreadsheet')
            ''', (
                eng["name"], eng["title"], eng["experience_years"],
                json.dumps(eng["skills"]), eng["nearest_station"],
                eng["remote_pref"], eng["available_from"],
                eng["min_rate"], eng["max_rate"], eng["notes"],
                eng["resume_text"]
            ))
            inserted_count += 1
    else:
        for prj in items:
            cursor.execute('''
            INSERT INTO projects (
                title, client_company, required_skills, preferred_skills,
                location, remote_pref, start_date, min_rate, max_rate,
                payment_terms, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'spreadsheet')
            ''', (
                prj["title"], prj["client_company"], json.dumps(prj["required_skills"]),
                json.dumps(prj["preferred_skills"]), prj["location"],
                prj["remote_pref"], prj["start_date"],
                prj["min_rate"], prj["max_rate"], prj["payment_terms"]
            ))
            inserted_count += 1

    conn.commit()
    conn.close()

    return {
        "sheet_type": sheet_type,
        "count": inserted_count,
        "message": f"スプレッドシートから {inserted_count} 件の【{'人材' if sheet_type == 'engineer' else '案件'}】を取り込みました。"
    }

@app.post("/api/sheets/import-file")
async def import_sheets_file(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "data.csv"
    
    if filename.lower().endswith(".xlsx") or filename.lower().endswith(".xls"):
        items, sheet_type = parse_spreadsheet_excel(content)
    else:
        try:
            text = content.decode("utf-8")
        except Exception:
            text = content.decode("shift-jis", errors="ignore")
        items, sheet_type = parse_spreadsheet_csv(text)

    conn = get_db()
    cursor = conn.cursor()
    inserted_count = 0

    if sheet_type == "engineer":
        for eng in items:
            cursor.execute('''
            INSERT INTO engineers (
                name, title, experience_years, skills, nearest_station,
                remote_pref, available_from, min_rate, max_rate, notes,
                resume_text, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'spreadsheet')
            ''', (
                eng["name"], eng["title"], eng["experience_years"],
                json.dumps(eng["skills"]), eng["nearest_station"],
                eng["remote_pref"], eng["available_from"],
                eng["min_rate"], eng["max_rate"], eng["notes"],
                eng["resume_text"]
            ))
            inserted_count += 1
    else:
        for prj in items:
            cursor.execute('''
            INSERT INTO projects (
                title, client_company, required_skills, preferred_skills,
                location, remote_pref, start_date, min_rate, max_rate,
                payment_terms, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'spreadsheet')
            ''', (
                prj["title"], prj["client_company"], json.dumps(prj["required_skills"]),
                json.dumps(prj["preferred_skills"]), prj["location"],
                prj["remote_pref"], prj["start_date"],
                prj["min_rate"], prj["max_rate"], prj["payment_terms"]
            ))
            inserted_count += 1

    conn.commit()
    conn.close()

    return {
        "sheet_type": sheet_type,
        "count": inserted_count,
        "message": f"ファイルから {inserted_count} 件の【{'人材' if sheet_type == 'engineer' else '案件'}】を取り込みました。"
    }

# ==========================================
# 8. デモデータリセット
# ==========================================
@app.post("/api/seed/reset")
def reset_seed():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM engineers")
    cursor.execute("DELETE FROM projects")
    cursor.execute("DELETE FROM emails")
    cursor.execute("DELETE FROM proposals")
    conn.commit()
    conn.close()
    
    seed_database()
    return {"message": "データベースを初期化し、最新のデモデータをセットしました。"}

# ==========================================
# 9. フロントエンド静的配信 (distマウント)
# ==========================================
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
