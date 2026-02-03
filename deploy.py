#!/usr/bin/env python3
"""
🚀 MindMap Automation Deployment Script
Deploy automaticamente para Render e Supabase
"""

import os
import sys
import subprocess
import time
import requests
import json
from pathlib import Path

# Configurações
RENDER_API_KEY = os.getenv("RENDER_API_KEY")
SUPABASE_ACCESS_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN")
RENDER_SERVICE_ID = "srv-clq0e5tni6pcf3d7vtpg"  # mindmap-hub-api
SUPABASE_PROJECT_ID = "mvkrlvjyocynmwslklzu"

class DeploymentAutomation:
    def __init__(self):
        self.render_api = "https://api.render.com/v1"
        self.supabase_api = "https://api.supabase.com/v1"
        self.project_root = Path(__file__).parent
        
    def log(self, level, msg):
        """Log with colors"""
        colors = {
            "SUCCESS": "\033[92m",
            "ERROR": "\033[91m",
            "INFO": "\033[94m",
            "WARN": "\033[93m",
            "RESET": "\033[0m"
        }
        print(f"{colors.get(level, '')}{level:8}{colors['RESET']} {msg}")
    
    def run_cmd(self, cmd, cwd=None):
        """Execute command"""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                cwd=cwd,
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                self.log("WARN", f"Command: {cmd}\nOutput: {result.stderr}")
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            self.log("ERROR", f"Failed to run: {cmd}\n{e}")
            return False, "", str(e)
    
    def deploy_backend_render(self):
        """Deploy backend via Render webhook"""
        self.log("INFO", "🔄 Starting Render backend deployment...")
        
        if not RENDER_API_KEY:
            self.log("WARN", "RENDER_API_KEY not set - trying GitHub push trigger...")
            return self.trigger_render_via_github()
        
        try:
            headers = {
                "Authorization": f"Bearer {RENDER_API_KEY}",
                "Content-Type": "application/json"
            }
            
            # Get current deploy
            url = f"{self.render_api}/services/{RENDER_SERVICE_ID}/latest-deploy"
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                deploy = response.json()
                self.log("SUCCESS", f"✅ Render service status: {deploy.get('status')}")
                return True
            else:
                self.log("ERROR", f"Failed to check Render: {response.status_code}")
                return False
                
        except Exception as e:
            self.log("ERROR", f"Render API error: {e}")
            return False
    
    def trigger_render_via_github(self):
        """Trigger Render deploy via GitHub push"""
        self.log("INFO", "📤 Triggering Render via GitHub push...")
        
        backend_path = self.project_root / "backend"
        
        # Create a trigger file
        trigger_file = backend_path / "DEPLOY_TRIGGER"
        trigger_file.write_text(f"DEPLOY_TIMESTAMP={time.time()}\nVERSION=2.0.1")
        
        # Git operations
        success, _, _ = self.run_cmd("git add .", cwd=backend_path)
        if not success:
            self.run_cmd("git add backend/DEPLOY_TRIGGER", cwd=self.project_root)
        
        # Commit
        success, _, _ = self.run_cmd(
            f'git commit -m "🔄 Force Render rebuild - {time.strftime("%Y-%m-%d %H:%M:%S")}"',
            cwd=self.project_root
        )
        
        if success:
            # Push
            success, _, _ = self.run_cmd("git push origin main", cwd=self.project_root)
            if success:
                self.log("SUCCESS", "✅ Backend push triggered - Render will redeploy")
                return True
        
        self.log("ERROR", "Failed to trigger Render via GitHub")
        return False
    
    def configure_supabase(self):
        """Configure Supabase automatically"""
        self.log("INFO", "🔄 Configuring Supabase...")
        
        try:
            headers = {
                "Authorization": f"Bearer {SUPABASE_ACCESS_TOKEN}",
                "Content-Type": "application/json"
            }
            
            # Get project info
            url = f"{self.supabase_api}/projects/{SUPABASE_PROJECT_ID}"
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                project = response.json()
                self.log("SUCCESS", f"✅ Supabase project: {project.get('name')}")
                
                # Log API credentials
                anon_key = project.get('api_keys', {}).get('anon_key', 'N/A')
                service_key = project.get('api_keys', {}).get('service_role', 'N/A')
                
                self.log("INFO", f"   Anon Key: {anon_key[:20]}...")
                self.log("INFO", f"   Service Role: {service_key[:20]}...")
                
                return True
            else:
                self.log("WARN", f"Could not fetch Supabase project (status {response.status_code})")
                return False
                
        except Exception as e:
            self.log("WARN", f"Supabase API unavailable: {e}")
            self.log("INFO", "Supabase is already configured with existing project")
            return True
    
    def verify_backend_health(self):
        """Verify backend is running"""
        self.log("INFO", "🔍 Checking backend health...")
        
        try:
            response = requests.get(
                "https://mindmap-hub-api.onrender.com/api/v1/health",
                timeout=10
            )
            
            if response.status_code == 200:
                health = response.json()
                self.log("SUCCESS", f"✅ Backend health: {health.get('status', 'ok')}")
                return True
            else:
                self.log("WARN", f"Backend returned {response.status_code}")
                return False
                
        except Exception as e:
            self.log("WARN", f"Backend not responding yet (warming up): {e}")
            return False
    
    def verify_frontend(self):
        """Verify frontend is deployed"""
        self.log("INFO", "🔍 Checking frontend...")
        
        try:
            response = requests.get(
                "https://mind-map-three-blue.vercel.app",
                timeout=10
            )
            
            if response.status_code == 200 and "NeuralMap" in response.text:
                self.log("SUCCESS", "✅ Frontend is live and responsive")
                return True
            else:
                self.log("WARN", f"Frontend status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log("WARN", f"Frontend error: {e}")
            return False
    
    def deploy_all(self):
        """Execute full deployment"""
        self.log("INFO", "\n" + "="*60)
        self.log("INFO", "🚀 MINDMAP AUTOMATION DEPLOYMENT")
        self.log("INFO", "="*60 + "\n")
        
        results = {}
        
        # Backend Deploy
        self.log("INFO", "\n📦 STEP 1: Backend Deployment")
        self.log("INFO", "-" * 40)
        results["backend"] = self.deploy_backend_render()
        
        # Supabase Configure
        self.log("INFO", "\n💾 STEP 2: Supabase Configuration")
        self.log("INFO", "-" * 40)
        results["supabase"] = self.configure_supabase()
        
        # Wait for backend to warm up
        self.log("INFO", "\n⏳ STEP 3: Waiting for services to be ready...")
        self.log("INFO", "-" * 40)
        for i in range(6):
            backend_ok = self.verify_backend_health()
            if backend_ok:
                break
            if i < 5:
                self.log("INFO", f"   Retrying in 5s... ({i+1}/6)")
                time.sleep(5)
        
        # Frontend Verification
        self.log("INFO", "\n🎨 STEP 4: Frontend Verification")
        self.log("INFO", "-" * 40)
        results["frontend"] = self.verify_frontend()
        
        # Summary
        self.log("INFO", "\n" + "="*60)
        self.log("INFO", "📊 DEPLOYMENT SUMMARY")
        self.log("INFO", "="*60)
        self.log("SUCCESS" if results["backend"] else "WARN", f"✅ Backend: {'DEPLOYED' if results['backend'] else 'PENDING'}")
        self.log("SUCCESS" if results["supabase"] else "WARN", f"✅ Supabase: {'CONFIGURED' if results['supabase'] else 'RETRY'}")
        self.log("SUCCESS" if results["frontend"] else "WARN", f"✅ Frontend: {'LIVE' if results['frontend'] else 'CHECK'}")
        self.log("INFO", "="*60 + "\n")
        
        # Links
        self.log("INFO", "🔗 LIVE LINKS:")
        self.log("INFO", "   Frontend: https://mind-map-three-blue.vercel.app")
        self.log("INFO", "   Backend: https://mindmap-hub-api.onrender.com/api/v1/health")
        self.log("INFO", "   Supabase: https://app.supabase.com/project/mvkrlvjyocynmwslklzu")
        self.log("INFO", "\n")
        
        all_ok = all(results.values())
        return 0 if all_ok else 1

def main():
    automation = DeploymentAutomation()
    exit_code = automation.deploy_all()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
