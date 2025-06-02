from flask import Flask, request, jsonify
from handler import handle

app = Flask(__name__)

@app.route("/", methods=["POST"])
def main_route():
    req = request.get_data(as_text=True)
    return handle(req)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
