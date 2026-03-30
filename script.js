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

let currentUser = null;

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

  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginEmail.value;
    const password = loginPassword.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "index.html";
    } catch {
      showError("Invalid login");
    }
  });

  document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = signupEmail.value;
    const password = signupPassword.value;
    const name = signupName.value;

    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);

      await addDoc(collection(db, "users"), {
        uid: user.user.uid,
        name,
        email,
        ordersCount: 0
      });

      window.location.href = "index.html";
    } catch {
      showError("Signup failed");
    }
  });

  document.getElementById("adminLoginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = adminEmail.value;
    const password = adminPassword.value;

    if (email !== "swatantragupta06@gmail.com" || password !== "Swatantra@9935") {
      showError("Access Denied");
      return;
    }

    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "admin.html";
  });
}

// ================= MAIN PAGE =================
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
}

// ================= PRODUCTS =================
async function loadProducts() {
  const container = document.getElementById("productsContainer");
  if (!container) return;

  const snapshot = await getDocs(collection(db, "products"));
  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const p = docSnap.data();

    container.innerHTML += `
      <div class="product-card">
        <img src="${p.image}" class="product-image">
        <h3>${p.name}</h3>
        <p class="product-price">₹${p.price}</p>
        <button class="buy-btn" onclick="openOrder('${docSnap.id}','${p.name}',${p.price})">Buy</button>
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

  const phone = customerPhone.value;

  if (phone.length !== 10) {
    alert("Enter valid phone");
    return;
  }

  if (customerCity.value.toLowerCase() !== "hardoi") {
    alert("Only Hardoi allowed");
    return;
  }

  const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
  let deliveryCharge = 0;

  userSnap.forEach(u => {
    deliveryCharge = u.data().ordersCount === 0 ? 0 : 20;
  });

  await addDoc(collection(db, "orders"), {
    userId: currentUser.uid,
    name: customerName.value,
    phone,
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

// ================= LOAD ORDERS =================
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
        <div>
          <button onclick="deleteProduct('${docSnap.id}')">Delete</button>
        </div>
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
        <button onclick="deliver('${docSnap.id}')">Mark Delivered</button>
        <button onclick="cancelOrder('${docSnap.id}')">Cancel</button>
        <button onclick="window.open('order-slip.html?id=${docSnap.id}')">Print</button>
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
