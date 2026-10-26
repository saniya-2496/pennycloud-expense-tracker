// PennyCloud — Firebase web app. Replace firebaseConfig values with your own Firebase web app config.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

 const firebaseConfig = {
    apiKey: "AIzaSyBlFQxo-QnG3bXBRX0tgY2VMmUdOWH7EXE",
    authDomain: "cloudexpensetracker-3c37b.firebaseapp.com",
    projectId: "cloudexpensetracker-3c37b",
    storageBucket: "cloudexpensetracker-3c37b.firebasestorage.app",
    messagingSenderId: "1088448358647",
    appId: "1:1088448358647:web:6639bcb696c251857a0bf2",
    measurementId: "G-9GZ7EWCXYV"
  };
const configReady = !Object.values(firebaseConfig).some(v => v.includes("PASTE_"));

const $ = id => document.getElementById(id);
const authView = $("authView"), dashboardView = $("dashboardView");
let app, auth, db, currentUser = null, expenses = [], authMode = "login", chart = null;
const money = n => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
const today = () => new Date().toISOString().slice(0,10);
const currentMonth = () => today().slice(0,7);
const safeText = value => String(value ?? "");
const categoryEmoji = {Food:"🍜",Transport:"🚌",Education:"📚",Shopping:"🛍️",Bills:"🧾",Health:"💊",Entertainment:"🎬",Other:"✨"};
const chartColors = ["#635bff","#ff9b71","#41b99a","#f3c75f","#4f9fe8","#e76b91","#9b7be7","#a6b0c6"];

function showMessage(el, text, success=false) {
  el.textContent = text; el.classList.toggle("success", success);
}
function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
function setOnline(online) {
  $("connectionStatus").classList.toggle("online", online);
  $("connectionStatus").innerHTML = `<i></i>${online ? "Cloud ready" : "Not connected"}`;
}
function setAuthMode(mode) {
  authMode = mode;
  $("loginTab").classList.toggle("active", mode==="login");
  $("registerTab").classList.toggle("active", mode==="register");
  $("nameLabel").classList.toggle("hidden", mode==="login");
  $("nameInput").required = mode==="register";
  $("authTitle").textContent = mode==="login" ? "Welcome back" : "Create your account";
  $("authSubtitle").textContent = mode==="login" ? "Log in to see your spending dashboard." : "Start building better money habits.";
  $("authSubmit").textContent = mode==="login" ? "Log in" : "Create account";
  $("passwordInput").autocomplete = mode==="login" ? "current-password" : "new-password";
  showMessage($("authMessage"), "");
}
$("loginTab").addEventListener("click",()=>setAuthMode("login"));
$("registerTab").addEventListener("click",()=>setAuthMode("register"));
$("monthFilter").value = currentMonth();
$("dateInput").value = today();

$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  showMessage($("authMessage"), "");
  if (!configReady) {
    showMessage($("authMessage"), "Firebase setup is incomplete. Follow the README and add your config in app.js.");
    $("setupNotice").classList.remove("hidden"); return;
  }
  const email = $("emailInput").value.trim(), password = $("passwordInput").value;
  const button = $("authSubmit"); button.disabled = true; button.textContent = "Please wait…";
  try {
    if (authMode==="register") {
      const credential = await createUserWithEmailAndPassword(auth,email,password);
      const name = $("nameInput").value.trim();
      if (name) await updateProfile(credential.user,{displayName:name});
      showMessage($("authMessage"), "Account created. Loading your dashboard…", true);
    } else {
      await signInWithEmailAndPassword(auth,email,password);
    }
  } catch (err) {
    const messages = {
      "auth/email-already-in-use":"That email already has an account. Try logging in.",
      "auth/invalid-email":"Enter a valid email address.",
      "auth/weak-password":"Use a password with at least 6 characters.",
      "auth/invalid-credential":"Email or password is incorrect.",
      "auth/network-request-failed":"Network error. Check your internet connection."
    };
    showMessage($("authMessage"), messages[err.code] || err.message || "Could not sign in.");
  } finally {
    button.disabled = false; button.textContent = authMode==="login" ? "Log in" : "Create account";
  }
});
$("logoutBtn").addEventListener("click", async()=>{ if(auth) await signOut(auth); });

