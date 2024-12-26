// Firebase Security Rules
export const firebaseRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isFinanceRole() {
      let userData = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return isAuthenticated() && 
        (userData.role == 'admin' || 
         userData.role == 'finance_manager' || 
         userData.role == 'finance');
    }

    // Player financials collection
    match /player_financials/{document=**} {
      allow read: if isFinanceRole();
      allow write: if isFinanceRole();
    }

    // Bank accounts collection
    match /bank-accounts/{document=**} {
      allow read: if isFinanceRole();
      allow write: if isAdmin();
    }

    // Bank accounts collection
    match /bank_accounts/{document=**} {
      allow read: if isFinanceRole();
      allow write: if isAdmin();
    }

    // Income collection
    match /income/{document=**} {
      allow read: if isFinanceRole();
      allow write: if isFinanceRole();
    }

    // Expenses collection
    match /expenses/{document=**} {
      allow read: if isFinanceRole();
      allow write: if isFinanceRole();
    }

    // Bank fees collection
    match /bank-fees/{document=**} {
      allow read: if isFinanceRole();
      allow write: if isAdmin();
    }

    // Bank statements collection
    match /bank-statements/{document=**} {
      allow read: if isFinanceRole();
      allow write: if isAdmin();
    }

    // Finance collection
    match /finance/{document=**} {
      allow read: if isFinanceRole();
      allow write: if isFinanceRole();
    }
  }
}`; 