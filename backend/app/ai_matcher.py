import os
import json
import requests
from typing import Dict, Any, List, Tuple
from app.models import Engineer, Project, MatchScore, ProposalEmail

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def calculate_match_score(engineer: Dict[str, Any], project: Dict[str, Any]) -> MatchScore:
    """
    エンジニアと案件の適合度を多面的にスコアリング (0-100%)
    - スキル合致度 (配点: 50点)
    - 単価整合性 (配点: 20点)
    - 稼働開始時期 (配点: 15点)
    - 勤務地・リモート (配点: 15点)
    """
    eng_skills = set([s.lower() for s in engineer.get("skills", [])])
    proj_req_skills = set([s.lower() for s in project.get("required_skills", [])])
    proj_pref_skills = set([s.lower() for s in project.get("preferred_skills", [])])
    
    # Also check skills mentioned in resume_text or notes
    all_eng_text = f"{engineer.get('notes', '')} {engineer.get('resume_text', '')}".lower()
    
    reasons = []
    concerns = []

    # 1. Skills Scoring (max 50)
    matched_req = []
    missing_req = []
    
    if proj_req_skills:
        for s in proj_req_skills:
            if s in eng_skills or s in all_eng_text:
                matched_req.append(s)
            else:
                missing_req.append(s)
                
        req_ratio = len(matched_req) / len(proj_req_skills)
        skills_score = int(req_ratio * 40)
    else:
        # If no explicit required skills listed
        skills_score = 30
        
    matched_pref = []
    if proj_pref_skills:
        for s in proj_pref_skills:
            if s in eng_skills or s in all_eng_text:
                matched_pref.append(s)
        skills_score += min(10, int(len(matched_pref) * 4))
    else:
        skills_score += 5

    if matched_req:
        reasons.append(f"必須スキル【{', '.join([s.title() for s in matched_req])}】の実務経験が完全に一致しています。")
    if matched_pref:
        reasons.append(f"尚可スキル【{', '.join([s.title() for s in matched_pref])}】の知見も有しており、キャッチアップが早いです。")
    if missing_req:
        concerns.append(f"必須要件の【{', '.join([s.title() for s in missing_req])}】は経歴書上に明記されていないため、事前確認が推奨されます。")

    # 2. Rate Scoring (max 20)
    rate_score = 15
    eng_min_rate = engineer.get("min_rate") or 65
    proj_max_rate = project.get("max_rate") or 80
    proj_min_rate = project.get("min_rate") or 65
    
    if eng_min_rate <= proj_max_rate:
        rate_diff = proj_max_rate - eng_min_rate
        if rate_diff >= 5:
            rate_score = 20
            reasons.append(f"単価感は予算上限（{proj_max_rate}万円）に対して技術者希望（{eng_min_rate}万円〜）と余裕があり、商談が成立しやすい価格帯です。")
        else:
            rate_score = 16
            reasons.append(f"単価感は案件予算（{proj_min_rate}〜{proj_max_rate}万円）と技術者希望（{eng_min_rate}万円）がほぼ合致しています。")
    else:
        rate_score = 5
        concerns.append(f"技術者の希望単価（{eng_min_rate}万円〜）が案件予算上限（{proj_max_rate}万円）を超過しているため、単価調整の事前交渉が必要です。")

    # 3. Location & Remote Scoring (max 15)
    loc_score = 12
    eng_remote = engineer.get("remote_pref", "")
    proj_remote = project.get("remote_pref", "")
    
    if "フルリモート" in proj_remote:
        loc_score = 15
        reasons.append("フルリモート案件のため、居住地に関わらずスムーズに参画可能です。")
    elif "常駐" in proj_remote and "フルリモート希望" in eng_remote:
        loc_score = 4
        concerns.append(f"案件は【{proj_remote}】ですが技術者は【{eng_remote}】を希望しており、稼働形態のすり合わせが必要です。")
    else:
        loc_score = 13
        reasons.append(f"稼働形態（案件: {proj_remote} / 技術者: {eng_remote}）の条件が整合しています。")

    # 4. Start Date Scoring (max 15)
    date_score = 12
    eng_date = engineer.get("available_from", "即日")
    proj_date = project.get("start_date", "即日")
    
    if ("即日" in eng_date and "即日" in proj_date) or (eng_date == proj_date):
        date_score = 15
        reasons.append(f"稼働開始時期（案件: {proj_date} / 人材: {eng_date}）が合致しており、迅速な提案が可能です。")
    else:
        date_score = 10
        reasons.append(f"稼働時期: 案件({proj_date}) vs 技術者({eng_date})")

    # Experience bonus
    exp_years = engineer.get("experience_years") or 3.0
    if exp_years >= 5.0:
        skills_score = min(50, skills_score + 3)
        reasons.append(f"IT実務経験{exp_years:.1f}年と即戦力レベルであり、現場での早期立ち上がりが期待できます。")

    total_score = min(100, max(10, skills_score + rate_score + loc_score + date_score))

    # Proposal Email (Generated if score >= 60%)
    proposal_email = None
    if total_score >= 60:
        proposal_email = generate_proposal_email(engineer, project, total_score, reasons)

    return MatchScore(
        score=total_score,
        skills_score=skills_score,
        rate_score=rate_score,
        location_score=loc_score,
        date_score=date_score,
        match_reasons=reasons,
        concern_points=concerns,
        proposal_email=proposal_email
    )

