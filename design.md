Generate a synthetic cyber fraud investigation dataset for a forensic 
analysis tool called NIDARSHAN. The dataset must be internally consistent 
across all files — the same entities (phone numbers, IMEIs, UPI handles, 
IP addresses) must appear across multiple files so the correlation engine 
can find hidden links.

THE FRAUD SCENARIO (read this before generating anything):

A victim (Ramesh Sharma) receives a spoofed call from a suspect who 
convinces him to share an OTP. ₹50,000 is immediately transferred from 
his UPI account to Mule 1. Mule 1 forwards ₹48,500 to Mule 2 within 
6 minutes. Mule 2 forwards ₹47,000 to Mule 3 within 4 minutes. 
Mule 3 withdraws cash at an ATM within 12 minutes of receiving it. 
The entire chain completes in under 25 minutes.

FIXED ENTITIES (use these exact values across all files for consistency):

Victim:
  Name: Ramesh Sharma
  Phone: 9876543210
  UPI: ramesh.sharma99@okaxis
  Account: 919100012345678

Suspect / Caller (Mule 0):
  Phone: 9811234567
  IMEI: 358234091674523   ← use this IMEI for TWO different phones (SIM swap)
  IP: 103.45.67.89

Mule 1:
  Phone: 9900112233
  IMEI: 358234091674523   ← SAME IMEI as suspect (this is the key SIM swap link)
  UPI: cashout.mule1@paytm
  Account: 50120034567891
  IP: 103.45.67.89        ← SAME IP as suspect (second cross-file link)

Mule 2:
  Phone: 9811223344
  IMEI: 490123876543219
  UPI: transfer.m2@gpay
  Account: 60130045678912
  IP: 182.72.114.56

Mule 3:
  Phone: 9922334455
  IMEI: 357890123456789
  UPI: final.hop3@ybl
  Account: 70140056789123
  IP: 182.72.114.56       ← SAME IP as Mule 2

TIMELINE (use these exact timestamps, date: 2026-10-02):

09:51:00 — Suspect calls victim from 9811234567 (2 min 14 sec, tower: Delhi-Rohini-07)
09:53:20 — Suspect calls victim again (45 sec)
09:54:40 — Suspect sends SMS to victim with fake OTP prompt
09:55:10 — Victim calls bank helpline (real number, spoofed back)
10:02:33 — UPI transaction: Victim → Mule 1, ₹50,000
10:08:47 — UPI transaction: Mule 1 → Mule 2, ₹48,500
10:12:19 — UPI transaction: Mule 2 → Mule 3, ₹47,000
10:21:04 — ATM withdrawal by Mule 3, ₹46,000, ATM: Punjab National Bank, Rohini Sec-7
10:23:15 — Mule 1 phone goes offline (tower de-registers)
10:24:02 — Suspect IMEI 358234091674523 re-registers on new SIM (9944556677)

FILE 1: sample_cdr.csv
Columns: call_id, caller_number, receiver_number, imei, imsi, 
         duration_seconds, call_type, timestamp, tower_id, tower_location

Generate 28 rows. Must include:
- Suspect calling victim (from timeline above, 2 calls)
- Suspect calling Mule 1 to coordinate (09:48, 1 min 30 sec)
- Mule 1 calling Mule 2 after receiving money (10:09:12, 28 sec)
- Mule 2 calling Mule 3 to confirm (10:10:55, 15 sec)
- IMEI 358234091674523 appearing on both phone 9811234567 AND 9900112233 
  (this is the SIM swap — one device, two SIMs)
- 8 filler rows of unrelated calls from different numbers to make 
  the suspect's calls non-obvious
- Victim calling 9811234567 back at 10:31 (after realizing fraud)
- Realistic IMSI values (15 digits, starting with 404 for India)
- Tower locations: Delhi-Rohini-07, Delhi-Rohini-12, Delhi-Pitampura-03, 
  Delhi-Shalimar-Bagh-01
- call_type values: OUTGOING, INCOMING, MISSED

FILE 2: sample_upi.csv
Columns: transaction_id, sender_upi, receiver_upi, sender_account, 
         receiver_account, amount, timestamp, status, bank, 
         transaction_type, device_ip, reference_id

Generate 22 rows. Must include:
- The 3 mule chain transactions from the timeline
- 2 small legitimate transactions from victim in previous days 
  (grocery, recharge) to make the ₹50,000 look anomalous
- 3 filler transactions between unrelated UPI handles
- Mule 1 account receiving another small transaction the day before 
  (₹8,000 from a different victim UPI — shows repeat mule behavior)
- device_ip for mule transactions matching the IP addresses above
- status values: SUCCESS, FAILED, PENDING
- transaction_type values: P2P, P2M, REFUND
- reference_ids starting with UPI + 12 digits

FILE 3: sample_ipdr.csv
Columns: session_id, ip_address, mac_address, phone_number, imei, 
         session_start, session_end, data_transferred_mb, isp, 
         device_model

