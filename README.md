AI-Powered Audio Transcription Service
This project is a complete full-stack application that provides a web-based service for transcribing audio files using Google's Gemini AI. The backend is a robust FastAPI application containerized with Docker, and it uses AWS S3 for persistent file storage. The frontend is a clean, responsive interface built with vanilla HTML, CSS, and JavaScript.
Features
AI-Powered Transcription: Utilizes the powerful Google Gemini Pro model for high-accuracy speech-to-text conversion.
Secure Cloud Storage: All uploaded audio files and generated transcripts are securely stored in a private AWS S3 bucket.
RESTful API: A high-performance, asynchronous API built with FastAPI.
Interactive Frontend:
Drag-and-drop file uploader.
Real-time upload progress bar.
Displays the final transcription directly on the page.
Containerized & Portable: The entire backend is containerized with Docker, ensuring consistent and reliable deployment across any environment.
Scalable Architecture: Built with a decoupled frontend and backend, ready to be scaled independently.
Technology Stack
Backend
Language: Python 3.10
Framework: FastAPI
AI Model: Google Gemini Pro
Cloud Storage: AWS S3
Containerization: Docker & Docker Compose
Server: Ubuntu 22.04 LTS on AWS EC2
Web Server / Reverse Proxy: Nginx
Frontend
HTML5
CSS3
JavaScript (ES6+)
Project Structure
code
Code
project-root/
├── audio/                  # Backend Application
│   ├── .env.example        # Example environment file
│   ├── .gitignore
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── main.py             # FastAPI app and CORS setup
│   ├── requirements.txt
│   └── transcription_service.py # Core logic for S3/Gemini
│
├── frontend/               # Frontend Application
│   ├── index.html
│   ├── script.js
│   └── style.css
│
└── README.md
System Setup and Installation
Follow these instructions to get the project running on your local machine for development and testing.
Prerequisites
Docker and Docker Compose installed.
An AWS Account with an S3 bucket and IAM credentials.
A Google Cloud Platform Account with a Gemini API key.
Git installed.
1. Clone the Repository
code
Bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
2. Configure Backend Environment
Navigate to the backend directory:
code
Bash
cd audio
```2.  Create your environment file by copying the example:
```bash
cp .env.example .env
Open the .env file and fill in your credentials:
code
Code
# --- Google Gemini ---
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"

# --- AWS S3 ---
S3_BUCKET_NAME="your-unique-s3-bucket-name"
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
AWS_REGION="your-aws-region" # e.g., us-east-1
3. Run the Backend Locally
From the /audio directory, build and run the Docker container:
code
Bash
docker-compose up --build
The backend API will now be running at http://localhost:8000. You can see the interactive API documentation at http://localhost:8000/docs.
4. Configure and Run the Frontend Locally
Navigate to the frontend directory in a separate terminal:
code
Bash
cd frontend
Open the script.js file and ensure the EC2_IP constant is set for local testing:
code
JavaScript
// Make sure this is set to 'localhost' for local testing
const EC2_IP = 'localhost';
Open the index.html file directly in your web browser.
You can now drag and drop an audio file to test the full application stack running on your local machine.
Deployment to AWS EC2
These steps outline the process for deploying the application to a live server.
1. Launch and Prepare EC2 Instance
Launch an AWS EC2 instance (e.g., t2.micro Free Tier) using an Ubuntu Server 22.04 LTS AMI.
Configure the Security Group to allow inbound traffic on:
Port 22 (SSH): Source set to My IP for secure access.
Port 80 (HTTP): Source set to Anywhere (0.0.0.0/0) for public web access.
Port 8000 (TCP): Source set to Anywhere (0.0.0.0/0) so Nginx can access the API.
SSH into your instance and install Docker, Docker Compose, and Git.
2. Deploy the Code
Clone your Git repository onto the EC2 instance.
Navigate into the /audio directory and create the .env file with your production credentials, just as you did locally.
Navigate into the /frontend directory and create the HTML/CSS/JS files. In script.js, change the EC2_IP to your server's public IP address.
3. Configure Nginx
Install Nginx on the server: sudo apt-get install nginx -y.
Configure Nginx to act as a reverse proxy. Edit the default site configuration:
code
Bash
sudo nano /etc/nginx/sites-available/default
Replace the contents with the following, making sure to update the root path and server_name:
code
Nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    # Path to your frontend files
    root /home/ubuntu/your-repository/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Forward API requests to the Docker container
    location /transcribe/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
Restart Nginx to apply the changes: sudo systemctl restart nginx.
4. Run the Backend
Navigate to the /audio directory on your EC2 instance and run the application in detached mode:
code
Bash
docker-compose up -d --build
Your application is now live! You can access the frontend by navigating to your EC2 instance's public IP address in a web browser.
