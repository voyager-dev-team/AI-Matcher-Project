from app.database import get_db
import json

SAMPLE_ENGINEERS_SHEET = [
    {
        "name": "田中 健一 (T.K)",
        "age": 33,
        "title": "Java / Spring Boot シニアバックエンドエンジニア",
        "experience_years": 8.0,
        "skills": ["Java", "Spring Boot", "AWS", "Docker", "MySQL", "PostgreSQL"],
        "nearest_station": "中央線 中野駅",
        "remote_pref": "フルリモート希望（月1〜2出社可）",
        "available_from": "即日",
        "min_rate": 75,
        "max_rate": 85,
        "notes": "金融系・EC系の基幹システム開発にて要件定義から詳細設計、実装、単体/結合テストまで一貫して担当。SpringBootを用いたマイクロサービスアーキテクチャの刷新経験あり。AWS ECS, RDS環境の構築実績あり。",
        "resume_text": "【経歴書要約】\n1. 大手ECサイト刷新プロジェクト (3年)\n役割: バックエンドテックリード / 担当工程: 詳細設計、実装、テスト、コードレビュー\n環境: Java 17, Spring Boot 3, AWS (ECS, RDS, Aurora), MySQL, Docker\n\n2. 銀行向け決済ゲートウェイ基盤開発 (3年)\n役割: SE / 担当工程: 基本設計、詳細設計、製造、負荷テスト\n環境: Java 11, Spring Batch, Oracle DB, Linux\n\n【保有資格】\n・AWS Certified Solutions Architect - Associate\n・基本情報技術者",
        "resume_filename": "田中健一_職務経歴書_2026.pdf",
        "source": "spreadsheet"
    },
    {
        "name": "佐藤 美咲 (M.S)",
        "age": 28,
        "title": "TypeScript / React フロントエンドエンジニア",
        "experience_years": 5.0,
        "skills": ["TypeScript", "React", "Next.js", "Tailwind CSS", "GraphQL", "Node.js"],
        "nearest_station": "東急東横線 中目黒駅",
        "remote_pref": "リモート併用（週1〜2出社可）",
        "available_from": "翌月1日",
        "min_rate": 70,
        "max_rate": 80,
        "notes": "BtoB SaaSプロダクトのUI設計・実装をリード。Design Systemの策定やWebパフォーマンス改善（Core Web Vitals）、アクセシビリティ対応に強み。アジャイル/スクラム開発経験豊富。",
        "resume_text": "【職務経歴書】\n1. HR系SaaSプロダクト新規開発 (2年6ヶ月)\n役割: フロントエンドリード / React, Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query\nデザインシステムをStorybookでコンポーネント化し、開発効率を30%向上。\n\n2. 予約管理システムリニューアル (2年)\n役割: UIエンジニア / Vue.jsからReactへの全面移行プロジェクトに参画。",
        "resume_filename": "佐藤美咲_経歴書.docx",
        "source": "spreadsheet"
    },
    {
        "name": "鈴木 翔太 (S.S)",
        "age": 36,
        "title": "Python / クラウドデータ基盤・AIエンジニア",
        "experience_years": 10.0,
        "skills": ["Python", "FastAPI", "GCP", "BigQuery", "Docker", "Terraform", "PostgreSQL"],
        "nearest_station": "JR山手線 目黒駅",
        "remote_pref": "フルリモート",
        "available_from": "即日",
        "min_rate": 85,
        "max_rate": 95,
        "notes": "Python歴7年。大規模データパイプライン構築（GCP, BigQuery, Airflow）およびFastAPIを用いた機械学習推論API開発のスペシャリスト。DBチューニングやIaC（Terraform）にも精通。",
        "resume_text": "【経歴書要約】\n1. 広告プラットフォーム配信ログ分析基盤構築 (4年)\n環境: Python, FastAPI, GCP (BigQuery, Cloud Run, Dataflow), Terraform, GitHub Actions\n日次数億件のログ処理基盤を設計・構築。\n\n2. AI需要予測APIサーバー開発 (3年)\n環境: Python, PyTorch, FastAPI, Docker, Kubernetes",
        "resume_filename": "鈴木翔太_職務経歴書.pdf",
        "source": "spreadsheet"
    },
    {
        "name": "高橋 誠 (M.T)",
        "age": 31,
        "title": "Go / クラウドネイティブエンジニア",
        "experience_years": 6.0,
        "skills": ["Go", "Kubernetes", "Docker", "AWS", "gRPC", "PostgreSQL", "Linux"],
        "nearest_station": "京王線 調布駅",
        "remote_pref": "リモート併用",
        "available_from": "即日",
        "min_rate": 80,
        "max_rate": 90,
        "notes": "Go言語でのマイクロサービス開発歴4年。gRPC通信を用いた高スループットAPIの設計実装経験が豊富。Kubernetesクラスタの運用やCI/CDパイプライン構築も得意とします。",
        "resume_text": "【経歴書】\n1. フィンテック企業向け基幹決済マイクロサービス (3年)\n言語/環境: Go (Gin, gRPC), AWS (EKS, Aurora PostgreSQL), Kafka, Datadog\n2. オンラインゲーム共通アカウント認証基盤 (2年)\n言語/環境: Go, Redis, Docker, GCP",
        "resume_filename": "高橋誠_経歴書.pdf",
        "source": "spreadsheet"
    }
]

