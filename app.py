from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Simulated user database
users_db = {
    "user1": {"password": "pass1", "name": "Alice", "age": 30, "gender": "female"},
    "user2": {"password": "pass2", "name": "Bob", "age": 25, "gender": "male"},
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = users_db.get(username)
    
    if user and user['password'] == password:
        return jsonify({"status": "success", "message": f"Welcome {user['name']}!"}), 200
    else:
        return jsonify({"status": "error", "message": "Invalid username or password."}), 401

@app.route('/terminate_exam', methods=['POST'])
def terminate_exam():
    data = request.json
    reason = data['reason']
    user_info = data['user']
    print(f"Exam terminated for {user_info['name']} ({user_info['age']} years, {user_info['gender']}) due to {reason}")
    return jsonify({"status": "terminated", "message": f"Exam terminated due to {reason}"}), 200

if __name__ == '__main__':
    app.run(debug=True)
