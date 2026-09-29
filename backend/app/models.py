from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class EngineerBase(BaseModel):
    name: str = Field(..., description="技術者名またはイニシャル（例: K.T または 山田 太郎）")
    age: Optional[int] = Field(None, description="年齢")
    title: str = Field(..., description="職種・メイン役割（例: Javaバックエンドエンジニア）")
    experience_years: Optional[float] = Field(None, description="IT経験年数")
    skills: List[str] = Field(default_factory=list, description="主要スキルセット")
    nearest_station: Optional[str] = Field(None, description="最寄駅（例: 新宿駅、横浜駅）")
    remote_pref: Optional[str] = Field("リモート可", description="希望稼働形態（フルリモート、週2出社、常駐可など）")
    available_from: Optional[str] = Field("即日", description="稼働可能開始時期（例: 即日、2026年10月〜）")
    min_rate: Optional[int] = Field(None, description="希望単価下限（万円/月、税抜）")
    max_rate: Optional[int] = Field(None, description="希望単価上限（万円/月、税抜）")
    notes: Optional[str] = Field("", description="アピールポイント・備考")
    resume_text: Optional[str] = Field("", description="職務経歴書のテキスト全文")
    resume_filename: Optional[str] = Field(None, description="アップロードされた経歴書ファイル名")
    source: str = Field("spreadsheet", description="登録元: spreadsheet, email, manual")
    email_id: Optional[int] = Field(None, description="メール由来の場合のEmail ID")

class EngineerCreate(EngineerBase):
    pass

class Engineer(EngineerBase):
    id: int

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    title: str = Field(..., description="案件名・募集タイトル")
    client_company: Optional[str] = Field(None, description="発注元/掲載元企業名")
    required_skills: List[str] = Field(default_factory=list, description="必須スキル")
    preferred_skills: List[str] = Field(default_factory=list, description="尚可スキル")
    location: Optional[str] = Field(None, description="勤務地・最寄り（例: 渋谷駅、東京駅）")
    remote_pref: Optional[str] = Field("リモート併用", description="稼働形態（フルリモート、週3出社など）")
    start_date: Optional[str] = Field("即日", description="開始時期")
    min_rate: Optional[int] = Field(None, description="予算単価下限（万円/月）")
    max_rate: Optional[int] = Field(None, description="予算単価上限（万円/月）")
    payment_terms: Optional[str] = Field("140h-180h", description="精算幅")
    interview_count: Optional[str] = Field("1回", description="面談回数")
    raw_text: Optional[str] = Field("", description="案件メール本文等の原文")
    source: str = Field("spreadsheet", description="登録元: spreadsheet, email, manual")
    email_id: Optional[int] = Field(None, description="メール由来の場合のEmail ID")

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int

    class Config:
        from_attributes = True

class EmailMessageBase(BaseModel):
    message_id: Optional[str] = None
    subject: str
    sender: str
    date: Optional[str] = None
    body: str

class EmailMessageCreate(EmailMessageBase):
    pass

class EmailMessage(EmailMessageBase):
    id: int
    category: str = "unknown" # "project", "engineer", "other"
    is_parsed: bool = False
    created_at: str

    class Config:
        from_attributes = True

class ProposalEmail(BaseModel):
    to_address: Optional[str] = ""
    subject: str = ""
    body: str = ""
    match_score: int = 0
    is_auto_generated: bool = True

class MatchScore(BaseModel):
    score: int # 0 to 100
    skills_score: int
    rate_score: int
    location_score: int
    date_score: int
    match_reasons: List[str] = Field(default_factory=list, description="適合理由・強み")
    concern_points: List[str] = Field(default_factory=list, description="懸念点・確認事項")
    proposal_email: Optional[ProposalEmail] = None

class EngineerProjectMatch(BaseModel):
    engineer: Engineer
    project: Project
    match_score: MatchScore

class CrossMatchPair(BaseModel):
    engineer_email_id: Optional[int] = None
    project_email_id: Optional[int] = None
    engineer_name: str
    project_title: str
    engineer_skills: List[str]
    project_skills: List[str]
    rate_info: str
    score: int
    reasons: List[str]
    concerns: List[str]
    proposal_preview: str

class EmailParseRequest(BaseModel):
    text: str
    sender: Optional[str] = "ses-partner@example.com"
    subject: Optional[str] = "【案件/人材情報】"

class GenerateProposalRequest(BaseModel):
    engineer_id: int
    project_id: int
    custom_notes: Optional[str] = None
