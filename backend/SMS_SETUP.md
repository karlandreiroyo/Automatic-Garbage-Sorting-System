# SMS Setup (Password Reset via Phone)

When users enter their **phone number** (not email) on the Reset Password screen, the verification code is sent via **SMS** to that number instead of email.

## 1. Get a Semaphore API Key

1. Sign up at [Semaphore](https://semaphore.co/)
2. Log in and get your API key from the dashboard
3. Philippine SMS: ~₱0.50 per message (see [Semaphore pricing](https://semaphore.co/faq))

## 2. Add to `backend/.env`

```env
SEMAPHORE_API_KEY=your_semaphore_api_key_here
SMS_SENDER=SEMAPHORE
```

- **SEMAPHORE_API_KEY** (required): Your Semaphore API key
- **SMS_SENDER** (optional): Sender name (max 11 alphanumeric). Defaults to `SEMAPHORE` if omitted. Custom names may require approval.

## 3. Restart the Backend

```bash
cd backend
npm start
```

## Behavior

- **Reset by email** → Code is sent via **email** (SMTP in `.env`)
- **Reset by phone** → Code is sent via **SMS** (Semaphore in `.env`)

If `SEMAPHORE_API_KEY` is not set, the code is still generated and logged in the terminal, but no SMS is sent.