SAMPLE_PROJECTS_SHEET = [
    {
        "title": "【Java/AWS】大手金融機関向けWebサービスリニューアル案件",
        "client_company": "株式会社エフ・アイ・ソリューションズ",
        "required_skills": ["Java", "Spring Boot", "AWS", "MySQL"],
        "preferred_skills": ["Docker", "ECS", "JUnit"],
        "location": "品川（基本フルリモート）",
        "remote_pref": "フルリモート（月1出社）",
        "start_date": "即日",
        "min_rate": 75,
        "max_rate": 85,
        "payment_terms": "140h-180h",
        "interview_count": "1回（Web）",
        "source": "spreadsheet"
    },
    {
        "title": "【React/TypeScript】BtoB向けDX推進プラットフォーム開発",
        "client_company": "デジタルネクスト株式会社",
        "required_skills": ["React", "TypeScript", "Next.js"],
        "preferred_skills": ["Tailwind CSS", "Node.js", "GraphQL"],
        "location": "渋谷",
        "remote_pref": "週1出社・週4リモート",
        "start_date": "翌月1日",
        "min_rate": 70,
        "max_rate": 80,
        "payment_terms": "140h-180h",
        "interview_count": "1回（Web）",
        "source": "spreadsheet"
    },
    {
        "title": "【Python/GCP】ビッグデータ分析基盤＆APIサーバー構築",
        "client_company": "アドテクノロジー合同会社",
        "required_skills": ["Python", "FastAPI", "GCP", "BigQuery"],
        "preferred_skills": ["Docker", "Terraform"],
        "location": "六本木（完全在宅可）",
        "remote_pref": "フルリモート",
        "start_date": "即日",
        "min_rate": 85,
        "max_rate": 95,
        "payment_terms": "140h-180h",
        "interview_count": "1回",
        "source": "spreadsheet"
    }
]