def generate_proposal_email(engineer: Dict[str, Any], project: Dict[str, Any], score: int, reasons: List[str]) -> ProposalEmail:
    """
    適合度60%以上の案件に対する、魅力的な営業提案メール下書きの自動生成
    """
    client_name = project.get("client_company") or "パートナー企業"
    project_title = project.get("title", "システム開発案件")
    eng_name = engineer.get("name", "弊社エンジニア")
    eng_age = f"{engineer.get('age')}歳" if engineer.get('age') else ""
    eng_exp = f"経験{engineer.get('experience_years'):.0f}年" if engineer.get('experience_years') else ""
    top_skills = " / ".join(engineer.get("skills", [])[:4])
    rate_val = engineer.get("min_rate") or 70
    avail_val = engineer.get("available_from", "即日")
    station_val = engineer.get("nearest_station", "都内")
    remote_val = engineer.get("remote_pref", "リモート可")

    subject = f"【技術者ご提案】「{project_title}」へのご提案（{eng_name} / {top_skills}）"

    reasons_bullet = "\n".join([f"・{r}" for r in reasons[:3]])

    body = f"""{client_name}
ご担当者様

いつも大変お世話になっております。
株式会社〇〇の営業担当でございます。

貴社にて募集中の案件【{project_title}】を拝見し、
弊社所属の即戦力エンジニアをご提案したくご連絡いたしました。
募集要項との適合度も非常に高く（適合度約{score}％）、現場での早期貢献が可能と考えております。

--------------------------------------------------
■ ご提案エンジニア概要
--------------------------------------------------
【氏名/イニシャル】: {eng_name} ({eng_age} {eng_exp})
【主要スキル】: {top_skills}
【最寄駅】: {station_val}
【希望稼働形態】: {remote_val}
【稼働開始時期】: {avail_val}〜
【希望単価】: {rate_val}万円 / 月 (税抜・精算幅相談可)

--------------------------------------------------
■ 本案件への推薦理由・マッチングポイント
--------------------------------------------------
{reasons_bullet}

--------------------------------------------------
■ 面談調整について
--------------------------------------------------
技術者の面談可能日時や、詳細な業務経歴書（スキルシート）を添付いたします。
オンライン面談（1回〜2回）にて即時ご調整可能です。

ご興味をお持ちいただけましたら、ぜひ一度面談の機会をいただけますと幸いです。
何卒ご検討のほど、よろしくお願い申し上げます。

--------------------------------------------------
署名
株式会社〇〇　SESソリューション事業部
担当: 営業担当者
Email: sales@example.com
TEL: 03-XXXX-XXXX
--------------------------------------------------
"""

    return ProposalEmail(
        to_address=project.get("client_company", ""),
        subject=subject,
        body=body.strip(),
        match_score=score,
        is_auto_generated=True
    )
