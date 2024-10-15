#!/bin/zsh
function activate_and_run() {
    # Activate virtual environment
    source venv/bin/activate

    # Check if activation was successful
    if [[ $? -eq 0 ]]; then
        # Run your application
        python flask/app.py
    else
        zsh .scripts/.venv.sh
        activate_and_run
    fi
}

activate_and_run