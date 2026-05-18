const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let users = [
  {
    id: 1,
    email: "student@sm.imamu.edu.sa",
    password: "1234",
    role: "rider",
  },
];

let rides = [];
let rideIdCounter = 1;

let requests = [];
let costSplits = [];
let payments = [];
let sosReports = [];

app.get("/", (req, res) => {
  res.send("Student Ride-Sharing API is running ✅");
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many login attempts. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/api/signup", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ error: "Email, password, and role are required." });
  }

  if (!email.endsWith("@sm.imamu.edu.sa")) {
    return res
      .status(400)
      .json({ error: "Please use your university email (@sm.imamu.edu.sa)." });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(400).json({ error: "User already exists." });
  }

  const newUser = {
    id: users.length + 1,
    email,
    password,
    role,
  };

  users.push(newUser);

  res.json({ message: "Signup successful", userId: newUser.id, role });
});

app.post("/api/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.json({
    message: "Login successful",
    userId: user.id,
    role: user.role,
  });
});

app.post("/api/rides", (req, res) => {
  const { driverId, from, to, time, seats, basePrice } = req.body;

  if (!driverId || !from || !to || !time || !seats || !basePrice) {
    return res.status(400).json({
      error: "driverId, from, to, time, seats, and basePrice are required.",
    });
  }

  const perRider = Number(basePrice) / Number(seats);

  const newRide = {
    id: rideIdCounter++,
    driverId: Number(driverId),
    from,
    to,
    time,
    seats: Number(seats),
    basePrice: Number(basePrice),
    perRider: Number(perRider.toFixed(2)),
  };

  rides.push(newRide);
  res.json({ message: "Ride created", ride: newRide });
});

app.get("/api/rides", (req, res) => {
  const { from, to } = req.query;

  let result = rides;

  if (from) {
    result = result.filter((r) =>
      r.from.toLowerCase().includes(from.toLowerCase())
    );
  }

  if (to) {
    result = result.filter((r) =>
      r.to.toLowerCase().includes(to.toLowerCase())
    );
  }

  res.json(result);
});

app.post("/api/requests", (req, res) => {
  const { rideId, studentId } = req.body;

  if (!rideId || !studentId) {
    return res
      .status(400)
      .json({ error: "rideId and studentId are required." });
  }

  const ride = rides.find((r) => r.id === Number(rideId));
  if (!ride) {
    return res.status(404).json({ error: "Ride not found." });
  }

  const newRequest = {
    id: requests.length + 1,
    rideId: Number(rideId),
    studentId: Number(studentId),
    status: "pending",
  };

  requests.push(newRequest);
  res.json({ message: "Request created", request: newRequest });
});

app.get("/api/requests", (req, res) => {
  const { studentId } = req.query;

  let result = requests;

  if (studentId) {
    result = result.filter((r) => r.studentId === Number(studentId));
  }

  res.json(result);
});

app.patch("/api/requests/:id", (req, res) => {
  const reqId = Number(req.params.id);
  const { status } = req.body;

  const request = requests.find((r) => r.id === reqId);
  if (!request) {
    return res.status(404).json({ error: "Request not found." });
  }

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  request.status = status;
  res.json({ message: "Request updated.", request });
});

app.post("/api/payment", (req, res) => {
  const { rideId, studentId, amount, method } = req.body;

  if (!rideId || !studentId || !amount || !method) {
    return res.status(400).json({
      error: "rideId, studentId, amount, and method are required.",
    });
  }

  const payment = {
    id: payments.length + 1,
    rideId: Number(rideId),
    studentId: Number(studentId),
    amount: Number(amount),
    method,
    createdAt: new Date().toISOString(),
  };

  payments.push(payment);
  res.json({ message: "Payment recorded (mock)", payment });
});

app.post("/api/sos", (req, res) => {
  const { rideId, type, description } = req.body;

  if (!type || !description) {
    return res
      .status(400)
      .json({ error: "type and description are required." });
  }

  const report = {
    id: sosReports.length + 1,
    rideId: rideId ? Number(rideId) : null,
    type,
    description,
    createdAt: new Date().toISOString(),
  };

  sosReports.push(report);
  res.json({ message: "SOS report stored (mock)", report });
});

const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encryptData(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

const sensitiveInfo = "User_Payment_Token_12345";
const protectedData = encryptData(sensitiveInfo);

console.log("Original Data: " + sensitiveInfo);
console.log("Protected Layer (Encrypted): " + protectedData);

app.listen(PORT, () => {
  console.log(`✅ Student Ride-Sharing API running on http://localhost:${PORT}`);
});