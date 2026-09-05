from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.bot import MeeshoBotAutomation

app = Flask(__name__, 
            template_folder='../templates',
            static_folder='../static')
CORS(app)

# Initialize bot
bot = MeeshoBotAutomation()

# Store OTPs temporarily (in production use Redis or database)
otp_store = {}

@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')

@app.route('/api/check', methods=['POST'])
def check_number():
    """
    Check if number is fresh and get offer
    """
    data = request.json
    phone = data.get('phone', '').strip()
    
    if not phone or len(phone) != 10 or not phone.isdigit():
        return jsonify({
            'success': False,
            'error': 'INVALID_PHONE',
            'message': 'Please enter a valid 10-digit phone number'
        }), 400
    
    try:
        success, hunt_data = bot.check_and_hunt(phone)
        
        if not success:
            error = hunt_data.get('error', 'Unknown')
            message = hunt_data.get('message', error)
            
            return jsonify({
                'success': False,
                'error': error,
                'message': message
            }), 400
        
        # Store phone temporarily for OTP session
        otp_store[phone] = {
            'sent_at': datetime.now().isoformat(),
            'attempts': 0
        }
        
        return jsonify({
            'success': True,
            'message': f'✅ Fresh number with ₹{hunt_data.get("fod_value", 0)} OFF offer!',
            'offer': hunt_data.get('fod_value', 0),
            'phone': phone
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'SERVER_ERROR',
            'message': str(e)
        }), 500

@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    """
    Send OTP to the phone
    """
    data = request.json
    phone = data.get('phone', '').strip()
    
    if not phone:
        return jsonify({
            'success': False,
            'error': 'PHONE_REQUIRED',
            'message': 'Phone number is required'
        }), 400
    
    try:
        success, otp_data = bot.send_otp(phone)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'OTP_SEND_FAILED',
                'message': otp_data.get('error', 'Failed to send OTP')
            }), 400
        
        # Update OTP store
        if phone in otp_store:
            otp_store[phone]['sent_at'] = datetime.now().isoformat()
            otp_store[phone]['attempts'] += 1
        
        return jsonify({
            'success': True,
            'message': f'✅ OTP sent via {otp_data.get("mode", "SMS")}',
            'mode': otp_data.get('mode', 'SMS')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'SERVER_ERROR',
            'message': str(e)
        }), 500

@app.route('/api/verify', methods=['POST'])
def verify_otp():
    """
    Verify OTP and complete registration
    """
    data = request.json
    phone = data.get('phone', '').strip()
    otp = data.get('otp', '').strip()
    offer = data.get('offer', 0)
    
    if not phone or not otp:
        return jsonify({
            'success': False,
            'error': 'MISSING_FIELDS',
            'message': 'Phone and OTP are required'
        }), 400
    
    if len(otp) < 4:
        return jsonify({
            'success': False,
            'error': 'INVALID_OTP',
            'message': 'OTP must be at least 4 digits'
        }), 400
    
    try:
        # Verify OTP
        success, verify_data = bot.verify_otp(otp)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'VERIFICATION_FAILED',
                'message': verify_data.get('error', 'OTP verification failed')
            }), 400
        
        # Extract session data (without saving to file)
        session_data = bot.extract_session_data(phone)
        
        # Clean up OTP store
        if phone in otp_store:
            del otp_store[phone]
        
        return jsonify({
            'success': True,
            'message': '✅ Registration complete!',
            'phone': phone,
            'offer': offer,
            'session': session_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'SERVER_ERROR',
            'message': str(e)
        }), 500

@app.route('/api/progress', methods=['GET'])
def get_progress():
    """
    Get hunting progress
    """
    phone = request.args.get('phone', '').strip()
    
    if not phone:
        return jsonify({
            'success': False,
            'error': 'PHONE_REQUIRED',
            'message': 'Phone number is required'
        }), 400
    
    try:
        progress = bot.get_progress(phone)
        
        if progress:
            return jsonify({
                'success': True,
                'progress': progress
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No progress data available'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'SERVER_ERROR',
            'message': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

# Vercel requires the app to be exported as 'app'
app.debug = False

if __name__ == '__main__':
    app.run(debug=True, port=5000)
