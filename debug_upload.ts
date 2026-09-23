import fs from "fs";
import path from "path";
import FormData from "form-data";

async function run() {
  const caseNumber = "KRN-20260921-ABCD";
  
  const formData = new FormData();
  formData.append("files", fs.createReadStream(path.join(process.cwd(), "package.json"))); // Add a text file (TXT)

  try {
    const res = await fetch(`http://localhost:3000/api/cases/${caseNumber}/evidence`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run();
