import os
import subprocess
import random
from datetime import datetime, timedelta

START_DATE = datetime(2026, 1, 1)
END_DATE = datetime(2026, 3, 20)
AUTHORS = [
    {"name": "harikrishnanks99", "email": "harikrishnanks2919@gmail.com", "weight": 40},
    {"name": "Nidha-Shameer-T-S", "email": "nidhu.shameer@gmail.com", "weight": 30},
    {"name": "sabari-r-nadh", "email": "sabarirnadh@gmail.com", "weight": 20},
    {"name": "NAVIYA44", "email": "navyap3104@gmail.com", "weight": 10},
]

BRANCHES = [
    {
        "branch": "phase-2",
        "commits": [
            {
                "msg": "Initial project setup with README and docker configs",
                "files": [
                    ".gitignore", "Ethnoverse/README.md", "Ethnoverse/backend/docker-compose.yml",
                    "Ethnoverse/backend/docker-compose.prod.yml", "Ethnoverse/backend/nginx/nginx.conf"
                ]
            }
        ]
    },
    {
        "branch": "feature/backend-auth",
        "commits": [
            {
                "msg": "Add auth service base and dependencies",
                "files": ["Ethnoverse/backend/auth_service/.gitignore", "Ethnoverse/backend/auth_service/Dockerfile", "Ethnoverse/backend/auth_service/requirements.txt", "Ethnoverse/backend/auth_service/__init__.py"]
            },
            {
                "msg": "Create database models and schemas for auth",
                "files": ["Ethnoverse/backend/auth_service/models.py", "Ethnoverse/backend/auth_service/schemas.py", "Ethnoverse/backend/auth_service/database.py"]
            },
            {
                "msg": "Implement CRUD operations and security logic",
                "files": ["Ethnoverse/backend/auth_service/crud.py", "Ethnoverse/backend/auth_service/security.py", "Ethnoverse/backend/auth_service/main.py"]
            }
        ]
    },
    {
        "branch": "feature/frontend-auth",
        "commits": [
            {
                "msg": "Initialize React frontend and core configs",
                "files": ["Ethnoverse/frontend-app/.gitignore", "Ethnoverse/frontend-app/.dockerignore", "Ethnoverse/frontend-app/Dockerfile", "Ethnoverse/frontend-app/package.json", "Ethnoverse/frontend-app/vite.config.js", "Ethnoverse/frontend-app/eslint.config.js", "Ethnoverse/frontend-app/README.md", "Ethnoverse/frontend-app/index.html"]
            },
            {
                "msg": "Integrate AuthContext and Axios configurations",
                "files": ["Ethnoverse/frontend-app/src/context/AuthContext.jsx", "Ethnoverse/frontend-app/src/api/axios.js"]
            },
            {
                "msg": "Build Login and Register pages",
                "files": ["Ethnoverse/frontend-app/src/pages/Login.jsx", "Ethnoverse/frontend-app/src/pages/Register.jsx"]
            }
        ]
    },
    {
        "branch": "feature/ai-agent",
        "commits": [
            {
                "msg": "Setup AI agent service skeleton",
                "files": ["Ethnoverse/backend/ai_agent/Dockerfile", "Ethnoverse/backend/ai_agent/requirements.txt", "Ethnoverse/backend/ai_agent/__init__.py"]
            },
            {
                "msg": "Implement graph and vector storage integrations",
                "files": ["Ethnoverse/backend/ai_agent/graph_store.py", "Ethnoverse/backend/ai_agent/vector_store.py"]
            },
            {
                "msg": "Add extraction, moderation, and query parsing tools",
                "files": ["Ethnoverse/backend/ai_agent/tools/extraction.py", "Ethnoverse/backend/ai_agent/tools/moderation.py", "Ethnoverse/backend/ai_agent/tools/query_parser.py", "Ethnoverse/backend/ai_agent/utils.py"]
            },
            {
                "msg": "Integrate core AI agent and API endpoints",
                "files": ["Ethnoverse/backend/ai_agent/models.py", "Ethnoverse/backend/ai_agent/agent.py", "Ethnoverse/backend/ai_agent/main.py"]
            }
        ]
    },
    {
        "branch": "feature/audio-transcription",
        "commits": [
            {
                "msg": "Implement audio transcription service via whisper",
                "files": ["Ethnoverse/backend/audio_transcription/.gitignore", "Ethnoverse/backend/audio_transcription/Dockerfile", "Ethnoverse/backend/audio_transcription/requirements.txt", "Ethnoverse/backend/audio_transcription/main.py", "Ethnoverse/backend/audio_transcription/auth.py", "Ethnoverse/backend/audio_transcription/transcription_service.py"]
            }
        ]
    },
    {
        "branch": "feature/handwriting-ocr",
        "commits": [
            {
                "msg": "Add base handwriting recognition functionality",
                "files": ["Ethnoverse/backend/Handwriting_recognition/requirements.txt", "Ethnoverse/backend/Handwriting_recognition/main.py", "Ethnoverse/backend/Handwriting_recognition/ocr_service.py"]
            },
            {
                "msg": "Refactor into isolated handwriting OCR service",
                "files": ["Ethnoverse/backend/handwriting_service/.gitignore", "Ethnoverse/backend/handwriting_service/Dockerfile", "Ethnoverse/backend/handwriting_service/requirements.txt", "Ethnoverse/backend/handwriting_service/main.py", "Ethnoverse/backend/handwriting_service/ocr_service.py"]
            }
        ]
    },
    {
        "branch": "feature/frontend-core-ui",
        "commits": [
            {
                "msg": "Create global layout and base styling",
                "files": ["Ethnoverse/frontend-app/public/vite.svg", "Ethnoverse/frontend-app/src/assets/react.svg", "Ethnoverse/frontend-app/src/main.jsx", "Ethnoverse/frontend-app/src/App.jsx", "Ethnoverse/frontend-app/src/App.css", "Ethnoverse/frontend-app/src/index.css", "Ethnoverse/frontend-app/src/components/layout/Layout.jsx", "Ethnoverse/frontend-app/src/components/layout/Header.jsx", "Ethnoverse/frontend-app/src/components/layout/Sidebar.jsx", "Ethnoverse/frontend-app/src/components/Navbar.jsx"]
            },
            {
                "msg": "Build content feed and community graph components",
                "files": ["Ethnoverse/frontend-app/src/components/ContentFeed.jsx", "Ethnoverse/frontend-app/src/components/CommunityGraph.jsx"]
            },
            {
                "msg": "Add Dashboard and Community management pages",
                "files": ["Ethnoverse/frontend-app/src/pages/Dashboard.jsx", "Ethnoverse/frontend-app/src/pages/Communities.jsx", "Ethnoverse/frontend-app/src/pages/Community.jsx", "Ethnoverse/frontend-app/src/pages/Contributions.jsx"]
            },
            {
                "msg": "Develop search, data explorer, and knowledge graph views",
                "files": ["Ethnoverse/frontend-app/src/pages/Search.jsx", "Ethnoverse/frontend-app/src/pages/Search.css", "Ethnoverse/frontend-app/src/pages/SearchArchive.jsx", "Ethnoverse/frontend-app/src/pages/DataExplorer.jsx", "Ethnoverse/frontend-app/src/pages/KnowledgeGraph.jsx", "Ethnoverse/frontend-app/src/pages/Upload.jsx"]
            }
        ]
    },
    {
        "branch": "phase-2",
        "commits": [
            {
                "msg": "Add utility scripts for repository management",
                "files": ["generate_git_history.py"]
            }
        ]
    }
]