SAMPLE_EMAILS = [
    # Project emails from ML
    {
        "subject": "【案件情報】大手流通ECサイト刷新 Java/Spring Boot/AWSエンジニア募集（即日〜/フルリモート）",
        "sender": "partners@tokyo-system-craft.co.jp",
        "category": "project",
        "body": """パートナー企業様 各位
いつも大変お世話になっております。東京システムクラフトの木村です。

急募の案件情報がございますので、ご提案可能な要員様がいらっしゃいましたら
スキルシートを添えてご返信いただけますと幸いです。

■ 案件名：大手流通ECサイト刷新 Java/Spring Bootバックエンド開発
■ 業務内容：
・ECサイトのマイクロサービス化に伴うバックエンドAPI開発
・要件定義からの詳細設計、実装、テスト
■ 必須スキル：
・Java実務経験 4年以上
・Spring Boot を用いたWeb API開発経験 2年以上
・AWS (ECS, RDS, S3等) 環境での開発経験
・RDB (MySQLまたはPostgreSQL) のテーブル設計・クエリ最適化
■ 尚可スキル：
・Dockerコンテナ環境での開発経験
・マイクロサービスアーキテクチャの知見
■ 勤務地：都内（基本フルリモート / PC貸与）
■ 稼働時期：即日 〜 長期（来月〜も応相談）
■ 単価：75万 〜 85万円（スキル見合い / 税抜）
■ 精算幅：140h - 180h（中間割）
■ 面談：1回（オンライン / 弊社同席）
■ 募集人数：2名

よろしくお願いいたします。"""
    },
    {
        "subject": "【案件】SaaS管理画面フロントエンド開発（React / TypeScript / Next.js）",
        "sender": "ses-info@cloud-creators.jp",
        "category": "project",
        "body": """お世話になっております。クラウドクリエイターズの山本です。

新着のフロントエンド案件をご案内いたします。

■ 案件：人事労務SaaSの新規機能開発
■ 必須要件：
・TypeScript, React の実務経験 3年以上
・Next.js での実務開発経験
・レスポンシブWebデザイン、Tailwind CSS
■ 尚可要件：
・Design Systemの構築・Storybook運用
・状態管理ライブラリ（Zustand, Redux等）
■ 勤務地：渋谷（週1回出社、残りリモート）
■ 開始時期：翌月1日〜
■ 予算：70万円〜80万円 / 月
■ 精算：140-180h
■ 面談回数：1回（Web）

ご提案お待ちしております。"""
    },
    {
        "subject": "【案件】Go言語による決済基盤マイクロサービス開発（高単価案件）",
        "sender": "dispatch@fintech-partners.com",
        "category": "project",
        "body": """いつもお世話になっております。フィンテックパートナーズの渡辺です。

高単価・Go言語の案件です。

【案件名】決済基盤システム マイクロサービス新規開発
【必須要件】
・Go言語の実務経験 2年以上
・RDB（PostgreSQL）を使用した開発経験
・Docker, Linux の基礎知識
【尚可要件】
・Kubernetes (k8s) 環境での運用経験
・gRPC, Protocol Buffers の利用経験
・AWS環境での開発経験
【勤務地】東京駅周辺（週1日出社、週4日リモート）
【稼働時期】即日または来月〜
【単価】80万 〜 95万円 (経験・スキルによる)
【精算幅】140-180h
【面談】1回 (Google Meet)"""
    },
    {
        "subject": "【急募案件】Pythonデータ分析基盤＆機械学習API開発（フルリモート）",
        "sender": "ai-ses@nextech-solutions.jp",
        "category": "project",
        "body": """お世話になっております。ネクステックソリューションズの斉藤です。

データ分析基盤および推論API開発の案件です。

案件：大規模マーケティングデータのETL及びFastAPIサーバー開発
必須スキル：
・Python 実務3年以上
・FastAPI または Flask によるREST API開発
・GCP (BigQuery, Cloud Run等) の使用経験
尚可スキル：
・TerraformによるIaC
・Dockerコンテナ開発
場所：完全フルリモート
開始：即日
単価：85万円〜95万円
精算：140-180h
面談：1回

ご検討よろしくお願いいたします。"""
    },
    # Engineer emails from ML
    {
        "subject": "【人材情報】Java/Spring Boot/AWS 即戦力エンジニア（30代半ば・即日稼働可・単価75万）",
        "sender": "agent@tokyo-it-support.jp",
        "category": "engineer",
        "body": """パートナー企業様 各位
いつも大変お世話になっております。東京ITサポートの松本です。

弊社プロパーの優秀なJavaエンジニアの稼働が空くため、ご提案いたします。

【イニシャル】: K.Y (男性・34歳)
【職種】: シニアサーバーサイドエンジニア
【最寄駅】: JR山手線 恵比寿駅
【稼働開始】: 即日可能
【希望単価】: 75万円〜80万円 (税抜)
【稼働形態】: フルリモートまたは週1〜2出社可
【IT経験】: 9年
【スキルセット】:
・Java (8, 11, 17) : 7年
・Spring Boot, Spring MVC : 5年
・AWS (ECS, RDS, Lambda) : 3年
・MySQL, PostgreSQL : 6年
・Docker : 3年
【人物像】:
コミュニケーション良好で、リーダーシップがあり、後輩のコードレビューや設計指導も行えます。

スキルシートを添付しておりますので、是非案件情報がございましたらご紹介ください。"""
    },
    {
        "subject": "【要員情報】React/TypeScript/Next.js フロントエンドエンジニア（29歳・来月〜・希望70万）",
        "sender": "human@dev-resource-hub.com",
        "category": "engineer",
        "body": """お世話になっております。デブリソースハブの小林です。

来月より参画可能なフロントエンド技術者の情報をお送りします。

■ 氏名：H.N (29歳・男性)
■ 最寄駅：東武東上線 和光市駅
■ 稼働時期：来月1日〜
■ 希望単価：70万円〜 (スキル見合い)
■ 希望条件：リモート週3日以上
■ 主要技術：
・JavaScript / TypeScript : 4年
・React, Next.js : 3年
・Tailwind CSS, Chakra UI
・Node.js (BFF開発経験あり)
■ 経歴要約：
大規模ECサイトのフロントエンドリプレイス、Web3プラットフォームのUI実装に従事。

面談は平日夜間または日中調整可能です。
よろしくお願いいたします。"""
    },
    {
        "subject": "【要員提案】Go/Kubernetes クラウドネイティブエンジニア（32歳・即日〜・希望85万）",
        "sender": "staffing@infra-core.net",
        "category": "engineer",
        "body": """いつもお世話になります。インフラコアの加藤です。

即日稼働可能なハイスペックエンジニアのご案内です。

【技術者名】: Y.T (32歳)
【専門領域】: Go言語サーバーサイド & クラウドインフラ
【最寄駅】: 丸ノ内線 西新宿駅
【稼働時期】: 即日〜
【希望単価】: 85万円
【稼働形態】: フルリモート希望
【保有スキル】:
・Go (Gin, Echo, gRPC) : 4年
・Kubernetes (EKS, GKE) : 3年
・AWS, GCP : 5年
・Docker, Terraform : 4年
・PostgreSQL, Redis
【アピール点】:
高負荷トラフィックに耐えるマイクロサービスの設計から、K8sインフラ構築まで一人称で完結できます。

ぜひ案件をご紹介いただけますと幸いです。"""
    }
]

