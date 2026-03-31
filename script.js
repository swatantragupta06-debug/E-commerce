import {
  auth, db, isAdmin,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from './firebase.js';

import {
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

let currentUser = null;
let allProducts = [];

// ================= INIT =================
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (document.body.classList.contains('login-page')) {
    initLogin();
  } else if (window.location.pathname.includes('admin.html')) {
    initAdmin();
  } else {
    initMain();
  }
});

// ================= LOGIN =================
function initLogin() {

  // CUSTOMER LOGIN
  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
      window.location.href = "index.html";
    } catch {
      showError("Invalid login");
    }
  });

  // SIGNUP
  document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const user = await createUserWithEmailAndPassword(auth, signupEmail.value, signupPassword.value);

      await addDoc(collection(db, "users"), {
        uid: user.user.uid,
        name: signupName.value,
        email: signupEmail.value,
        ordersCount: 0
      });

      window.location.href = "index.html";
    } catch {
      showError("Signup failed");
    }
  });

  // 🔥 ADMIN LOGIN FIXED
  document.getElementById("adminLoginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = adminEmail.value.trim().toLowerCase();
    const password = adminPassword.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (email !== "swatantragupta06@gmail.com") {
        showError("Access Denied");
        await signOut(auth);
        return;
      }

      window.location.href = "admin.html";
    } catch {
      showError("Admin login failed");
    }
  });

  // 🔥 GOOGLE LOGIN
  const provider = new GoogleAuthProvider();

  document.getElementById("googleLogin")?.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
      window.location.href = "index.html";
    } catch {
      showError("Google login failed");
    }
  });
}

// ================= MAIN =================
function initMain() {

  document.getElementById("loginBtn")?.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await signOut(auth);
    location.reload();
  });

  loadProducts();

  if (currentUser) {
    loadOrders();
  }

  // 🔍 SEARCH BAR
  document.getElementById("searchBar")?.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(value));
    renderProducts(filtered);
  });
}

// ================= PRODUCTS =================
async function loadProducts() {
  const container = document.getElementById("productsContainer");
  if (!container) return;

  const snapshot = await getDocs(collection(db, "products"));
  allProducts = [];

  snapshot.forEach(docSnap => {
    const p = docSnap.data();
    p.id = docSnap.id;
    allProducts.push(p);
  });

  renderProducts(allProducts);
}

function renderProducts(products) {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";

  products.forEach(p => {
    container.innerHTML += `
      <div class="product-card">
        <img src="${p.image}" class="product-image">
        <h3>${p.name}</h3>
        <p class="product-price">₹${p.price}</p>
        <button class="buy-btn" onclick="openOrder('${p.id}','${p.name}',${p.price})">Buy</button>
      </div>
    `;
  });
}

// ================= ORDER =================
window.openOrder = function(id, name, price) {
  document.getElementById("orderModal").style.display = "block";
  selectedProductId.value = id;
  selectedProductName.value = name;
  selectedProductPrice.value = price;
};

document.getElementById("orderForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (customerPhone.value.length !== 10) {
    alert("Enter valid phone");
    return;
  }

  if (customerCity.value.toLowerCase() !== "hardoi") {
    alert("Only Hardoi allowed");
    return;
  }

  let deliveryCharge = 0;

  const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
  userSnap.forEach(u => {
    deliveryCharge = u.data().ordersCount === 0 ? 0 : 20;
  });

  await addDoc(collection(db, "orders"), {
    userId: currentUser.uid,
    name: customerName.value,
    phone: customerPhone.value,
    address: customerAddress.value,
    city: customerCity.value,
    productName: selectedProductName.value,
    price: selectedProductPrice.value,
    deliveryCharge,
    status: "Pending",
    date: new Date().toLocaleString()
  });

  alert("Order placed!");
  location.reload();
});

// ================= USER ORDERS =================
async function loadOrders() {
  const container = document.getElementById("ordersContainer");
  if (!container) return;

  const q = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
  const snap = await getDocs(q);

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const o = docSnap.data();

    container.innerHTML += `
      <div class="order-card status-${o.status.toLowerCase()}">
        <p>${o.productName}</p>
        <p>₹${o.price}</p>
        <span class="status-badge">${o.status}</span>
        ${o.status === "Pending" ? `<button onclick="cancelOrder('${docSnap.id}')" class="cancel-btn">Cancel</button>` : ""}
      </div>
    `;
  });
}

window.cancelOrder = async function(id) {
  await updateDoc(doc(db, "orders", id), { status: "Cancelled" });
  location.reload();
};

// ================= ADMIN =================
function initAdmin() {

  if (!isAdmin(currentUser)) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  loadAdminProducts();
  loadAdminOrders();

  document.getElementById("addProductForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    await addDoc(collection(db, "products"), {
      name: productName.value,
      price: productPrice.value,
      image: productImage.value,
      description: productDesc.value
    });

    alert("Product added");
    location.reload();
  });
}

// ================= ADMIN PRODUCTS =================
async function loadAdminProducts() {
  const list = document.getElementById("productsList");
  if (!list) return;

  const snap = await getDocs(collection(db, "products"));
  list.innerHTML = "";

  snap.forEach(docSnap => {
    const p = docSnap.data();

    list.innerHTML += `
      <div class="admin-product">
        <span>${p.name} - ₹${p.price}</span>
        <button onclick="deleteProduct('${docSnap.id}')">Delete</button>
      </div>
    `;
  });
}

window.deleteProduct = async function(id) {
  await deleteDoc(doc(db, "products", id));
  location.reload();
};

// ================= ADMIN ORDERS =================
async function loadAdminOrders() {
  const list = document.getElementById("adminOrdersList");
  if (!list) return;

  const snap = await getDocs(collection(db, "orders"));
  list.innerHTML = "";

  snap.forEach(docSnap => {
    const o = docSnap.data();

    list.innerHTML += `
      <div class="order-card">
        <p>${o.name} - ${o.productName}</p>
        <p>${o.phone}</p>
        <button onclick="deliver('${docSnap.id}')">Delivered</button>
        <button onclick="cancelOrder('${docSnap.id}')">Cancel</button>
      </div>
    `;
  });
}

window.deliver = async function(id) {
  await updateDoc(doc(db, "orders", id), { status: "Delivered" });
  location.reload();
};

// ================= ERROR =================
function showError(msg) {
  const err = document.getElementById("errorMessage");
  if (err) {
    err.innerText = msg;
    err.style.display = "block";
  } else {
    alert(msg);
  }
}
