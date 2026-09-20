import * as fs from 'fs';
import * as crypto from 'crypto';

function randomPhone() {
    return '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

function randomIMEI() {
    return '35' + Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
}

function randomIMSI() {
    return '404' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

function randomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomUPI() {
    return `user${Math.floor(Math.random() * 10000)}@upi`;
}

function randomAccount() {
    return '9' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

const victims = {
    Ramesh: { phone: '9876543210', imei: randomIMEI(), imsi: randomIMSI(), upi: 'ramesh.sharma99@okaxis', account: '919100012345678' }
};

const suspect = { phone: '9811234567', imei: '358234091674523', imsi: randomIMSI(), ip: '103.45.67.89' };
const mule1 = { phone: '9900112233', imei: '358234091674523', imsi: randomIMSI(), upi: 'cashout.mule1@paytm', account: '50120034567891', ip: '103.45.67.89' };
const mule2 = { phone: '9811223344', imei: '490123876543219', imsi: randomIMSI(), upi: 'transfer.m2@gpay', account: '60130045678912', ip: '182.72.114.56' };
const mule3 = { phone: '9922334455', imei: '357890123456789', imsi: randomIMSI(), upi: 'final.hop3@ybl', account: '70140056789123', ip: '182.72.114.56' };

// Helpers for CSV building
function buildCsv(headers: string[], rows: any[][]) {
    return [headers.join(',')].concat(rows.map(row => row.join(','))).join('\n');
}

// 1. generate sample_cdr.csv
const cdrHeaders = ['call_id', 'caller_number', 'receiver_number', 'imei', 'imsi', 'duration_seconds', 'call_type', 'timestamp', 'tower_id', 'tower_location'];
let cdrRows: any[] = [];
let cdrId = 1;

// Required rows
cdrRows.push([cdrId++, suspect.phone, victims.Ramesh.phone, suspect.imei, suspect.imsi, 134, 'OUTGOING', '2026-10-02 09:51:00', 'T-1001', 'Delhi-Rohini-07']);
cdrRows.push([cdrId++, suspect.phone, victims.Ramesh.phone, suspect.imei, suspect.imsi, 45, 'OUTGOING', '2026-10-02 09:53:20', 'T-1001', 'Delhi-Rohini-07']);
cdrRows.push([cdrId++, suspect.phone, mule1.phone, suspect.imei, suspect.imsi, 90, 'OUTGOING', '2026-10-02 09:48:00', 'T-1001', 'Delhi-Rohini-07']);
cdrRows.push([cdrId++, mule1.phone, mule2.phone, mule1.imei, mule1.imsi, 28, 'OUTGOING', '2026-10-02 10:09:12', 'T-2002', 'Delhi-Rohini-12']);
cdrRows.push([cdrId++, mule2.phone, mule3.phone, mule2.imei, mule2.imsi, 15, 'OUTGOING', '2026-10-02 10:10:55', 'T-3003', 'Delhi-Pitampura-03']);
cdrRows.push([cdrId++, victims.Ramesh.phone, suspect.phone, victims.Ramesh.imei, victims.Ramesh.imsi, 0, 'MISSED', '2026-10-02 10:31:00', 'T-4004', 'Delhi-Shalimar-Bagh-01']);

// Filler rows
for (let i = 0; i < 8; i++) {
    cdrRows.push([cdrId++, randomPhone(), randomPhone(), randomIMEI(), randomIMSI(), Math.floor(Math.random() * 300), 'OUTGOING', formatDate(randomDate(new Date('2026-10-02 08:00:00'), new Date('2026-10-02 12:00:00'))), `T-${Math.floor(1000 + Math.random()*9000)}`, 'Delhi-Unknown']);
}
// Sort CDRs by timestamp
cdrRows.sort((a, b) => a[7].localeCompare(b[7]));
fs.writeFileSync('sample_cdr.csv', buildCsv(cdrHeaders, cdrRows));

// 2. generate sample_upi.csv
const upiHeaders = ['transaction_id', 'sender_upi', 'receiver_upi', 'sender_account', 'receiver_account', 'amount', 'timestamp', 'status', 'bank', 'transaction_type', 'device_ip', 'reference_id'];
let upiRows: any[] = [];
let txnId = 1000;

function randomRef() {
    return 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

upiRows.push([txnId++, victims.Ramesh.upi, mule1.upi, victims.Ramesh.account, mule1.account, 50000, '2026-10-02 10:02:33', 'SUCCESS', 'Axis Bank', 'P2P', '192.168.1.5', randomRef()]);
upiRows.push([txnId++, mule1.upi, mule2.upi, mule1.account, mule2.account, 48500, '2026-10-02 10:08:47', 'SUCCESS', 'Paytm', 'P2P', mule1.ip, randomRef()]);
upiRows.push([txnId++, mule2.upi, mule3.upi, mule2.account, mule3.account, 47000, '2026-10-02 10:12:19', 'SUCCESS', 'GPay', 'P2P', mule2.ip, randomRef()]);
upiRows.push([txnId++, victims.Ramesh.upi, randomUPI(), victims.Ramesh.account, randomAccount(), 1500, '2026-09-30 14:20:00', 'SUCCESS', 'Axis Bank', 'P2M', '192.168.1.5', randomRef()]);
upiRows.push([txnId++, victims.Ramesh.upi, randomUPI(), victims.Ramesh.account, randomAccount(), 299, '2026-10-01 09:15:00', 'SUCCESS', 'Axis Bank', 'P2M', '192.168.1.5', randomRef()]);
upiRows.push([txnId++, randomUPI(), mule1.upi, randomAccount(), mule1.account, 8000, '2026-10-01 15:45:00', 'SUCCESS', 'SBI', 'P2P', randomIP(), randomRef()]);

for (let i = 0; i < 3; i++) {
    upiRows.push([txnId++, randomUPI(), randomUPI(), randomAccount(), randomAccount(), Math.floor(Math.random() * 5000), formatDate(randomDate(new Date('2026-10-02 08:00:00'), new Date('2026-10-02 12:00:00'))), 'SUCCESS', 'HDFC', 'P2P', randomIP(), randomRef()]);
}
upiRows.sort((a, b) => a[6].localeCompare(b[6]));
fs.writeFileSync('sample_upi.csv', buildCsv(upiHeaders, upiRows));

// 3. generate sample_ipdr.csv
const ipdrHeaders = ['session_id', 'ip_address', 'mac_address', 'phone_number', 'imei', 'session_start', 'session_end', 'data_transferred_mb', 'isp', 'device_model'];
let ipdrRows: any[] = [];
let sessionId = 5000;

function randomMac() {
    return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]);
}

ipdrRows.push([sessionId++, suspect.ip, randomMac(), suspect.phone, suspect.imei, '2026-10-02 09:45:00', '2026-10-02 10:30:00', 12.5, 'Reliance Jio', 'Samsung Galaxy M32']);
ipdrRows.push([sessionId++, mule1.ip, randomMac(), mule1.phone, mule1.imei, '2026-10-02 10:00:00', '2026-10-02 10:45:00', 8.2, 'Bharti Airtel', 'Samsung Galaxy M32']); // Same IP and IMEI
ipdrRows.push([sessionId++, mule2.ip, randomMac(), mule2.phone, mule2.imei, '2026-10-02 10:05:00', '2026-10-02 11:00:00', 15.1, 'Vodafone Idea', 'Redmi Note 11']);
ipdrRows.push([sessionId++, mule3.ip, randomMac(), mule3.phone, mule3.imei, '2026-10-02 10:10:00', '2026-10-02 11:15:00', 22.4, 'Vodafone Idea', 'Vivo V21']);

for (let i = 0; i < 4; i++) {
    ipdrRows.push([sessionId++, randomIP(), randomMac(), randomPhone(), randomIMEI(), formatDate(randomDate(new Date('2026-10-02 08:00:00'), new Date('2026-10-02 12:00:00'))), formatDate(randomDate(new Date('2026-10-02 12:00:00'), new Date('2026-10-02 16:00:00'))), Math.floor(Math.random() * 100), 'BSNL', 'Realme 8i']);
}
ipdrRows.sort((a, b) => a[5].localeCompare(b[5]));
fs.writeFileSync('sample_ipdr.csv', buildCsv(ipdrHeaders, ipdrRows));

// 4. generate sample_bank.csv
const bankHeaders = ['entry_id', 'account_number', 'transaction_ref', 'credit_amount', 'debit_amount', 'balance_after', 'timestamp', 'transaction_type', 'counterparty_name', 'counterparty_account', 'narration', 'branch_ifsc'];
let bankRows: any[] = [];
let entryId = 8000;

bankRows.push([entryId++, victims.Ramesh.account, randomRef(), 50000, 0, 117400, '2026-09-28 10:00:00', 'NEFT', 'Employer', randomAccount(), 'Salary', 'HDFC0001234']);
bankRows.push([entryId++, victims.Ramesh.account, randomRef(), 0, 1500, 115900, '2026-09-30 14:20:00', 'UPI/P2M', 'Grocery Store', randomAccount(), 'Grocery', 'HDFC0001234']);
bankRows.push([entryId++, victims.Ramesh.account, randomRef(), 0, 299, 115601, '2026-10-01 09:15:00', 'UPI/P2M', 'Telecom', randomAccount(), 'Mobile Recharge', 'HDFC0001234']);
bankRows.push([entryId++, victims.Ramesh.account, 'UPI' + txnId, 0, 50000, 65601, '2026-10-02 10:02:33', 'UPI/P2P', 'Mule 1', mule1.account, 'Transfer', 'HDFC0001234']);

bankRows.push([entryId++, mule1.account, 'UPI' + txnId, 50000, 0, 50200, '2026-10-02 10:02:33', 'UPI/P2P', 'Ramesh Sharma', victims.Ramesh.account, 'Transfer', 'PYTM0000001']);
bankRows.push([entryId++, mule1.account, randomRef(), 0, 48500, 1700, '2026-10-02 10:08:47', 'UPI/P2P', 'Mule 2', mule2.account, 'Transfer', 'PYTM0000001']);

bankRows.push([entryId++, mule3.account, randomRef(), 47000, 0, 47500, '2026-10-02 10:12:19', 'UPI/P2P', 'Mule 2', mule2.account, 'Transfer', 'YBL0000001']);
bankRows.push([entryId++, mule3.account, randomRef(), 0, 46000, 1500, '2026-10-02 10:21:04', 'ATM-WDL', 'ATM', '', 'ATM Withdrawal', 'YBL0000001']);

fs.writeFileSync('sample_bank.csv', buildCsv(bankHeaders, bankRows));

// 5. generate sample_chat.txt
const chatLines = [
    "[10:15, 30/09/2026] Unknown: bhai tera account 2-3 din ke liye chahiye, koi risk nahi, 30% commission pakka milega",
    "[10:18, 30/09/2026] Ravi: pakka na? police ka koi chakkar toh nahi hoga?",
    "[10:20, 30/09/2026] Unknown: arre nahi bhai, main baitha hu na. tension mat le",
    "[14:30, 01/10/2026] Unknown: tera upi id bhej jaldi",
    "[14:35, 01/10/2026] Ravi: cashout.mule1@paytm",
    "[14:40, 01/10/2026] Unknown: thk hai",
    "[09:00, 02/10/2026] Unknown: aaj kaam hoga, ready reh",
    "[09:05, 02/10/2026] Ravi: haan bhai ready hu",
    "[09:48, 02/10/2026] Unknown: <Media omitted>",
    "[09:49, 02/10/2026] Unknown: 50 hazaar aane wale hain",
    "[09:55, 02/10/2026] Unknown: OTP share mat karna apna, bas receive karna hai",
    "[10:05, 02/10/2026] Unknown: abhi transfer aaya? forward kar 9811223344@gpay pe",
    "[10:07, 02/10/2026] Ravi: haan aaya, kar raha hu",
    "[10:10, 02/10/2026] Ravi: kar diya forward",
    "[10:15, 02/10/2026] Unknown: kaam ho gaya, kal milte hain, cash leke",
    "[10:20, 02/10/2026] Unknown: phone band kar ab",
    "[10:25, 02/10/2026] Unknown: aur koi puche toh 9811234567 pe call kar"
];

for(let i=0; i<18; i++) {
    chatLines.unshift(`[09:00, 28/09/2026] Unknown: msg ${i}`);
}

fs.writeFileSync('sample_chat.txt', chatLines.join('\n'));

// 6. generate sample_email.eml
const emlContent = `Delivered-To: rameshsharma99@gmail.com
Received: by 2002:a05:6a11:1111:0:0:0:0 with SMTP id 12345;
        Thu, 01 Oct 2026 14:22:15 -0700 (PDT)
Return-Path: <sbi.alert.secure@gmail.com>
Received: from mail-oo1-f49.google.com (mail-oo1-f49.google.com. [45.134.212.73])
        by mx.google.com with ESMTPS id 67890
        for <rameshsharma99@gmail.com>
        (version=TLS1_3 cipher=TLS_AES_128_GCM_SHA256 bits=128/128);
        Thu, 01 Oct 2026 14:22:15 -0700 (PDT)
From: "SBI Security" <sbi.alert.secure@gmail.com>
To: rameshsharma99@gmail.com
Subject: URGENT: Your SBI account will be blocked - Verify NOW
Date: Thu, 01 Oct 2026 14:22:10 -0700
Message-ID: <9876543210@mail.gmail.com>
X-Originating-IP: 45.134.212.73
Content-Type: text/html; charset="UTF-8"

<html>
<body>
<p>Dear Customer,</p>
<p>Your account will be blocked in 24 hours due to suspicious activity. Please call our helpline immediately to verify your identity.</p>
<p><strong>Helpline: 9811234567</strong></p>
<button style="padding:10px; background-color:blue; color:white;">Login to SBI</button>
</body>
</html>`;

fs.writeFileSync('sample_email.eml', emlContent);

console.log("ENTITY LINK SUMMARY");
console.log("===================");
console.log("IMEI 358234091674523 -> CDR rows (suspect & mule1) + IPDR rows (suspect & mule1)");
console.log("IP 103.45.67.89      -> IPDR rows (suspect & mule1) + UPI rows (mule1)");
console.log("Phone 9811234567     -> CDR rows + IPDR row + Email body + Chat file");
console.log("IP 182.72.114.56     -> IPDR rows (mule2 & mule3) + UPI rows (mule2)");