def seed_database():
    conn = get_db()
    cursor = conn.cursor()

    # Check if engineers already exist
    cursor.execute("SELECT count(*) as cnt FROM engineers")
    if cursor.fetchone()["cnt"] > 0:
        conn.close()
        return

    # Seed Engineers (Spreadsheet source)
    for eng in SAMPLE_ENGINEERS_SHEET:
        cursor.execute('''
        INSERT INTO engineers (
            name, age, title, experience_years, skills, nearest_station,
            remote_pref, available_from, min_rate, max_rate, notes,
            resume_text, resume_filename, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            eng["name"], eng["age"], eng["title"], eng["experience_years"],
            json.dumps(eng["skills"]), eng["nearest_station"], eng["remote_pref"],
            eng["available_from"], eng["min_rate"], eng["max_rate"],
            eng["notes"], eng["resume_text"], eng["resume_filename"], eng["source"]
        ))

    # Seed Projects (Spreadsheet source)
    for prj in SAMPLE_PROJECTS_SHEET:
        cursor.execute('''
        INSERT INTO projects (
            title, client_company, required_skills, preferred_skills,
            location, remote_pref, start_date, min_rate, max_rate,
            payment_terms, interview_count, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            prj["title"], prj["client_company"], json.dumps(prj["required_skills"]),
            json.dumps(prj["preferred_skills"]), prj["location"], prj["remote_pref"],
            prj["start_date"], prj["min_rate"], prj["max_rate"],
            prj["payment_terms"], prj["interview_count"], prj["source"]
        ))

    # Seed Emails & Parse them into project/engineer DB
    from app.parser import parse_project_text, parse_engineer_text

    for mail in SAMPLE_EMAILS:
        cursor.execute('''
        INSERT INTO emails (subject, sender, body, category, is_parsed)
        VALUES (?, ?, ?, ?, 1)
        ''', (mail["subject"], mail["sender"], mail["body"], mail["category"]))
        email_id = cursor.lastrowid

        if mail["category"] == "project":
            p = parse_project_text(mail["subject"], mail["body"])
            cursor.execute('''
            INSERT INTO projects (
                title, client_company, required_skills, preferred_skills,
                location, remote_pref, start_date, min_rate, max_rate,
                payment_terms, raw_text, source, email_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'email', ?)
            ''', (
                p["title"], mail["sender"].split('@')[0], json.dumps(p["required_skills"]),
                json.dumps(p["preferred_skills"]), p["location"], p["remote_pref"],
                p["start_date"], p["min_rate"], p["max_rate"],
                p["payment_terms"], mail["body"], email_id
            ))
        elif mail["category"] == "engineer":
            e = parse_engineer_text(mail["subject"], mail["body"])
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
                e["notes"], mail["body"], email_id
            ))

    conn.commit()
    conn.close()
