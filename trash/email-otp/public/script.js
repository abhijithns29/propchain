async function sendOTP() {
  const email = document.getElementById("email").value;
  const res = await fetch("/api/send-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  document.getElementById("log").innerText = data.message || data.error;
}

async function verifyOTP() {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;

  const res = await fetch("/api/verify-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, otp })
  });
  const data = await res.json();
  document.getElementById("log").innerText = data.message || data.error;
}
