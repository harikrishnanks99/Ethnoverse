# AI-Powered Audio Transcription Service

A full-stack web application that provides fast, accurate audio transcription using **Google Gemini AI**, **FastAPI**, **AWS S3**, **Docker**, and a lightweight **vanilla JS frontend**. Built for scalability, portability, and real-world deployment on AWS EC2 with Nginx.

## 🚀 Features

### 🔊 AI-Powered Transcription
- Uses **Google Gemini Pro** for high-accuracy speech-to-text.

### ☁️ Secure Cloud Storage
- All uploaded audio files and transcripts are stored securely in AWS S3.

### ⚡ High-Performance Backend
- Fully asynchronous **FastAPI** API.
- Containerized with **Docker** for consistent deployment.

### 🎨 Clean & Responsive Frontend
- Drag-and-drop uploader.
- Real-time upload progress bar.
- Displays transcription output instantly.

### 🧱 Scalable Architecture
- Decoupled frontend and backend.
- Easily scalable on cloud infrastructure.

---

## 🛠️ Tech Stack

### Backend
- Python 3.10  
- FastAPI  
- Google Gemini Pro  
- AWS S3  
- Docker & Docker Compose  
- Nginx (Reverse Proxy)  
- Ubuntu 22.04 LTS (AWS EC2)

### Frontend
- HTML5  
- CSS3  
- JavaScript (ES6+)

---

## 📁 Project Structure
project-root/
├── audio/
│ ├── .env.example
│ ├── .gitignore
│ ├── docker-compose.yml
│ ├── Dockerfile
│ ├── main.py
│ ├── requirements.txt
│ └── transcription_service.py
│
├── frontend/
│ ├── index.html
│ ├── script.js
│ └── style.css
│
└── README.md


---

## ⚙️ System Setup & Installation

### Prerequisites
- Docker and Docker Compose  
- AWS S3 bucket + IAM credentials  
- Google Gemini API key  
- Git

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
2️⃣ Configure Backend Environment

Navigate to backend:

cd audio


Create environment file:

cp .env.example .env


Fill in your credentials:

GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"

S3_BUCKET_NAME="your-unique-s3-bucket-name"
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
AWS_REGION="your-aws-region"

3️⃣ Run Backend Locally
docker-compose up --build


Access:

API: http://localhost:8000

Docs: http://localhost:8000/docs

4️⃣ Run Frontend Locally

Navigate:

cd frontend


Update script.js:

const EC2_IP = 'localhost';


Open index.html in a browser.

☁️ Deployment on AWS EC2
1. Launch & Prepare EC2 Instance

Ubuntu 22.04 LTS

Security Group:

Port 22 — My IP

Port 80 — Anywhere

Port 8000 — Anywhere

Install dependencies:

sudo apt update
sudo apt install docker.io docker-compose git -y

2. Deploy Code on EC2
git clone https://github.com/your-username/your-repository.git
cd your-repository/audio
cp .env.example .env


Fill .env with production values.

Update frontend (script.js):

const EC2_IP = "YOUR_PUBLIC_EC2_IP";

3. Configure Nginx Reverse Proxy

Install Nginx:

sudo apt install nginx -y


Edit config:

sudo nano /etc/nginx/sites-available/default


Paste:

server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    root /home/ubuntu/your-repository/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /transcribe/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}


Restart:

sudo systemctl restart nginx

4. Run Backend on EC2
cd audio
docker-compose up -d --build


Access your app:

http://YOUR_EC2_PUBLIC_IP

🧪 API Example
curl -X POST "http://localhost:8000/transcribe/" \
  -F "file=@audio.wav"

🔒 Security Recommendations

Do not commit .env

Enable S3 bucket encryption

Use HTTPS (Nginx + Certbot)

Prefer IAM roles over access keys
