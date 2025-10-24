declare module "../firebaseAdmin.mjs" {
  import admin from "firebase-admin";
  export const db: FirebaseFirestore.Firestore;
  export const bucket: admin.storage.Storage['bucket'];
  export default admin;
}
