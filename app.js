const express = require("express");

const app = express();
app.use(express.json());

// Bypass-Listen
const bypassGetUsers = ["admin", "support"];
const bypassGetAdmin = ["admin"];

// Benutzer
const users = [
  { id: 1, username: "ken", role: "admin", region: "CH" },
  { id: 2, username: "bob", role: "support", region: "CH" },
  { id: 3, username: "carla", role: "support", region: "DE" },
  { id: 4, username: "david", role: "user", region: "CH" },
  { id: 5, username: "emma", role: "user", region: "DE" },
  { id: 6, username: "paul", role: "user", region: "DE" },
  { id: 7, username: "larissa", role: "user", region: "FR" },
];

// Bestellungen
const orders = [
  {
    id: 1774324246475,
    ownerId: 4,
    region: "CH",
    item: "Notebook 1",
    amount: 1400,
    internalNote: "Schlechte Zahlungsmoral",
  },
  {
    id: 1774324256808,
    ownerId: 4,
    region: "CH",
    item: "TV",
    amount: 1740,
    internalNote: "Vorkasse anfordern",
  },
  {
    id: 1774324264910,
    ownerId: 5,
    region: "DE",
    item: "PlayStation 5",
    amount: 800,
    internalNote: "",
  },
  {
    id: 1774324273622,
    ownerId: 5,
    region: "DE",
    item: "Notebook 2",
    amount: 890,
    internalNote: "",
  },
  {
    id: 1774324280555,
    ownerId: 6,
    region: "DE",
    item: "Book 1",
    amount: 56,
    internalNote: "",
  },
  {
    id: 1774324288338,
    ownerId: 7,
    region: "DE",
    item: "Laser Pointer",
    amount: 32,
    internalNote: "Ist unfreundlich",
  },
  {
    id: 1774324297536,
    ownerId: 3,
    region: "FR",
    item: "Notebook 3",
    amount: 3100,
    internalNote: "",
  },
  {
    id: 1774324357500,
    ownerId: 2,
    region: "DE",
    item: "Book 2",
    amount: 76,
    internalNote: "",
  },
];

function findUserById(id) {
  return users.find((u) => u.id === id);
}

function findUserByUsername(username) {
  return users.find((u) => u.username === username);
}

function findOrderById(id) {
  return orders.find((o) => o.id === id);
}

// Auth-Middleware
app.use((req, res, next) => {
  const userId = Number(req.header("x-user-id"));
  const role = req.header("x-role");
  const region = req.header("x-region");

  const dbUser = findUserById(userId);

  if (!dbUser) {
    req.user = null;
    return next();
  }

  req.user = {
    id: dbUser.id,
    username: dbUser.username,
    role: role || dbUser.role,
    region: region || dbUser.region,
  };

  next();
});

app.get("/users", (req, res) => {
  if (req.user === null) {
    return res.status(404).json({ error: "User not found" });
  } else if (bypassGetUsers.includes(req.user.role)) {
    res.json(users);
  } else {
    res.status(403).json({ error: "Forbidden" });
  }
});

app.get("/admin", (req, res) => {
  if (req.user === null) {
    return res.status(404).json({ error: "User not found" });
  } else if (bypassGetAdmin.includes(req.user.role)) {
    return res.json({ message: "Admin access granted" });
  } else {
    res.status(403).json({ error: "Forbidden" });
  }
});

app.get("/orders/:id", (req, res) => {
  const orderId = Number(req.params.id);
  if (Number.isNaN(orderId)) {
    return res.status(400).json({ error: "Bad Request" });
  }

  const order = findOrderById(orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (req.user === null) {
    return res.status(404).json({ error: "User not found" });
  }

  switch (req.user?.role) {
    case "admin":
      return res.json(order);

    case "support":
      if (order.region === req.user.region) {
        return res.json(order);
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }

    case "user":
      if (order.ownerId === req.user.id) {
        return res.json(order);
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }

    case undefined:
      return res.status(404).json({ error: "User not found" });

    default:
      return res.status(403).json({ error: "Forbidden" });
  }
});

app.get("/orders", (req, res) => {
  res.json(orders);
});

app.post("/orders/create", (req, res) => {
  const newOrder = {
    id: Date.now(),
    ...req.body,
  };

  orders.push(newOrder);

  res.json(newOrder);
});

app.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