$("expenseForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser || !db) return;
  const amount = Number($("amountInput").value);
  if (!Number.isFinite(amount) || amount <= 0) { showMessage($("expenseMessage"),"Enter an amount greater than zero."); return; }
  const title = $("titleInput").value.trim();
  if (!title) { showMessage($("expenseMessage"),"Enter an expense name."); return; }
  const payload = {
    title, amount: Math.round(amount*100)/100, category:$("categoryInput").value,
    paymentMethod:$("paymentInput").value, date:$("dateInput").value,
    notes:$("notesInput").value.trim(), updatedAt:serverTimestamp()
  };
  if (!payload.date) { showMessage($("expenseMessage"),"Choose a date."); return; }
  const id = $("expenseId").value;
  const button = $("saveExpenseBtn"); button.disabled=true; button.textContent="Saving…";
  try {
    if (id) {
      await updateDoc(doc(db,"users",currentUser.uid,"expenses",id),payload);
      toast("Expense updated.");
    } else {
      await addDoc(collection(db,"users",currentUser.uid,"expenses"),{...payload,createdAt:serverTimestamp()});
      toast("Expense saved to the cloud.");
    }
    resetExpenseForm(); await loadExpenses();
    showMessage($("expenseMessage"),"Saved successfully.",true);
  } catch(err) {
    showMessage($("expenseMessage"),"Could not save. Check your Firestore setup and security rules.");
    console.error(err);
  } finally { button.disabled=false; button.textContent="Save expense"; }
});
$("cancelEditBtn").addEventListener("click",resetExpenseForm);
$("monthFilter").addEventListener("change",renderDashboard);
$("categoryFilter").addEventListener("change",renderTransactions);
$("searchInput").addEventListener("input",renderTransactions);
$("exportBtn").addEventListener("click",exportCSV);

