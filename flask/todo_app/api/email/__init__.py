import asyncio
from email.message import EmailMessage
import smtplib

async def send_email(sender_email, receiver_email, subject, text):
    message = EmailMessage()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = subject
    message.set_content(text)

    # Gmail SMTP server settings
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    username = "canderson9625"

    with open(r".secrets/email_password.txt", "r") as secret:
        password = secret.readline()

        with smtplib.SMTP(smtp_server, smtp_port) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)

# Replace with your email details
sender_email = "responsibili-buddy@calvins.work"
receiver_email = "canderson9625@gmail.com"
subject = "TODO_APP: "
text = "This is a test email."

asyncio.run(send_email(sender_email, receiver_email, subject, text))