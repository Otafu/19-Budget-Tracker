let db;

function dbLogger(message) {
  console.debug("DB: " + message);
}
function dbErrorLogger(message) {
  console.debug("DB:Error " + message);
}

// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open("budget_tracker", 1);

// this event will emit if the database version changes
request.onupgradeneeded = function (event) {
  console.debug("upgrade needed here");
  db = event.target.result;
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
  console.debug("successful connection");
  // when db is successfully created with its object store or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // if online, perform upload transaction
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  // log error here
  dbErrorLogger(event.target.errorCode);
};

function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access the object store for `new_transaction`
  const budgetObjectStore = transaction.objectStore("new_transaction");

  // add record to your store with add method
  budgetObjectStore.add(record);
}

function uploadTransaction() {
  dbLogger("uploading transactions...");
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // reference on object store
  const budgetObjectStore = transaction.objectStore("new_transaction");

  // fetch all stored records, and create reference
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    // synching data to remote api
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");

          // access the new_transaction object store
          const budgetObjectStore = transaction.objectStore("new_transaction");

          // clear all items in your store
          budgetObjectStore.clear();

          console.debug("All saved transactions has been submitted!");
          alert("All saved transactions has been submitted!");
        })
        .catch((err) => {
          dbErrorLogger(error);
        });
    }
  };
}

// trigger when reconected online
window.addEventListener("online", uploadTransaction);