function resetExpenseForm() {
  $("expenseForm").reset(); $("expenseId").value=""; $("formTitle").textContent="Add an expense";
  $("saveExpenseBtn").textContent="Save expense"; $("cancelEditBtn").classList.add("hidden");
  $("dateInput").value=today(); showMessage($("expenseMessage"),"");
}
function expenseCollection() { return collection(db,"users",currentUser.uid,"expenses"); }
async function loadExpenses() {
  if (!currentUser || !db) return;
  try {
    const q = query(expenseCollection(),orderBy("date","desc"));
    const snap = await getDocs(q);
    expenses = snap.docs.map(d=>({id:d.id,...d.data()}));
    setOnline(true); renderDashboard();
  } catch(err) {
    console.error(err); setOnline(false);
    toast("Could not load records. Check Firestore rules.");
  }
}
function monthExpenses() {
  const month = $("monthFilter").value || currentMonth();
  return expenses.filter(x=>String(x.date||"").startsWith(month));
}
function renderDashboard() {
  const list = monthExpenses();
  const total = list.reduce((sum,x)=>sum+Number(x.amount||0),0);
  const largest = list.reduce((best,x)=>Number(x.amount||0)>Number(best?.amount||0)?x:best,null);
  $("totalSpent").textContent=money(total);
  $("transactionCount").textContent=String(list.length);
  $("largestExpense").textContent=money(largest?.amount||0);
  $("largestExpenseLabel").textContent=largest ? largest.title : "No expenses yet";
  renderChart(list); renderTransactions();
}
function renderChart(list) {
  const sums = {};
  list.forEach(x=>{const c=x.category||"Other";sums[c]=(sums[c]||0)+Number(x.amount||0);});
  const labels=Object.keys(sums), values=labels.map(k=>sums[k]);
  $("emptyChart").classList.toggle("hidden",labels.length>0);
  $("categoryLegend").innerHTML="";
  labels.forEach((label,i)=>{
    const item=document.createElement("span"); item.className="legend-item";
    const dot=document.createElement("i"); dot.className="legend-dot"; dot.style.background=chartColors[i%chartColors.length];
    const text=document.createElement("span"); text.textContent=`${categoryEmoji[label]||"•"} ${label}: ${money(sums[label])}`;
    item.append(dot,text); $("categoryLegend").append(item);
  });
  if(chart) chart.destroy();
  chart = new Chart($("categoryChart"),{
    type:"doughnut", data:{labels,datasets:[{data:values,backgroundColor:labels.map((_,i)=>chartColors[i%chartColors.length]),borderWidth:0,hoverOffset:5}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:"67%",plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${money(ctx.raw)}`}}}}
  });
}
function renderTransactions() {
  const search=$("searchInput").value.trim().toLowerCase(), cat=$("categoryFilter").value;
  const list=monthExpenses().filter(x=>(cat==="All"||x.category===cat)&&[x.title,x.category,x.paymentMethod,x.notes].some(v=>safeText(v).toLowerCase().includes(search)));
  const tbody=$("expenseRows"); tbody.replaceChildren();
  list.forEach(x=>{
    const tr=document.createElement("tr");
    const td=(cls="")=>{const e=document.createElement("td");if(cls)e.className=cls;return e;};
    const titleTd=td();const name=document.createElement("div");name.className="expense-name";name.textContent=x.title||"Untitled";
    titleTd.append(name);if(x.notes){const note=document.createElement("div");note.className="expense-note";note.textContent=x.notes;titleTd.append(note);}tr.append(titleTd);
    const catTd=td();const pill=document.createElement("span");pill.className="category-pill";pill.textContent=`${categoryEmoji[x.category]||"✨"} ${x.category||"Other"}`;catTd.append(pill);tr.append(catTd);
    const dateTd=td();dateTd.textContent=x.date||"—";tr.append(dateTd);
    const payTd=td();payTd.textContent=x.paymentMethod||"—";tr.append(payTd);
    const amountTd=td("align-right amount");amountTd.textContent=money(x.amount);tr.append(amountTd);
    const actions=td();actions.className="row-actions";
    const edit=document.createElement("button");edit.className="text-btn";edit.textContent="Edit";edit.addEventListener("click",()=>startEdit(x));
    const del=document.createElement("button");del.className="text-btn delete";del.textContent="Delete";del.addEventListener("click",()=>removeExpense(x));
    actions.append(edit,del);tr.append(actions);tbody.append(tr);
  });
  $("emptyTransactions").classList.toggle("hidden",list.length>0);
}
function startEdit(x) {
  $("expenseId").value=x.id; $("titleInput").value=x.title||""; $("amountInput").value=x.amount;
  $("categoryInput").value=x.category||"Other"; $("paymentInput").value=x.paymentMethod||"UPI";
  $("dateInput").value=x.date||today(); $("notesInput").value=x.notes||"";
  $("formTitle").textContent="Edit expense"; $("saveExpenseBtn").textContent="Update expense";
  $("cancelEditBtn").classList.remove("hidden"); $("expenseForm").scrollIntoView({behavior:"smooth",block:"start"});
}
async function removeExpense(x) {
  if(!confirm(`Delete "${x.title}" (${money(x.amount)})? This cannot be undone.`))return;
  try { await deleteDoc(doc(db,"users",currentUser.uid,"expenses",x.id)); await loadExpenses(); toast("Expense deleted."); }
  catch(err){console.error(err);toast("Could not delete this expense.");}
}
function exportCSV() {
  const list=monthExpenses().filter(x=>{const cat=$("categoryFilter").value, s=$("searchInput").value.trim().toLowerCase();return(cat==="All"||x.category===cat)&&[x.title,x.category,x.paymentMethod,x.notes].some(v=>safeText(v).toLowerCase().includes(s));});
  if(!list.length){toast("No matching expenses to export.");return;}
  const fields=["title","amount","category","date","paymentMethod","notes"];
  const escape=v=>`"${safeText(v).replaceAll('"','""')}"`;
  const csv=[fields.join(","),...list.map(x=>fields.map(k=>escape(x[k])).join(","))].join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
  const a=document.createElement("a");a.href=url;a.download=`pennycloud-expenses-${$("monthFilter").value||currentMonth()}.csv`;a.click();URL.revokeObjectURL(url);
}
function showDashboard(user) {
  currentUser=user; authView.classList.add("hidden");dashboardView.classList.remove("hidden");$("logoutBtn").classList.remove("hidden");
  $("setupNotice").classList.add("hidden"); loadExpenses();
}
function showLogin() {
  currentUser=null;expenses=[];dashboardView.classList.add("hidden");authView.classList.remove("hidden");$("logoutBtn").classList.add("hidden");setOnline(false);
  if(chart){chart.destroy();chart=null;}
}
if(!configReady) {
  $("setupNotice").classList.remove("hidden");
  $("authMessage").textContent="Before using the app, complete the Firebase setup described in README.md.";
} else {
  try {
    app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
    onAuthStateChanged(auth,user=>user?showDashboard(user):showLogin());
  } catch(err) {
    console.error(err);$("setupNotice").classList.remove("hidden");
    showMessage($("authMessage"),"Firebase initialization failed. Double-check the configuration in app.js.");
  }
}