def get_random_author():
    total = sum(a["weight"] for a in AUTHORS)
    r = random.uniform(0, total)
    upto = 0
    for a in AUTHORS:
        if upto + a["weight"] >= r:
            return a
        upto += a["weight"]
    return AUTHORS[0]

current_time = START_DATE

def get_next_datetime():
    global current_time
    # Advance time by 1-3 days realistically for the next branch/commit block
    days_advance = random.randint(1, 3)
    current_time += timedelta(days=days_advance)
    
    # Random hour between 14 (2 PM) and 1 (2 AM next day)
    valid_hours = list(range(14, 24)) + [0, 1]
    hr = random.choice(valid_hours)
    
    gen_time = current_time.replace(hour=hr, minute=random.randint(0, 59), second=random.randint(0, 59))
    if hr < 14:
        gen_time += timedelta(days=1)
        
    return gen_time

def commit_with_env(msg, files, author, dt):
    dt_str = dt.strftime("%Y-%m-%dT%H:%M:%S")
    env = os.environ.copy()
    env["GIT_AUTHOR_NAME"] = author["name"]
    env["GIT_AUTHOR_EMAIL"] = author["email"]
    env["GIT_AUTHOR_DATE"] = dt_str
    env["GIT_COMMITTER_NAME"] = author["name"]
    env["GIT_COMMITTER_EMAIL"] = author["email"]
    env["GIT_COMMITTER_DATE"] = dt_str
    
    for f in files:
        if os.path.exists(f):
            subprocess.run(["git", "add", f], check=True, stdout=subprocess.DEVNULL)
        
    # Check if there's anything to commit
    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    if not status.stdout.strip():
        return
        
    subprocess.run(["git", "commit", "-m", msg], env=env, check=True, stdout=subprocess.DEVNULL)
    print(f"Committed: '{msg}' by {author['name']} at {dt_str}")

def merge_branch(branch, target, author, dt):
    dt_str = dt.strftime("%Y-%m-%dT%H:%M:%S")
    env = os.environ.copy()
    env["GIT_AUTHOR_NAME"] = author["name"]
    env["GIT_AUTHOR_EMAIL"] = author["email"]
    env["GIT_AUTHOR_DATE"] = dt_str
    env["GIT_COMMITTER_NAME"] = author["name"]
    env["GIT_COMMITTER_EMAIL"] = author["email"]
    env["GIT_COMMITTER_DATE"] = dt_str
    
    msg = f"Merge branch '{branch}' into {target}"
    subprocess.run(["git", "checkout", target], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(["git", "merge", "--no-ff", branch, "-m", msg], env=env, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Merged {branch} into {target} at {dt_str}")

def main():
    for block in BRANCHES:
        branch = block["branch"]
        
        # Decide if we need to create a new branch or stay on phase-2
        if branch != "phase-2":
            subprocess.run(["git", "checkout", "-b", branch], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            subprocess.run(["git", "checkout", "phase-2"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
        author = get_random_author() # Same author for a whole feature makes sense
        
        for c in block["commits"]:
            dt = get_next_datetime()
            commit_with_env(c["msg"], c["files"], author, dt)
            # small time advance between commits in same branch
            global current_time
            current_time = dt + timedelta(hours=random.randint(1, 3))
            
        if branch != "phase-2":
            dt = get_next_datetime()
            merge_author = get_random_author() # Maybe leader merges, but random is fine
            merge_branch(branch, "phase-2", merge_author, dt)

if __name__ == "__main__":
    main()