Generate 18 rows. Must include:
- IP 103.45.67.89 appearing for phone 9811234567 (suspect) at 09:45
- IP 103.45.67.89 appearing for phone 9900112233 (Mule 1) at 10:00
  (same IP, different phone — second cross-file correlation point)
- IP 182.72.114.56 appearing for both Mule 2 (9811223344) and 
  Mule 3 (9922334455) — they used the same WiFi hotspot
- Sessions timed around the fraud window
- ISP values: Reliance Jio, Bharti Airtel, BSNL, Vodafone Idea
- device_model values: Samsung Galaxy M32, Redmi Note 11, 
  Vivo V21, Realme 8i (realistic Indian mid-range phones)
- 4 filler rows with unrelated IPs and phones

FILE 4: sample_bank.csv
Columns: entry_id, account_number, transaction_ref, credit_amount, 
         debit_amount, balance_after, timestamp, transaction_type, 
         counterparty_name, counterparty_account, narration, branch_ifsc

Generate 25 rows covering 3 accounts (victim + Mule 1 + Mule 3). Must include:
- Victim account: balance 67,400 before fraud, debit 50,000, balance 17,400
- Victim account: 3 prior normal transactions (salary, grocery, mobile recharge)
- Mule 1 account: credit 48,500 from UPI, debit same amount within 6 min
  (rapid credit-then-debit is a key anomaly indicator)
- Mule 3 account: credit 46,000 from UPI, ATM debit 46,000 within 12 min
- narration values: UPI/P2P, NEFT, ATM-WDL, POS, IMPS
- IFSC codes: realistic Indian bank codes (HDFC0001234, PYTM0000001, etc.)

FILE 5: sample_chat.txt
Format: WhatsApp export format exactly as it appears when exported from phone.
Date header line, then messages in this format:
[HH:MM, DD/MM/YYYY] Contact Name: message text

Generate 35 messages between "Unknown" (suspect) and "Ravi" (Mule 1 recruit).
Timeline: conversation starts 2 days before the fraud.

Must include naturally:
- Mule recruitment pitch in Hindi-English mix:
  "bhai tera account 2-3 din ke liye chahiye, koi risk nahi, 
   30% commission pakka milega"
- Mule 1 asking questions and being reassured
- Day before fraud: confirming UPI handle cashout.mule1@paytm
- Day of fraud (morning): "aaj kaam hoga, ready reh"
- During fraud: "abhi transfer aaya? forward kar 9811223344@gpay pe"
- OTP-related message: "OTP share mat karna apna, bas receive karna hai"
- After fraud: "kaam ho gaya, kal milte hain, cash leke"
- Suspect's phone number mentioned once: "9811234567 pe call kar"
- Amount mentioned: "50 hazaar aane wale hain"
- Suspect asking Mule 1 to go offline after: "phone band kar ab"
- Mix of Devanagari and Roman script for Hindi words
- Some typos and abbreviations like: "kl", "thk", "msg", "abhi", "phir"
- A few voice note placeholders: "<Media omitted>"

FILE 6: sample_email.eml
A phishing email sent to the victim before the call.
Standard .eml format with full headers.

Must include:
- From: fake bank email (sbi.alert.secure@gmail.com pretending to be SBI)
- To: rameshsharma99@gmail.com
- Subject: "URGENT: Your SBI account will be blocked - Verify NOW"
- Received headers containing IP: 45.134.212.73 (different suspicious IP)
- X-Originating-IP: 45.134.212.73
- Body: phishing content asking victim to call a fake helpline number 
  (9811234567 — the suspect's number, linking email to CDR)
- HTML body with a fake SBI login button
- Date: one day before the fraud

OUTPUT REQUIREMENTS:

1. Generate all 6 files with exact column names as specified.
2. All dates use format: YYYY-MM-DD HH:MM:SS
3. All Indian phone numbers start with 9 and are exactly 10 digits.
4. All IMEIs are exactly 15 digits.
5. All amounts are in Indian Rupees, stored as numbers without ₹ symbol.
6. All account numbers are realistic Indian bank account lengths (11-18 digits).
7. CSV files use comma delimiter, UTF-8 encoding, with header row.
8. The WhatsApp chat file uses UTF-8, includes Devanagari characters.
9. Do not add any explanatory comments inside the files themselves.
10. The cross-file entity links must be exact character matches 
    — same phone numbers, same IP addresses, same IMEI values.

After generating all files, print a ENTITY LINK SUMMARY showing 
which specific values appear in which files, so the correlation 
engine can be validated:

Example format:
IMEI 358234091674523 → CDR rows 3,7,19 + IPDR rows 2,5
IP 103.45.67.89      → IPDR rows 2,5 + UPI rows 4,7
Phone 9811234567     → CDR rows 3,4 + IPDR row 2 + email body