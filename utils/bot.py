import requests
import time
import json
from typing import Optional, Dict, Tuple
from datetime import datetime
from pathlib import Path

class MeeshoBotAutomation:
    """Fully Automatic Meesho Bot - No Storage Version"""
    
    def __init__(self, base_url: str = "https://pricetrackerpro.fojadomain.fun"):
        
        # ==================== HARDCODED TOKEN ====================
        self.token = "6551617050.9ac77f884643ec4f"
        
        # ==================== HARDCODED REFERRAL ====================
        self.referral_code = "4zklom"
        self.referral_link = "https://app.meesho.com/2yoV/r99th0qd?via=4zklom"
        
        self.base_url = base_url
        
        self.headers = {
            "x-token": self.token,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        self.hunt_tier = 180
        self.auto_retry = True
        self.max_retries = 3
    
    # ==================== CORE API METHODS ====================
    
    def check_and_hunt(self, phone: str, retry_count: int = 0) -> Tuple[bool, Dict]:
        """
        Check number and automatically hunt for highest offer
        Returns: (success, data)
        """
        try:
            url = f"{self.base_url}/api/login/start"
            
            resp = requests.post(
                url,
                headers=self.headers,
                json={
                    "phone": phone,
                    "referral": self.referral_code,
                    "tier": self.hunt_tier
                },
                timeout=120
            )
            
            if not resp.ok:
                return False, {"error": f"API Error: {resp.status_code}"}
            
            data = resp.json()
            
            if not data.get('ok'):
                error = data.get('error', 'Unknown error')
                
                # Check if already registered
                if 'already_registered' in error.lower():
                    return False, {"error": "ALREADY_REGISTERED", "message": "Number already registered on Meesho"}
                
                # Auto retry for hunt_retry
                if 'hunt_retry' in error and self.auto_retry and retry_count < self.max_retries:
                    retry_count += 1
                    time.sleep(3)
                    return self.check_and_hunt(phone, retry_count)
                
                if retry_count >= self.max_retries:
                    return False, {"error": "MAX_RETRIES", "message": f"Could not find offer after {self.max_retries} attempts"}
                
                return False, {"error": error}
            
            # Check if number is fresh and has offer
            registered = data.get('registered', False)
            fod_value = data.get('fod_value', 0)
            
            if registered:
                return False, {"error": "ALREADY_REGISTERED", "message": "Number already registered on Meesho"}
            
            if fod_value <= 0:
                return False, {"error": "NO_OFFER", "message": "No offer available for this number"}
            
            return True, data
            
        except requests.exceptions.Timeout:
            return False, {"error": "TIMEOUT", "message": "Request timed out - try again"}
        except requests.exceptions.ConnectionError:
            return False, {"error": "CONNECTION_ERROR", "message": "Network connection error - check your internet"}
        except Exception as e:
            return False, {"error": str(e)}
    
    def send_otp(self, phone: str, retry_count: int = 0) -> Tuple[bool, Dict]:
        """Send OTP to the phone with retry"""
        try:
            url = f"{self.base_url}/api/login/send_otp"
            
            resp = requests.post(
                url,
                headers=self.headers,
                json={},
                timeout=30
            )
            
            if not resp.ok:
                return False, {"error": f"API Error: {resp.status_code}"}
            
            data = resp.json()
            
            if not data.get('ok'):
                error = data.get('error', 'OTP send failed')
                
                # Retry on failure
                if retry_count < self.max_retries:
                    retry_count += 1
                    time.sleep(3)
                    return self.send_otp(phone, retry_count)
                
                return False, {"error": error}
            
            return True, data
            
        except Exception as e:
            return False, {"error": str(e)}
    
    def verify_otp(self, otp: str) -> Tuple[bool, Dict]:
        """Verify OTP and save account"""
        try:
            url = f"{self.base_url}/api/login/verify"
            
            resp = requests.post(
                url,
                headers=self.headers,
                json={"otp": otp},
                timeout=30
            )
            
            if not resp.ok:
                return False, {"error": f"API Error: {resp.status_code}"}
            
            data = resp.json()
            
            if not data.get('ok'):
                return False, {"error": data.get('error', 'Verification failed')}
            
            return True, data
            
        except Exception as e:
            return False, {"error": str(e)}
    
    def extract_session_data(self, phone: str) -> Optional[Dict]:
        """Extract session data without saving to file"""
        try:
            url = f"{self.base_url}/api/export"
            
            resp = requests.get(
                url,
                params={"phone": phone},
                headers=self.headers,
                timeout=30
            )
            
            if not resp.ok:
                return None
            
            data = resp.json()
            
            if not data.get('ok'):
                return None
            
            session_data = data.get('export', {})
            
            if not session_data:
                return None
            
            # Validate session
            if not self._validate_session(session_data):
                return None
            
            return session_data
            
        except Exception:
            return None
    
    def _validate_session(self, session_data: Dict) -> bool:
        """Validate if session has all required fields"""
        required_fields = ['phone', 'user_id', 'xo_token']
        for field in required_fields:
            if not session_data.get(field):
                return False
        return True
    
    def get_progress(self, phone: str) -> Optional[Dict]:
        """Get real-time progress during hunting"""
        try:
            url = f"{self.base_url}/api/login/progress"
            
            resp = requests.get(
                url,
                params={"phone": phone},
                headers=self.headers,
                timeout=10
            )
            
            if resp.ok:
                data = resp.json()
                if data.get('ok'):
                    return data
            return None
        except:
            return None
