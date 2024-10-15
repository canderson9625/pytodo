from routes import app

# both importable and executable as standalone script
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9080)
   # app.run(host='localhost', port=9080, debug=True)